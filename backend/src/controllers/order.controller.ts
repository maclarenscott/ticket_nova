import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/order.model';
import Ticket from '../models/ticket.model';
import Payment from '../models/payment.model';
import Performance from '../models/performance.model';
import Event from '../models/event.model';
import crypto from 'crypto';
import { generatePDF } from '../services/pdf.service';
import { sendEmail } from '../services/email.service';

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentId, eventId, performanceId, tickets, customerDetails } = req.body;

    // Validate required fields
    if (!paymentId || !eventId || !performanceId || !tickets || !tickets.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: paymentId, eventId, performanceId, tickets'
      });
    }

    // Get payment details
    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    // Verify payment status
    if (payment.status !== 'completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'Payment is not completed'
      });
    }

    // Get event
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }

    // Get performance
    const performance = await Performance.findById(performanceId).session(session);
    if (!performance) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'error',
        message: 'Performance not found'
      });
    }

    // Check if performance belongs to event
    if (performance.event.toString() !== eventId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'Performance does not belong to the specified event'
      });
    }

    // Check if performance is sold out
    if (performance.isSoldOut) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'This performance is sold out'
      });
    }

    // Check if performance is cancelled
    if (performance.isCancelled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'This performance has been cancelled'
      });
    }

    // Validate seat availability
    const existingTicketsWithSeats = await Ticket.find({
      performance: performanceId,
      section: { $in: tickets.map(t => t.section) },
      row: { $in: tickets.map(t => t.row) },
      seatNumber: { $in: tickets.map(t => t.seatNumber) },
      status: { $ne: 'cancelled' }
    }).session(session);

    // Check for duplicate seats
    if (existingTicketsWithSeats.length > 0) {
      const unavailableSeats = existingTicketsWithSeats.map(ticket => 
        `${ticket.section} - Row ${ticket.row}, Seat ${ticket.seatNumber}`
      );
      
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'Some selected seats are already booked',
        unavailableSeats
      });
    }

    // Create new order
    const order = new Order({
      customer: req.user?.id,
      event: eventId,
      performance: performanceId,
      payment: paymentId,
      totalAmount: payment.amount,
      status: 'confirmed'
    });

    await order.save({ session });

    // Create tickets for each selected seat
    const createdTickets = [];
    for (const ticketData of tickets) {
      // Generate ticket number
      const ticketNumber = `T-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      // Generate QR code or barcode data
      const barcodeData = `${ticketNumber}-${event._id}-${performance._id}-${ticketData.section}-${ticketData.row}-${ticketData.seatNumber}`;
      
      // Create ticket
      const ticket = new Ticket({
        ticketNumber,
        event: eventId,
        performance: performanceId,
        order: order._id,
        customer: req.user?.id,
        price: ticketData.price,
        category: ticketData.category,
        section: ticketData.section,
        row: ticketData.row,
        seatNumber: ticketData.seatNumber,
        purchaseDate: new Date(),
        status: 'active',
        barcodeData,
        customerDetails: {
          firstName: customerDetails.firstName,
          lastName: customerDetails.lastName,
          email: customerDetails.email
        }
      });

      await ticket.save({ session });
      createdTickets.push(ticket);
    }

    // Update available tickets in performance
    await Performance.findByIdAndUpdate(
      performanceId,
      {
        $inc: { availableTickets: -tickets.length },
        $set: { updatedAt: new Date() }
      },
      { session }
    );

    // Check if performance is now sold out
    const updatedPerformance = await Performance.findById(performanceId).session(session);
    if (updatedPerformance && updatedPerformance.availableTickets <= 0) {
      updatedPerformance.isSoldOut = true;
      await updatedPerformance.save({ session });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Generate PDFs and send emails asynchronously (outside transaction)
    createdTickets.forEach(async (ticket) => {
      try {
        // Generate PDF
        const pdfBuffer = await generatePDF(ticket._id);
        
        // Send email
        await sendEmail({
          to: ticket.customerDetails.email,
          subject: 'Your Ticket Confirmation',
          text: 'Thank you for your purchase. Your ticket is attached.',
          html: `<p>Thank you for your purchase. Your ticket is attached.</p>`,
          attachments: [{
            filename: `ticket-${ticket.ticketNumber}.pdf`,
            content: pdfBuffer
          }]
        });
      } catch (error) {
        console.error('Error sending ticket email:', error);
        // Continue even if email fails
      }
    });

    return res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      order: {
        ...order.toObject(),
        tickets: createdTickets
      }
    });

  } catch (error: any) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while creating the order'
    });
  }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID format'
      });
    }
    
    // Find order
    const order = await Order.findById(id)
      .populate('customer', 'firstName lastName email')
      .populate('event', 'title category')
      .populate('performance', 'date startTime endTime')
      .populate('payment', 'amount method status');
      
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check authorization - only admin, manager, or the customer can view the order
    if (
      req.user?.id !== order.customer._id.toString() && 
      req.user?.role !== 'admin' && 
      req.user?.role !== 'manager'
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this order'
      });
    }
    
    // Get tickets associated with the order
    const tickets = await Ticket.find({ order: id });
    
    return res.status(200).json({
      status: 'success',
      order: {
        ...order.toObject(),
        tickets
      }
    });
    
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching the order'
    });
  }
};

// Get all orders for current user
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {
      customer: req.user?.id
    };
    
    // Filter by status if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Count total matching documents
    const totalOrders = await Order.countDocuments(filter);
    
    // Get orders with pagination
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('event', 'title category image')
      .populate('performance', 'date startTime')
      .populate('payment', 'amount');
    
    // Get tickets for each order
    const ordersWithTickets = await Promise.all(
      orders.map(async (order) => {
        const tickets = await Ticket.find({ order: order._id });
        return {
          ...order.toObject(),
          tickets
        };
      })
    );
    
    return res.status(200).json({
      status: 'success',
      results: orders.length,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      orders: ordersWithTickets
    });
    
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching your orders'
    });
  }
};

// Get all orders (Admin/Manager only)
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {};
    
    // Filter by customer if provided
    if (req.query.customer) {
      filter.customer = req.query.customer;
    }
    
    // Filter by event if provided
    if (req.query.event) {
      filter.event = req.query.event;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Date range filters
    if (req.query.startDate) {
      filter.createdAt = { $gte: new Date(req.query.startDate as string) };
    }
    
    if (req.query.endDate) {
      filter.createdAt = filter.createdAt || {};
      filter.createdAt.$lte = new Date(req.query.endDate as string);
    }
    
    // Count total matching documents
    const totalOrders = await Order.countDocuments(filter);
    
    // Get orders with pagination
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'firstName lastName email')
      .populate('event', 'title category')
      .populate('performance', 'date startTime')
      .populate('payment', 'amount method status');
    
    return res.status(200).json({
      status: 'success',
      results: orders.length,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      orders
    });
    
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching orders'
    });
  }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID format'
      });
    }
    
    // Validate status
    const validStatuses = ['confirmed', 'cancelled', 'refunded'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Find order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Update order status
    order.status = status;
    await order.save();
    
    // If order is cancelled or refunded, update ticket statuses
    if (status === 'cancelled' || status === 'refunded') {
      await Ticket.updateMany(
        { order: id },
        { status: status === 'cancelled' ? 'cancelled' : 'refunded' }
      );
      
      // Update performance available tickets
      const tickets = await Ticket.find({ order: id });
      
      if (tickets.length > 0) {
        await Performance.findByIdAndUpdate(
          order.performance,
          { 
            $inc: { availableTickets: tickets.length },
            isSoldOut: false
          }
        );
      }
    }
    
    return res.status(200).json({
      status: 'success',
      message: `Order status updated to ${status}`,
      order
    });
    
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while updating the order status'
    });
  }
}; 