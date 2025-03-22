import { Request, Response } from 'express';
import Ticket from '../models/ticket.model';
import Performance from '../models/performance.model';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { sendTicketConfirmationEmail } from '../services/email.service';
import Payment from '../models/payment.model';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any
});

// Create a payment intent (Stripe)
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { ticketIds } = req.body;
    
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide valid ticket IDs'
      });
    }
    
    // Find tickets
    const tickets = await Ticket.find({
      _id: { $in: ticketIds },
      customer: req.user.id,
      status: 'reserved',
      paymentStatus: 'pending'
    }).populate('event', 'title');
    
    if (tickets.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No valid tickets found for payment'
      });
    }
    
    // Calculate total amount
    const amount = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe requires amount in cents
      currency: 'cad',
      metadata: {
        ticketIds: ticketIds.join(','),
        userId: req.user.id
      }
    });
    
    return res.status(200).json({
      status: 'success',
      clientSecret: paymentIntent.client_secret,
      amount
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while creating payment intent'
    });
  }
};

// Confirm payment and update ticket status
export const confirmPayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment intent ID is required'
      });
    }
    
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        status: 'error',
        message: `Payment not successful. Status: ${paymentIntent.status}`
      });
    }
    
    // Extract ticket IDs from metadata
    const ticketIds = paymentIntent.metadata.ticketIds.split(',');
    
    // Update tickets status
    const tickets = await Ticket.find({
      _id: { $in: ticketIds },
      customer: req.user.id,
      status: 'reserved',
      paymentStatus: 'pending'
    }).session(session);
    
    if (tickets.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'error',
        message: 'No valid tickets found for payment confirmation'
      });
    }
    
    // Update each ticket
    for (const ticket of tickets) {
      ticket.status = 'purchased';
      ticket.paymentStatus = 'paid' as any;
      ticket.paymentMethod = 'credit_card';
      await ticket.save({ session });
      
      // Send confirmation email
      try {
        const eventDoc = await ticket.populate('event');
        const performanceDoc = await ticket.populate('performance');
        
        await sendTicketConfirmationEmail(
          req.user.email,
          `${req.user.firstName} ${req.user.lastName}`,
          eventDoc.event.title,
          ticket.ticketNumber,
          performanceDoc.performance.date,
          eventDoc.event.venue?.name || 'Venue'
        );
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Continue even if email fails - we don't want to roll back the transaction
      }
    }
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      status: 'success',
      message: 'Payment confirmed and tickets updated',
      tickets: tickets.map(ticket => ({
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventTitle: ticket.event.title,
        status: ticket.status,
        paymentStatus: ticket.paymentStatus
      }))
    });
  } catch (error: any) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();
    
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while confirming payment'
    });
  }
};

// Cancel a payment and release tickets
export const cancelPayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { ticketIds } = req.body;
    
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide valid ticket IDs'
      });
    }
    
    // Find tickets
    const tickets = await Ticket.find({
      _id: { $in: ticketIds },
      customer: req.user.id,
      status: { $in: ['reserved', 'purchased'] },
      paymentStatus: { $in: ['pending', 'paid'] }
    }).session(session);
    
    if (tickets.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'error',
        message: 'No valid tickets found for cancellation'
      });
    }
    
    // Update each ticket
    for (const ticket of tickets) {
      const oldStatus = ticket.status;
      
      ticket.status = 'cancelled';
      ticket.paymentStatus = ticket.paymentStatus === 'paid' ? 'refunded' as any : 'cancelled' as any;
      await ticket.save({ session });
      
      // Increase available tickets count in performance if the ticket was previously not cancelled
      if (oldStatus !== 'cancelled') {
        const performanceDoc = await ticket.populate('performance');
        await Performance.findByIdAndUpdate(
          performanceDoc.performance._id,
          { $inc: { availableTickets: 1 } },
          { session }
        );
      }
      
      // If payment was already made, handle refund through Stripe
      if (ticket.paymentStatus === 'refunded') {
        // In a real system, process refund through Stripe here
        // This is just a placeholder comment
      }
    }
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      status: 'success',
      message: `${tickets.length} ticket(s) cancelled successfully`,
      tickets: tickets.map(ticket => ({
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        paymentStatus: ticket.paymentStatus
      }))
    });
  } catch (error: any) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();
    
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while cancelling payment'
    });
  }
};

// Get payment history for current user
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const tickets = await Ticket.find({
      customer: req.user.id,
      paymentStatus: { $in: ['paid', 'refunded'] }
    })
      .sort({ purchaseDate: -1 })
      .populate('event', 'title category')
      .select('ticketNumber event performance purchaseDate price status paymentStatus paymentMethod');
    
    return res.status(200).json({
      status: 'success',
      results: tickets.length,
      payments: tickets
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching payment history'
    });
  }
};

// Create a new payment
export const createPayment = async (req: Request, res: Response) => {
  try {
    const { amount, currency, paymentMethod } = req.body;

    // Validate required fields
    if (!amount || !paymentMethod) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: amount, paymentMethod'
      });
    }

    // In a real application, we would integrate with a payment gateway like Stripe
    // For now, we'll simulate payment processing
    
    // Create payment record
    const payment = new Payment({
      amount,
      currency: currency || 'USD',
      method: 'credit_card',
      status: 'processing',
      paymentMethod: {
        type: 'credit_card',
        last4: paymentMethod.cardNumber.slice(-4),
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
      },
      billingAddress: paymentMethod.billingAddress
    });

    // Simulate payment processing
    // In a real application, this would be handled by the payment gateway
    setTimeout(async () => {
      try {
        payment.status = 'completed';
        await payment.save();
      } catch (error) {
        console.error('Error updating payment status:', error);
      }
    }, 1000);

    await payment.save();

    return res.status(201).json({
      status: 'success',
      message: 'Payment processed successfully',
      success: true,
      payment
    });

  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while processing payment'
    });
  }
};

// Get payment by ID
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      payment
    });
    
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching payment'
    });
  }
};

// Refund a payment
export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }
    
    if (payment.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Only completed payments can be refunded'
      });
    }
    
    // In a real application, we would call the payment gateway's refund API
    // For now, just update the status
    payment.status = 'refunded';
    await payment.save();
    
    return res.status(200).json({
      status: 'success',
      message: 'Payment refunded successfully',
      payment
    });
    
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while refunding payment'
    });
  }
}; 