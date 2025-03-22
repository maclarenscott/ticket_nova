import { Request, Response } from 'express';
import Ticket from '../models/ticket.model';
import Performance from '../models/performance.model';
import Event from '../models/event.model';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { generatePDF } from '../services/pdf.service';
import { sendEmail } from '../services/email.service';

// Get all tickets (Admin/Manager only)
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {};
    
    // Filter by event if provided
    if (req.query.event) {
      filter.event = req.query.event;
    }
    
    // Filter by performance date if provided
    if (req.query.performanceDate) {
      filter['performance.date'] = new Date(req.query.performanceDate as string);
    }
    
    // Filter by customer if provided
    if (req.query.customer) {
      filter.customer = req.query.customer;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Count total matching documents
    const totalTickets = await Ticket.countDocuments(filter);
    
    // Get tickets with pagination
    const tickets = await Ticket.find(filter)
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('event', 'title category')
      .populate('customer', 'firstName lastName email');
    
    return res.status(200).json({
      status: 'success',
      results: tickets.length,
      totalPages: Math.ceil(totalTickets / limit),
      currentPage: page,
      tickets
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching tickets'
    });
  }
};

// Get ticket by ID
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid ticket ID format'
      });
    }
    
    // Find ticket
    const ticket = await Ticket.findById(id)
      .populate('event', 'title description category startDate endDate')
      .populate('customer', 'firstName lastName email');
    
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }
    
    // Check if user is authorized (Admin/Manager or the ticket owner)
    if (
      !req.user || 
      (req.user.role !== 'admin' && 
      req.user.role !== 'manager' && 
      ticket.customer.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this ticket'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      ticket
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching the ticket'
    });
  }
};

// Create a new ticket
export const createTicket = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      event,
      performance,
      price,
      category,
      section,
      row,
      seat,
      status,
      paymentStatus,
      paymentMethod
    } = req.body;
    
    // Check if performance exists and has available tickets
    const performanceDoc = await Performance.findById(performance).session(session);
    
    if (!performanceDoc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'error',
        message: 'Performance not found'
      });
    }
    
    // Check if there are available tickets for this performance
    if (performanceDoc.availableTickets <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'No tickets available for this performance'
      });
    }
    
    // Check if the seat is already taken
    const existingTicket = await Ticket.findOne({
      performance: performance,
      section,
      row,
      seat,
      status: { $ne: 'cancelled' }
    }).session(session);
    
    if (existingTicket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'This seat is already taken'
      });
    }
    
    // Generate unique ticket number
    const ticketNumber = `T-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    // Generate QR code data (usually the ticket ID or ticket number)
    const qrCodeData = ticketNumber;
    
    // Generate barcode data (usually the ticket ID or ticket number)
    const barcodeData = ticketNumber;
    
    // Create new ticket
    const ticket = new Ticket({
      ticketNumber,
      event,
      performance: {
        _id: performance,
        date: performanceDoc.date,
        startTime: performanceDoc.startTime,
        endTime: performanceDoc.endTime
      },
      customer: req.user.id,
      purchaseDate: new Date(),
      price,
      category,
      section,
      row,
      seat,
      status: status || 'reserved', // Default to reserved if not specified
      paymentStatus: paymentStatus || 'pending', // Default to pending if not specified
      paymentMethod: paymentMethod || 'credit_card', // Default to credit_card if not specified
      barcodeData,
      qrCodeData
    });
    
    // Save ticket
    await ticket.save({ session });
    
    // Decrease available tickets count in performance
    performanceDoc.availableTickets -= 1;
    await performanceDoc.save({ session });
    
    // If everything is successful, commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    return res.status(201).json({
      status: 'success',
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error: any) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();
    
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while creating the ticket'
    });
  }
};

// Update ticket status (Admin/Manager only)
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid ticket ID format'
      });
    }
    
    // Check if valid status
    const validStatuses = ['reserved', 'purchased', 'used', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value'
      });
    }
    
    // Find ticket
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }
    
    // Update ticket status
    ticket.status = status;
    await ticket.save();

    // Update performance available tickets
    if (ticket.status === 'purchased' && status === 'cancelled') {
      // If changing from purchased to cancelled, increase available tickets
      
      // Check if performance is populated
      const performanceId = typeof ticket.performance === 'object' && ticket.performance._id 
        ? ticket.performance._id 
        : ticket.performance;
        
      // Increase available tickets count in performance
      await Performance.findByIdAndUpdate(
        performanceId,
        { $inc: { availableTickets: 1 } }
      );
    }

    if (ticket.status === 'cancelled' && status !== 'cancelled') {
      // Check if there are still tickets available
      // Check if performance is populated
      const performanceId = typeof ticket.performance === 'object' && ticket.performance._id 
        ? ticket.performance._id 
        : ticket.performance;
        
      const performance = await Performance.findById(performanceId);
      if (performance && performance.availableTickets <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No tickets available for this performance'
        });
      }

      // Decrease available tickets count in performance
      await Performance.findByIdAndUpdate(
        performanceId,
        { $inc: { availableTickets: -1 } }
      );
    }
    
    return res.status(200).json({
      status: 'success',
      message: `Ticket status updated to ${status}`,
      ticket
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while updating ticket status'
    });
  }
};

// Get tickets for current user
export const getMyTickets = async (req: Request, res: Response) => {
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
    const totalTickets = await Ticket.countDocuments(filter);
    
    // Get tickets with pagination
    const tickets = await Ticket.find(filter)
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('event', 'title category startDate endDate image')
      .populate({
        path: 'event',
        populate: {
          path: 'venue',
          select: 'name address'
        }
      });
    
    return res.status(200).json({
      status: 'success',
      results: tickets.length,
      totalPages: Math.ceil(totalTickets / limit),
      currentPage: page,
      tickets
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching your tickets'
    });
  }
};

// Generate and send ticket PDF
export const generateTicketPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid ticket ID format'
      });
    }
    
    // Find ticket with event and venue details
    const ticket = await Ticket.findById(id)
      .populate('event', 'title description category')
      .populate({
        path: 'event',
        populate: {
          path: 'venue',
          select: 'name address'
        }
      })
      .populate('customer', 'firstName lastName email');
    
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }
    
    // Check if user has access to this ticket
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (
      !req.user || 
      (userRole !== 'admin' && 
      userRole !== 'manager' && 
      ticket.customer.toString() !== userId)
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this ticket'
      });
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDF(ticket);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticket.ticketNumber}.pdf"`);
    
    // Send PDF
    return res.send(pdfBuffer);
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while generating the ticket PDF'
    });
  }
};

