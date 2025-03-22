"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundPayment = exports.getPaymentById = exports.createPayment = exports.getPaymentHistory = exports.cancelPayment = exports.confirmPayment = exports.createPaymentIntent = void 0;
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
const performance_model_1 = __importDefault(require("../models/performance.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const stripe_1 = __importDefault(require("stripe"));
const email_service_1 = require("../services/email.service");
const payment_model_1 = __importDefault(require("../models/payment.model"));
// Initialize Stripe
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
});
// Create a payment intent (Stripe)
const createPaymentIntent = async (req, res) => {
    try {
        const { ticketIds } = req.body;
        if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide valid ticket IDs'
            });
        }
        // Find tickets
        const tickets = await ticket_model_1.default.find({
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
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while creating payment intent'
        });
    }
};
exports.createPaymentIntent = createPaymentIntent;
// Confirm payment and update ticket status
const confirmPayment = async (req, res) => {
    const session = await mongoose_1.default.startSession();
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
        const tickets = await ticket_model_1.default.find({
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
            ticket.paymentStatus = 'paid';
            ticket.paymentMethod = 'credit_card';
            await ticket.save({ session });
            // Send confirmation email
            try {
                const eventDoc = await ticket.populate('event');
                const performanceDoc = await ticket.populate('performance');
                await (0, email_service_1.sendTicketConfirmationEmail)(req.user.email, `${req.user.firstName} ${req.user.lastName}`, eventDoc.event.title, ticket.ticketNumber, performanceDoc.performance.date, eventDoc.event.venue?.name || 'Venue');
            }
            catch (emailError) {
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
    }
    catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while confirming payment'
        });
    }
};
exports.confirmPayment = confirmPayment;
// Cancel a payment and release tickets
const cancelPayment = async (req, res) => {
    const session = await mongoose_1.default.startSession();
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
        const tickets = await ticket_model_1.default.find({
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
            ticket.paymentStatus = ticket.paymentStatus === 'paid' ? 'refunded' : 'cancelled';
            await ticket.save({ session });
            // Increase available tickets count in performance if the ticket was previously not cancelled
            if (oldStatus !== 'cancelled') {
                const performanceDoc = await ticket.populate('performance');
                await performance_model_1.default.findByIdAndUpdate(performanceDoc.performance._id, { $inc: { availableTickets: 1 } }, { session });
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
    }
    catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while cancelling payment'
        });
    }
};
exports.cancelPayment = cancelPayment;
// Get payment history for current user
const getPaymentHistory = async (req, res) => {
    try {
        const tickets = await ticket_model_1.default.find({
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
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching payment history'
        });
    }
};
exports.getPaymentHistory = getPaymentHistory;
// Create a new payment
const createPayment = async (req, res) => {
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
        const payment = new payment_model_1.default({
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
            }
            catch (error) {
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
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while processing payment'
        });
    }
};
exports.createPayment = createPayment;
// Get payment by ID
const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await payment_model_1.default.findById(id);
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
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching payment'
        });
    }
};
exports.getPaymentById = getPaymentById;
// Refund a payment
const refundPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await payment_model_1.default.findById(id);
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
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while refunding payment'
        });
    }
};
exports.refundPayment = refundPayment;
//# sourceMappingURL=payment.controller.js.map