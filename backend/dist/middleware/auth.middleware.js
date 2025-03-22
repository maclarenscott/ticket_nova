"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
// Middleware to protect routes - verify user is logged in
const protect = async (req, res, next) => {
    try {
        let token;
        // Get token from Authorization header or cookies
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }
        // Check if token exists
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'You are not logged in. Please log in to get access.'
            });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if user still exists
        const currentUser = await user_model_1.default.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                status: 'error',
                message: 'The user belonging to this token no longer exists.'
            });
        }
        // Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                status: 'error',
                message: 'User recently changed password. Please log in again.'
            });
        }
        // Grant access to protected route
        req.user = currentUser;
        next();
    }
    catch (error) {
        return res.status(401).json({
            status: 'error',
            message: error.message || 'Authentication failed. Please log in again.'
        });
    }
};
exports.protect = protect;
// Middleware to restrict access to certain roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // Check if user role is included in the allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
exports.restrictTo = restrictTo;
//# sourceMappingURL=auth.middleware.js.map