// Email ticket to customer
export const emailTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid ticket ID format'
      });
    }
    
    // Find ticket with event and venue details
    const ticket = await Ticket.findById(id)
      .populate('event', 'title description category')
      .populate({
        path: 'event',
        populate: {
          path: 'venue',
          select: 'name address'
        }
      })
      .populate('customer', 'firstName lastName email');
    
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }
    
    // Check if user has access to this ticket
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (
      !req.user || 
      (userRole !== 'admin' && 
      userRole !== 'manager' && 
      ticket.customer.toString() !== userId)
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this ticket'
      });
    }
    
    // Get customer email - handle populated or non-populated case
    let customerEmail = '';
    let customerName = '';
    
    if (typeof ticket.customer === 'object' && ticket.customer !== null) {
      customerEmail = ticket.customer.email || '';
      customerName = `${ticket.customer.firstName || ''} ${ticket.customer.lastName || ''}`;
    }
    
    if (!customerEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer email not found'
      });
    }
    
    // Get event details - handle populated or non-populated case
    let eventTitle = '';
    let venueName = '';
    
    if (typeof ticket.event === 'object' && ticket.event !== null) {
      eventTitle = ticket.event.title || '';
      venueName = ticket.event.venue?.name || '';
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDF(ticket);
    
    // Send email with PDF attachment
    await sendEmail({
      to: customerEmail,
      subject: `Your Ticket for ${eventTitle}`,
      text: `Please find attached your ticket for ${eventTitle} at ${venueName}.`,
      html: `
        <h1>Your Ticket</h1>
        <p>Thank you for your purchase!</p>
        <p>Event: ${eventTitle}</p>
        <p>Venue: ${venueName}</p>
        <p>Date: ${new Date(ticket.performance.date).toLocaleDateString()}</p>
        <p>Time: ${ticket.performance.startTime}</p>
        <p>Section: ${ticket.section}, Row: ${ticket.row}, Seat: ${ticket.seat}</p>
        <p>Please find your ticket attached to this email.</p>
      `,
      attachments: [
        {
          filename: `ticket-${ticket.ticketNumber}.pdf`,
          content: pdfBuffer
        }
      ]
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Ticket has been emailed to the customer'
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while emailing the ticket'
    });
  }
}; 