"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleUserStatus = exports.updateUserRole = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const email_service_1 = require("../services/email.service");
// Get all users (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {};
        // Filter by role if provided
        if (req.query.role) {
            filter.role = req.query.role;
        }
        // Filter by active status
        if (req.query.isActive === 'true') {
            filter.isActive = true;
        }
        else if (req.query.isActive === 'false') {
            filter.isActive = false;
        }
        // Search by name or email
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex }
            ];
        }
        // Count total matching documents
        const totalUsers = await user_model_1.default.countDocuments(filter);
        // Get users with pagination
        const users = await user_model_1.default.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return res.status(200).json({
            status: 'success',
            results: users.length,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
            users
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching users'
        });
    }
};
exports.getAllUsers = getAllUsers;
// Get user by ID (Admin or self)
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user ID format'
            });
        }
        // Check if user is requesting their own data or is an admin
        if (id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to access this user data'
            });
        }
        // Find user
        const user = await user_model_1.default.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        return res.status(200).json({
            status: 'success',
            user
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching the user'
        });
    }
};
exports.getUserById = getUserById;
// Create a new user (Admin only)
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;
        // Check if user already exists
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is already registered'
            });
        }
        // Create new user
        const user = new user_model_1.default({
            firstName,
            lastName,
            email,
            password,
            role: role || 'customer'
        });
        await user.save();
        // Send welcome email
        try {
            await (0, email_service_1.sendWelcomeEmail)(email, `${firstName} ${lastName}`);
        }
        catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Continue even if email fails
        }
        // Remove sensitive information from user object
        const userObject = user.toObject();
        delete userObject.password;
        return res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            user: userObject
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while creating the user'
        });
    }
};
exports.createUser = createUser;
// Update a user (Admin or self)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user ID format'
            });
        }
        // Find user
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        // Check permissions: admin can update any user, users can only update themselves
        if (id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to update this user'
            });
        }
        // Restrict what regular users can update about themselves
        if (id === req.user.id && req.user.role !== 'admin') {
            // Regular users can only update firstName, lastName
            const { firstName, lastName } = req.body;
            const allowedUpdates = {
                firstName,
                lastName
            };
            // Update user
            const updatedUser = await user_model_1.default.findByIdAndUpdate(id, { $set: allowedUpdates }, { new: true, runValidators: true }).select('-password');
            return res.status(200).json({
                status: 'success',
                message: 'User updated successfully',
                user: updatedUser
            });
        }
        // For admin updates, allow updating any fields except password
        const { password, ...updateData } = req.body;
        // Update user
        const updatedUser = await user_model_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).select('-password');
        return res.status(200).json({
            status: 'success',
            message: 'User updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while updating the user'
        });
    }
};
exports.updateUser = updateUser;
// Update user role (Admin only)
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user ID format'
            });
        }
        // Check if role is valid
        const validRoles = ['admin', 'manager', 'staff', 'customer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid role value'
            });
        }
        // Don't allow changing own role (to prevent losing admin access)
        if (id === req.user.id) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot change your own role'
            });
        }
        // Find user
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        // Update role
        user.role = role;
        await user.save();
        return res.status(200).json({
            status: 'success',
            message: `User role updated to ${role}`,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while updating user role'
        });
    }
};
exports.updateUserRole = updateUserRole;
// Toggle user active status (Admin only)
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user ID format'
            });
        }
        // Don't allow deactivating own account
        if (id === req.user.id) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot change your own active status'
            });
        }
        // Find user
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        // Toggle active status
        user.isActive = !user.isActive;
        await user.save();
        return res.status(200).json({
            status: 'success',
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: user.isActive
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while toggling user status'
        });
    }
};
exports.toggleUserStatus = toggleUserStatus;
//# sourceMappingURL=user.controller.js.map