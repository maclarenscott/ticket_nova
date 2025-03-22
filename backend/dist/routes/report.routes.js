"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const mongoose_1 = __importDefault(require("mongoose"));
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
const event_model_1 = __importDefault(require("../models/event.model"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Middleware for authentication
const authenticate = passport_1.default.authenticate('jwt', { session: false });
// @route   GET /api/reports/sales
// @desc    Get sales reports for a specific period
// @access  Admin/Manager only
router.get('/sales', authenticate, auth_1.managerMiddleware, async (req, res) => {
    try {
        const { startDate, endDate, event, paymentStatus } = req.query;
        // Build match stage for aggregation
        const match = {};
        // Payment status filter (default to completed)
        match.paymentStatus = paymentStatus || 'completed';
        // Date range filter
        if (startDate || endDate) {
            match.purchaseDate = {};
            if (startDate)
                match.purchaseDate.$gte = new Date(startDate);
            if (endDate)
                match.purchaseDate.$lte = new Date(endDate);
        }
        // Event filter
        if (event)
            match.event = new mongoose_1.default.Types.ObjectId(event);
        // Run aggregation pipeline
        const salesReport = await ticket_model_1.default.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        day: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate' } },
                        eventId: '$event'
                    },
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$price' },
                    avgPrice: { $avg: '$price' },
                    categories: {
                        $push: '$category'
                    }
                }
            },
            {
                $lookup: {
                    from: 'events',
                    localField: '_id.eventId',
                    foreignField: '_id',
                    as: 'eventDetails'
                }
            },
            {
                $unwind: {
                    path: '$eventDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id.day',
                    eventId: '$_id.eventId',
                    eventTitle: '$eventDetails.title',
                    ticketsSold: '$count',
                    revenue: { $round: ['$totalRevenue', 2] },
                    averagePrice: { $round: ['$avgPrice', 2] },
                    premiumCount: {
                        $size: {
                            $filter: {
                                input: '$categories',
                                as: 'category',
                                cond: { $eq: ['$$category', 'premium'] }
                            }
                        }
                    },
                    standardCount: {
                        $size: {
                            $filter: {
                                input: '$categories',
                                as: 'category',
                                cond: { $eq: ['$$category', 'standard'] }
                            }
                        }
                    },
                    economyCount: {
                        $size: {
                            $filter: {
                                input: '$categories',
                                as: 'category',
                                cond: { $eq: ['$$category', 'economy'] }
                            }
                        }
                    }
                }
            },
            { $sort: { date: 1, revenue: -1 } }
        ]);
        // Calculate totals
        const totalRevenue = salesReport.reduce((sum, item) => sum + item.revenue, 0);
        const totalTickets = salesReport.reduce((sum, item) => sum + item.ticketsSold, 0);
        const totalPremium = salesReport.reduce((sum, item) => sum + item.premiumCount, 0);
        const totalStandard = salesReport.reduce((sum, item) => sum + item.standardCount, 0);
        const totalEconomy = salesReport.reduce((sum, item) => sum + item.economyCount, 0);
        res.json({
            success: true,
            data: {
                salesByDay: salesReport,
                summary: {
                    totalRevenue,
                    totalTickets,
                    averageTicketPrice: totalTickets > 0 ? (totalRevenue / totalTickets).toFixed(2) : 0,
                    ticketCategories: {
                        premium: totalPremium,
                        standard: totalStandard,
                        economy: totalEconomy
                    }
                }
            }
        });
    }
    catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({
            success: false,
            message: 'Could not generate sales report',
            error: error.message,
        });
    }
});
// @route   GET /api/reports/events
// @desc    Get event performance reports
// @access  Admin/Manager only
router.get('/events', authenticate, auth_1.managerMiddleware, async (req, res) => {
    try {
        // Run aggregation pipeline for event statistics
        const eventReport = await event_model_1.default.aggregate([
            {
                $lookup: {
                    from: 'tickets',
                    localField: '_id',
                    foreignField: 'event',
                    as: 'tickets'
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    startDate: 1,
                    endDate: 1,
                    isActive: 1,
                    isPublished: 1,
                    isFeatured: 1,
                    category: 1,
                    ticketsSold: {
                        $size: {
                            $filter: {
                                input: '$tickets',
                                as: 'ticket',
                                cond: {
                                    $or: [
                                        { $eq: ['$$ticket.status', 'purchased'] },
                                        { $eq: ['$$ticket.status', 'checked-in'] }
                                    ]
                                }
                            }
                        }
                    },
                    totalRevenue: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$tickets',
                                        as: 'ticket',
                                        cond: {
                                            $or: [
                                                { $eq: ['$$ticket.status', 'purchased'] },
                                                { $eq: ['$$ticket.status', 'checked-in'] }
                                            ]
                                        }
                                    }
                                },
                                as: 'ticket',
                                in: '$$ticket.price'
                            }
                        }
                    },
                    checkedIn: {
                        $size: {
                            $filter: {
                                input: '$tickets',
                                as: 'ticket',
                                cond: { $eq: ['$$ticket.status', 'checked-in'] }
                            }
                        }
                    },
                    performances: 1
                }
            },
            {
                $addFields: {
                    attendanceRate: {
                        $cond: [
                            { $eq: ['$ticketsSold', 0] },
                            0,
                            { $multiply: [{ $divide: ['$checkedIn', '$ticketsSold'] }, 100] }
                        ]
                    }
                }
            },
            { $sort: { startDate: -1 } }
        ]);
        res.json({
            success: true,
            count: eventReport.length,
            data: eventReport,
        });
    }
    catch (error) {
        console.error('Error generating event report:', error);
        res.status(500).json({
            success: false,
            message: 'Could not generate event report',
            error: error.message,
        });
    }
});
// @route   GET /api/reports/attendance
// @desc    Get attendance reports by venue or event
// @access  Admin/Manager only
router.get('/attendance', authenticate, auth_1.managerMiddleware, async (req, res) => {
    try {
        const { venue, startDate, endDate } = req.query;
        // Build match stage for aggregation
        const matchEvents = {};
        const matchTickets = {};
        // For attendance, we only want checked-in tickets
        matchTickets.status = 'checked-in';
        // Date filter
        if (startDate || endDate) {
            matchEvents.startDate = {};
            if (startDate)
                matchEvents.startDate.$gte = new Date(startDate);
            if (endDate)
                matchEvents.endDate = { $lte: new Date(endDate) };
        }
        // Venue filter
        if (venue)
            matchEvents.venue = new mongoose_1.default.Types.ObjectId(venue);
        // Use aggregation to get attendance data
        const eventsWithAttendance = await event_model_1.default.aggregate([
            { $match: matchEvents },
            {
                $lookup: {
                    from: 'venues',
                    localField: 'venue',
                    foreignField: '_id',
                    as: 'venueDetails'
                }
            },
            {
                $unwind: {
                    path: '$venueDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'tickets',
                    let: { eventId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$event', '$$eventId'] },
                                ...matchTickets
                            }
                        }
                    ],
                    as: 'attendees'
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    startDate: 1,
                    endDate: 1,
                    venueName: '$venueDetails.name',
                    venueCapacity: '$venueDetails.capacity',
                    attendeeCount: { $size: '$attendees' },
                    expectedCapacity: {
                        $reduce: {
                            input: '$performances',
                            initialValue: 0,
                            in: {
                                $sum: [
                                    '$$value',
                                    {
                                        $reduce: {
                                            input: '$$this.ticketPricing',
                                            initialValue: 0,
                                            in: { $sum: ['$$value', '$$this.availableSeats'] }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    occupancyRate: {
                        $cond: [
                            { $eq: ['$expectedCapacity', 0] },
                            0,
                            { $multiply: [{ $divide: ['$attendeeCount', '$expectedCapacity'] }, 100] }
                        ]
                    }
                }
            },
            { $sort: { startDate: -1 } }
        ]);
        res.json({
            success: true,
            count: eventsWithAttendance.length,
            data: eventsWithAttendance,
        });
    }
    catch (error) {
        console.error('Error generating attendance report:', error);
        res.status(500).json({
            success: false,
            message: 'Could not generate attendance report',
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=report.routes.js.map