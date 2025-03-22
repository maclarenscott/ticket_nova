"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
// Import route handlers
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const venue_routes_1 = __importDefault(require("./routes/venue.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const performance_routes_1 = __importDefault(require("./routes/performance.routes"));
const ticket_routes_1 = __importDefault(require("./routes/ticket.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
// Import models for test endpoint
const event_model_1 = __importDefault(require("./models/event.model"));
const user_model_1 = __importDefault(require("./models/user.model"));
const ticket_model_1 = __importDefault(require("./models/ticket.model"));
// Import test controller
const dashboardTestController = __importStar(require("./controllers/dashboardTest.controller"));
// Create Express app
const app = (0, express_1.default)();
// Set port
const PORT = process.env.PORT || 5001;
// Connect to MongoDB
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketing-system')
    .then(() => {
    console.log('Connected to MongoDB');
})
    .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            console.log(`Origin ${origin} not allowed by CORS`);
            callback(null, false);
        }
    },
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
// Static files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/venues', venue_routes_1.default);
app.use('/api/events', event_routes_1.default);
app.use('/api/performances', performance_routes_1.default);
app.use('/api/tickets', ticket_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// API health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running successfully'
    });
});
// Test endpoint for dashboard stats - TEMPORARY FOR DEBUGGING
app.get('/api/test/dashboard', async (req, res) => {
    try {
        // Get total events count
        const totalEvents = await event_model_1.default.countDocuments();
        // Get total users
        const totalUsers = await user_model_1.default.countDocuments();
        res.json({
            status: 'success',
            message: 'Test endpoint working',
            data: {
                totalEvents,
                totalUsers
            }
        });
    }
    catch (err) {
        console.error('Test endpoint error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Test endpoint failed'
        });
    }
});
// Another test endpoint with simpler implementation
app.get('/api/test/dashboard2', dashboardTestController.getBasicStats);
// Unprotected dashboard endpoint for testing
app.get('/api/dashboard/test-stats', async (req, res) => {
    try {
        const totalEvents = await event_model_1.default.countDocuments();
        const activeEvents = await event_model_1.default.countDocuments({
            isActive: true,
            isPublished: true,
            endDate: { $gte: new Date() }
        });
        const totalTickets = await ticket_model_1.default.countDocuments({
            paymentStatus: { $in: ['completed', 'paid'] }
        });
        const totalUsers = await user_model_1.default.countDocuments();
        res.json({
            status: 'success',
            data: {
                totalEvents,
                activeEvents,
                totalTickets,
                totalUsers
            }
        });
    }
    catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch dashboard stats'
        });
    }
});
// Root route
app.get('/', (_req, res) => {
    res.json({
        message: 'Welcome to the Dalhousie Arts Centre Ticketing System API',
        version: '1.0.0',
    });
});
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Not Found - The requested resource does not exist'
    });
});
// Error handler
app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
//# sourceMappingURL=index.js.map