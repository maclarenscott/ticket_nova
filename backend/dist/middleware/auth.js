"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffMiddleware = exports.managerMiddleware = exports.adminMiddleware = exports.authorize = exports.protect = void 0;
const passport_1 = __importDefault(require("passport"));
/**
 * Middleware to protect routes (authentication)
 * Verifies JWT token and attaches user to req object
 */
const protect = (req, res, next) => {
    logAuthHeaders(req);
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        console.log('Passport authenticate result:', { user: !!user, err: !!err, info });
        if (err) {
            console.error('Passport error:', err);
            return res.status(500).json({ message: 'Internal server error during authentication' });
        }
        if (!user) {
            console.log('Authentication failed:', info?.message || 'No user found');
            return res.status(401).json({ message: 'Not authorized, no token or invalid token' });
        }
        req.user = user;
        console.log('User authenticated:', { id: user._id, role: user.role });
        next();
    })(req, res, next);
};
exports.protect = protect;
/**
 * Middleware to authorize based on user roles
 * @param {string[]} roles - Array of allowed roles
 */
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Not authorized, authentication required'
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: `Not authorized, role (${req.user.role}) not allowed to access this resource`
            });
        }
        next();
    };
};
exports.authorize = authorize;
// Middleware to check if user is an admin
const adminMiddleware = (req, res, next) => {
    const user = req.user;
    console.log('Admin check:', { userRole: user?.role, isAdmin: user?.role === 'Admin' });
    if (!user || user.role !== 'Admin') {
        console.log('Admin access denied for user with role:', user?.role);
        return res.status(403).json({ message: 'Not authorized as admin' });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
// Middleware to check if user is a manager or admin
const managerMiddleware = (req, res, next) => {
    const user = req.user;
    console.log('Manager check:', { userRole: user?.role, isManager: user?.role === 'Manager' || user?.role === 'Admin' });
    if (!user || (user.role !== 'Manager' && user.role !== 'Admin')) {
        console.log('Manager access denied for user with role:', user?.role);
        return res.status(403).json({ message: 'Not authorized as manager or admin' });
    }
    next();
};
exports.managerMiddleware = managerMiddleware;
// Middleware to check if user is staff, manager, or admin
const staffMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token provided or invalid token',
        });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'staff') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized, staff access required',
        });
    }
    next();
};
exports.staffMiddleware = staffMiddleware;
// Debug function to inspect req.headers for troubleshooting
const logAuthHeaders = (req) => {
    console.log('---- AUTH DEBUG ----');
    console.log('Auth headers:', req.headers.authorization);
    console.log('All headers:', JSON.stringify(req.headers, null, 2));
    console.log('-------------------');
};
//# sourceMappingURL=auth.js.map