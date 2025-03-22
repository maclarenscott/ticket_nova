"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBasicStats = void 0;
const event_model_1 = __importDefault(require("../models/event.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
// Simple dashboard stats
const getBasicStats = (req, res) => {
    Promise.all([
        event_model_1.default.countDocuments(),
        user_model_1.default.countDocuments(),
        ticket_model_1.default.countDocuments()
    ])
        .then(([events, users, tickets]) => {
        res.json({
            status: 'success',
            data: {
                totalEvents: events,
                totalUsers: users,
                totalTickets: tickets
            }
        });
    })
        .catch(err => {
        console.error('Error getting dashboard stats:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get dashboard stats'
        });
    });
};
exports.getBasicStats = getBasicStats;
//# sourceMappingURL=dashboardTest.controller.js.map