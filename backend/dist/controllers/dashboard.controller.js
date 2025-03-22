"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemStatus = exports.getRecentTickets = exports.getDashboardStats = void 0;
const event_model_1 = __importDefault(require("../models/event.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
const performance_model_1 = __importDefault(require("../models/performance.model"));
// Get dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        // Get total events count
        const totalEvents = await event_model_1.default.countDocuments();
        // Get active events count
        const activeEvents = await event_model_1.default.countDocuments({
            isActive: true,
            isPublished: true,
            endDate: { $gte: new Date() }
        });
        // Get total tickets count
        const totalTickets = await ticket_model_1.default.countDocuments({
            paymentStatus: { $in: ['completed', 'paid'] }
        });
        // Get total sales amount
        const salesData = await ticket_model_1.default.aggregate([
            {
                $match: {
                    paymentStatus: { $in: ['completed', 'paid'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$price' }
                }
            }
        ]);
        const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;
        // Get upcoming performances count
        const upcomingPerformances = await performance_model_1.default.countDocuments({
            date: { $gte: new Date() }
        });
        // Get total users count
        const totalUsers = await user_model_1.default.countDocuments();
        // Return all stats
        res.status(200).json({
            status: 'success',
            data: {
                totalEvents,
                activeEvents,
                totalTickets,
                totalSales,
                upcomingPerformances,
                totalUsers
            }
        });
    }
    catch (err) {
        const error = err;
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to fetch dashboard stats'
        });
    }
};
exports.getDashboardStats = getDashboardStats;
// Get recent tickets
const getRecentTickets = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const recentTickets = await ticket_model_1.default.find({
            paymentStatus: { $in: ['completed', 'paid'] }
        })
            .sort({ purchaseDate: -1 })
            .limit(limit)
            .populate({
            path: 'event',
            select: 'title'
        })
            .populate({
            path: 'customer',
            select: 'firstName lastName email'
        });
        // Format the tickets data for the frontend
        const formattedTickets = recentTickets.map(ticket => ({
            id: ticket.ticketNumber,
            eventName: ticket.event ? ticket.event.title : 'Unknown Event',
            customerName: ticket.customer ?
                `${ticket.customer.firstName} ${ticket.customer.lastName}` :
                'Unknown Customer',
            purchaseDate: ticket.purchaseDate,
            price: ticket.price,
            status: ticket.status
        }));
        res.status(200).json({
            status: 'success',
            data: formattedTickets
        });
    }
    catch (err) {
        const error = err;
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to fetch recent tickets'
        });
    }
};
exports.getRecentTickets = getRecentTickets;
// Get system status
const getSystemStatus = async (req, res) => {
    try {
        // In a real application, you would check these services
        // For demo purposes, we're returning mocked data
        res.status(200).json({
            status: 'success',
            data: {
                database: 'online',
                api: 'online',
                paymentGateway: 'online',
                emailService: 'online',
                lastBackup: new Date().toISOString()
            }
        });
    }
    catch (err) {
        const error = err;
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to fetch system status'
        });
    }
};
exports.getSystemStatus = getSystemStatus;
//# sourceMappingURL=dashboard.controller.js.map