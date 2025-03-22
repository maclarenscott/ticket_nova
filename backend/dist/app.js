"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const passport_1 = __importDefault(require("passport"));
const passport_2 = require("./config/passport");
const db_1 = __importDefault(require("./config/db"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
// Import models for test endpoint
const event_model_1 = __importDefault(require("./models/event.model"));
const user_model_1 = __importDefault(require("./models/user.model"));
const ticket_model_1 = __importDefault(require("./models/ticket.model"));
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const venue_routes_1 = __importDefault(require("./routes/venue.routes"));
const performance_routes_1 = __importDefault(require("./routes/performance.routes"));
const ticket_routes_1 = __importDefault(require("./routes/ticket.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
// Connect to MongoDB
(0, db_1.default)();
// Express app
const app = (0, express_1.default)();
// Configure and initialize passport for JWT authentication
(0, passport_2.configurePassport)(passport_1.default);
app.use(passport_1.default.initialize());
// Global middlewares
// CORS
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
// Security headers
app.use((0, helmet_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    max: 100, // 100 requests per hour
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);
// Body parser
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// Cookie parser
app.use((0, cookie_parser_1.default)());
// Data sanitization against NoSQL query injection
app.use((0, express_mongo_sanitize_1.default)());
// Logger in development
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Compression
app.use((0, compression_1.default)());
// Serve static files if in production
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(__dirname, '../../frontend/build')));
}
// Routes - register individual route handlers
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/events', event_routes_1.default);
app.use('/api/venues', venue_routes_1.default);
app.use('/api/performances', performance_routes_1.default);
app.use('/api/tickets', ticket_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// API health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
// Test dashboard endpoint - unprotected
app.get('/api/dashboard/test-stats', async (req, res) => {
    try {
        // Get total events count
        const totalEvents = await event_model_1.default.countDocuments();
        // Get active events count (not ended and is published)
        const activeEvents = await event_model_1.default.countDocuments({
            isActive: true,
            isPublished: true,
            endDate: { $gte: new Date() }
        });
        // Get total tickets count
        const totalTickets = await ticket_model_1.default.countDocuments();
        // Get total users count
        const totalUsers = await user_model_1.default.countDocuments();
        res.status(200).json({
            status: 'success',
            data: {
                totalEvents,
                activeEvents,
                totalTickets,
                totalUsers,
                // Mocked data for demo
                totalSales: 15750,
                upcomingPerformances: 12
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get dashboard stats'
        });
    }
});
// Error handling middleware
app.use(errorHandler_1.default);
// Catch 404 and forward to error handler
app.use((req, res, next) => {
    const error = new Error(`Can't find ${req.originalUrl} on this server`);
    res.status(404);
    next(error);
});
// Error handler middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        status: 'error',
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});
// Serve react app in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../../frontend/build/index.html'));
    });
}
exports.default = app;
//# sourceMappingURL=app.js.map