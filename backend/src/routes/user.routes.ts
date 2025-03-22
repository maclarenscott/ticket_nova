import express from 'express';
import * as userController from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

/**
 * @route GET /api/users
 * @desc Get all users with pagination and filtering
 * @access Private (Admin)
 */
router.get('/', protect, authorize(['admin']), asyncHandler(userController.getAllUsers));

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private (Admin or self)
 */
router.get('/:id', protect, asyncHandler(userController.getUserById));

/**
 * @route POST /api/users
 * @desc Create a new user
 * @access Private (Admin)
 */
router.post('/', protect, authorize(['admin']), asyncHandler(userController.createUser));

/**
 * @route PUT /api/users/:id
 * @desc Update user information
 * @access Private (Admin or self)
 */
router.put('/:id', protect, asyncHandler(userController.updateUser));

/**
 * @route PATCH /api/users/:id/role
 * @desc Update user role
 * @access Private (Admin)
 */
router.patch('/:id/role', protect, authorize(['admin']), asyncHandler(userController.updateUserRole));

/**
 * @route PATCH /api/users/:id/status
 * @desc Toggle user active status
 * @access Private (Admin)
 */
router.patch('/:id/status', protect, authorize(['admin']), asyncHandler(userController.toggleUserStatus));

export default router; 