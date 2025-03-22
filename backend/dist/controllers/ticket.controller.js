"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTicket = exports.generateTicketPDF = exports.getMyTickets = exports.updateTicketStatus = exports.createTicket = exports.getTicketById = exports.getAllTickets = void 0;
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
const performance_model_1 = __importDefault(require("../models/performance.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const pdf_service_1 = require("../services/pdf.service");
const email_service_1 = require("../services/email.service");
// Get all tickets (Admin/Manager only)
const getAllTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {};
        // Filter by event if provided
        if (req.query.event) {
            filter.event = req.query.event;
        }
        // Filter by performance date if provided
        if (req.query.performanceDate) {
            filter['performance.date'] = new Date(req.query.performanceDate);
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
        const totalTickets = await ticket_model_1.default.countDocuments(filter);
        // Get tickets with pagination
        const tickets = await ticket_model_1.default.find(filter)
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
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching tickets'
        });
    }
};
exports.getAllTickets = getAllTickets;
// Get ticket by ID
const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid ticket ID format'
            });
        }
        // Find ticket
        const ticket = await ticket_model_1.default.findById(id)
            .populate('event', 'title description category startDate endDate')
            .populate('customer', 'firstName lastName email');
        if (!ticket) {
            return res.status(404).json({
                status: 'error',
                message: 'Ticket not found'
            });
        }
        // Check if user is authorized (Admin/Manager or the ticket owner)
        if (!req.user ||
            (req.user.role !== 'admin' &&
                req.user.role !== 'manager' &&
                ticket.customer.toString() !== req.user.id)) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to view this ticket'
            });
        }
        return res.status(200).json({
            status: 'success',
            ticket
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching the ticket'
        });
    }
};
exports.getTicketById = getTicketById;
// Create a new ticket
const createTicket = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { event, performance, price, category, section, row, seat, status, paymentStatus, paymentMethod } = req.body;
        // Check if performance exists and has available tickets
        const performanceDoc = await performance_model_1.default.findById(performance).session(session);
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
        const existingTicket = await ticket_model_1.default.findOne({
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
        const ticketNumber = `T-${crypto_1.default.randomBytes(4).toString('hex').toUpperCase()}`;
        // Generate QR code data (usually the ticket ID or ticket number)
        const qrCodeData = ticketNumber;
        // Generate barcode data (usually the ticket ID or ticket number)
        const barcodeData = ticketNumber;
        // Create new ticket
        const ticket = new ticket_model_1.default({
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
    }
    catch (error) {
        // If an error occurs, abort the transaction
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while creating the ticket'
        });
    }
};
exports.createTicket = createTicket;
// Update ticket status (Admin/Manager only)
const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
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
        const ticket = await ticket_model_1.default.findById(id);
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
            await performance_model_1.default.findByIdAndUpdate(performanceId, { $inc: { availableTickets: 1 } });
        }
        if (ticket.status === 'cancelled' && status !== 'cancelled') {
            // Check if there are still tickets available
            // Check if performance is populated
            const performanceId = typeof ticket.performance === 'object' && ticket.performance._id
                ? ticket.performance._id
                : ticket.performance;
            const performance = await performance_model_1.default.findById(performanceId);
            if (performance && performance.availableTickets <= 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No tickets available for this performance'
                });
            }
            // Decrease available tickets count in performance
            await performance_model_1.default.findByIdAndUpdate(performanceId, { $inc: { availableTickets: -1 } });
        }
        return res.status(200).json({
            status: 'success',
            message: `Ticket status updated to ${status}`,
            ticket
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while updating ticket status'
        });
    }
};
exports.updateTicketStatus = updateTicketStatus;
// Get tickets for current user
const getMyTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {
            customer: req.user?.id
        };
        // Filter by status if provided
        if (req.query.status) {
            filter.status = req.query.status;
        }
        // Count total matching documents
        const totalTickets = await ticket_model_1.default.countDocuments(filter);
        // Get tickets with pagination
        const tickets = await ticket_model_1.default.find(filter)
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
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching your tickets'
        });
    }
};
exports.getMyTickets = getMyTickets;
// Generate and send ticket PDF
const generateTicketPDF = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid ticket ID format'
            });
        }
        // Find ticket with event and venue details
        const ticket = await ticket_model_1.default.findById(id)
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
        if (!req.user ||
            (userRole !== 'admin' &&
                userRole !== 'manager' &&
                ticket.customer.toString() !== userId)) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to access this ticket'
            });
        }
        // Generate PDF
        const pdfBuffer = await (0, pdf_service_1.generatePDF)(ticket);
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticket.ticketNumber}.pdf"`);
        // Send PDF
        return res.send(pdfBuffer);
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while generating the ticket PDF'
        });
    }
};
exports.generateTicketPDF = generateTicketPDF;
// Email ticket to customer
const emailTicket = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid ticket ID format'
            });
        }
        // Find ticket with event and venue details
        const ticket = await ticket_model_1.default.findById(id)
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
        if (!req.user ||
            (userRole !== 'admin' &&
                userRole !== 'manager' &&
                ticket.customer.toString() !== userId)) {
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
        const pdfBuffer = await (0, pdf_service_1.generatePDF)(ticket);
        // Send email with PDF attachment
        await (0, email_service_1.sendEmail)({
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
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while emailing the ticket'
        });
    }
};
exports.emailTicket = emailTicket;
//# sourceMappingURL=ticket.controller.js.map