"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.requestPasswordReset = exports.getCurrentUser = exports.login = exports.register = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_service_1 = require("../services/email.service");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        // Check if user already exists
        const userExists = await user_model_1.default.findOne({ email });
        if (userExists) {
            res.status(400).json({
                status: 'error',
                message: 'User already exists'
            });
            return;
        }
        // Create new user
        const user = await user_model_1.default.create({
            firstName,
            lastName,
            email,
            password,
            role: 'customer'
        });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
        // Try to send welcome email but don't block registration if it fails
        try {
            await (0, email_service_1.sendEmail)({
                to: user.email,
                subject: 'Welcome to TicketSystem',
                html: `
          <h1>Welcome to TicketSystem!</h1>
          <p>Hi ${user.firstName},</p>
          <p>Thank you for registering with TicketSystem. We're excited to have you on board!</p>
          <p>Best regards,</p>
          <p>The TicketSystem Team</p>
        `
            });
            console.log(`Welcome email sent to ${user.email}`);
        }
        catch (emailError) {
            console.error('Warning: Could not send welcome email:', emailError);
            // Continue with registration - don't let email failure stop the process
        }
        // Complete registration regardless of email status
        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error during registration'
        });
    }
};
exports.register = register;
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const user = await user_model_1.default.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
            return;
        }
        // Check if user is active
        if (!user.isActive) {
            res.status(401).json({
                status: 'error',
                message: 'Your account has been deactivated. Please contact support.'
            });
            return;
        }
        // Check if password matches
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
            return;
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error during login'
        });
    }
};
exports.login = login;
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.user?.id);
        if (!user) {
            res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error when retrieving user information'
        });
    }
};
exports.getCurrentUser = getCurrentUser;
// @desc    Request password reset
// @route   POST /api/auth/password/reset-request
// @access  Public
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            // Don't reveal that the user doesn't exist
            res.status(200).json({
                status: 'success',
                message: 'If your email is registered, you will receive a password reset link'
            });
            return;
        }
        // Generate random reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        // Hash token and save to database
        user.resetPasswordToken = crypto_1.default
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        // Set expiration (10 minutes)
        user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save({ validateBeforeSave: false });
        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        // Send email
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: 'Password Reset Request',
            html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 10 minutes.</p>
        <p>The TicketSystem Team</p>
      `
        });
        res.status(200).json({
            status: 'success',
            message: 'If your email is registered, you will receive a password reset link'
        });
    }
    catch (error) {
        console.error('Request password reset error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error when requesting password reset'
        });
    }
};
exports.requestPasswordReset = requestPasswordReset;
// @desc    Reset password
// @route   POST /api/auth/password/reset
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        // Hash token to compare with the one in the database
        const hashedToken = crypto_1.default
            .createHash('sha256')
            .update(token)
            .digest('hex');
        // Find user with valid token and non-expired token
        const user = await user_model_1.default.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid or expired token'
            });
            return;
        }
        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        // Generate JWT token
        const jwtToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
        // Send confirmation email
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: 'Password Reset Successful',
            html: `
        <h1>Password Reset Successful</h1>
        <p>Hi ${user.firstName},</p>
        <p>Your password has been successfully reset.</p>
        <p>If you didn't request this change, please contact our support immediately.</p>
        <p>The TicketSystem Team</p>
      `
        });
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                },
                token: jwtToken
            }
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error when resetting password'
        });
    }
};
exports.resetPassword = resetPassword;
// @desc    Change password
// @route   POST /api/auth/password/change
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        // Get user with password
        const user = await user_model_1.default.findById(req.user?.id).select('+password');
        if (!user) {
            res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
            return;
        }
        // Check if current password is correct
        const isMatch = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(401).json({
                status: 'error',
                message: 'Current password is incorrect'
            });
            return;
        }
        // Update password
        user.password = newPassword;
        await user.save();
        // Send confirmation email
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: 'Password Changed',
            html: `
        <h1>Password Changed</h1>
        <p>Hi ${user.firstName},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you didn't request this change, please contact our support immediately.</p>
        <p>The TicketSystem Team</p>
      `
        });
        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error when changing password'
        });
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.controller.js.map