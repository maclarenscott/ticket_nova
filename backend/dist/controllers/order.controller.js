"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getAllOrders = exports.getMyOrders = exports.getOrderById = exports.createOrder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const order_model_1 = __importDefault(require("../models/order.model"));
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const performance_model_1 = __importDefault(require("../models/performance.model"));
const event_model_1 = __importDefault(require("../models/event.model"));
const crypto_1 = __importDefault(require("crypto"));
const pdf_service_1 = require("../services/pdf.service");
const email_service_1 = require("../services/email.service");
// Create a new order
const createOrder = async (req, res) => {
    // Start a session for transaction
    const session = await mongoose_1.default.startSession();
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
        const payment = await payment_model_1.default.findById(paymentId).session(session);
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
        const event = await event_model_1.default.findById(eventId).session(session);
        if (!event) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        // Get performance
        const performance = await performance_model_1.default.findById(performanceId).session(session);
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
        const existingTicketsWithSeats = await ticket_model_1.default.find({
            performance: performanceId,
            section: { $in: tickets.map(t => t.section) },
            row: { $in: tickets.map(t => t.row) },
            seatNumber: { $in: tickets.map(t => t.seatNumber) },
            status: { $ne: 'cancelled' }
        }).session(session);
        // Check for duplicate seats
        if (existingTicketsWithSeats.length > 0) {
            const unavailableSeats = existingTicketsWithSeats.map(ticket => `${ticket.section} - Row ${ticket.row}, Seat ${ticket.seatNumber}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                status: 'error',
                message: 'Some selected seats are already booked',
                unavailableSeats
            });
        }
        // Create new order
        const order = new order_model_1.default({
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
            const ticketNumber = `T-${crypto_1.default.randomBytes(4).toString('hex').toUpperCase()}`;
            // Generate QR code or barcode data
            const barcodeData = `${ticketNumber}-${event._id}-${performance._id}-${ticketData.section}-${ticketData.row}-${ticketData.seatNumber}`;
            // Create ticket
            const ticket = new ticket_model_1.default({
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
        await performance_model_1.default.findByIdAndUpdate(performanceId, {
            $inc: { availableTickets: -tickets.length },
            $set: { updatedAt: new Date() }
        }, { session });
        // Check if performance is now sold out
        const updatedPerformance = await performance_model_1.default.findById(performanceId).session(session);
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
                const pdfBuffer = await (0, pdf_service_1.generatePDF)(ticket._id);
                // Send email
                await (0, email_service_1.sendEmail)({
                    to: ticket.customerDetails.email,
                    subject: 'Your Ticket Confirmation',
                    text: 'Thank you for your purchase. Your ticket is attached.',
                    html: `<p>Thank you for your purchase. Your ticket is attached.</p>`,
                    attachments: [{
                            filename: `ticket-${ticket.ticketNumber}.pdf`,
                            content: pdfBuffer
                        }]
                });
            }
            catch (error) {
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
    }
    catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while creating the order'
        });
    }
};
exports.createOrder = createOrder;
// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid order ID format'
            });
        }
        // Find order
        const order = await order_model_1.default.findById(id)
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
        if (req.user?.id !== order.customer._id.toString() &&
            req.user?.role !== 'admin' &&
            req.user?.role !== 'manager') {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to view this order'
            });
        }
        // Get tickets associated with the order
        const tickets = await ticket_model_1.default.find({ order: id });
        return res.status(200).json({
            status: 'success',
            order: {
                ...order.toObject(),
                tickets
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching the order'
        });
    }
};
exports.getOrderById = getOrderById;
// Get all orders for current user
const getMyOrders = async (req, res) => {
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
        const totalOrders = await order_model_1.default.countDocuments(filter);
        // Get orders with pagination
        const orders = await order_model_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('event', 'title category image')
            .populate('performance', 'date startTime')
            .populate('payment', 'amount');
        // Get tickets for each order
        const ordersWithTickets = await Promise.all(orders.map(async (order) => {
            const tickets = await ticket_model_1.default.find({ order: order._id });
            return {
                ...order.toObject(),
                tickets
            };
        }));
        return res.status(200).json({
            status: 'success',
            results: orders.length,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: page,
            orders: ordersWithTickets
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching your orders'
        });
    }
};
exports.getMyOrders = getMyOrders;
// Get all orders (Admin/Manager only)
const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {};
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
            filter.createdAt = { $gte: new Date(req.query.startDate) };
        }
        if (req.query.endDate) {
            filter.createdAt = filter.createdAt || {};
            filter.createdAt.$lte = new Date(req.query.endDate);
        }
        // Count total matching documents
        const totalOrders = await order_model_1.default.countDocuments(filter);
        // Get orders with pagination
        const orders = await order_model_1.default.find(filter)
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
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching orders'
        });
    }
};
exports.getAllOrders = getAllOrders;
// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
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
        const order = await order_model_1.default.findById(id);
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
            await ticket_model_1.default.updateMany({ order: id }, { status: status === 'cancelled' ? 'cancelled' : 'refunded' });
            // Update performance available tickets
            const tickets = await ticket_model_1.default.find({ order: id });
            if (tickets.length > 0) {
                await performance_model_1.default.findByIdAndUpdate(order.performance, {
                    $inc: { availableTickets: tickets.length },
                    isSoldOut: false
                });
            }
        }
        return res.status(200).json({
            status: 'success',
            message: `Order status updated to ${status}`,
            order
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while updating the order status'
        });
    }
};
exports.updateOrderStatus = updateOrderStatus;
//# sourceMappingURL=order.controller.js.map