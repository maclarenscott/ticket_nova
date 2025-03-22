import express from 'express';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import asyncWrapper from '../utils/asyncWrapper';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', asyncWrapper(authController.register));

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', asyncWrapper(authController.login));

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', protect, asyncWrapper(authController.getCurrentUser));

/**
 * @route POST /api/auth/password/reset-request
 * @desc Request password reset
 * @access Public
 */
router.post('/password/reset-request', asyncWrapper(authController.requestPasswordReset));

/**
 * @route POST /api/auth/password/reset
 * @desc Reset password with token
 * @access Public
 */
router.post('/password/reset', asyncWrapper(authController.resetPassword));

/**
 * @route POST /api/auth/password/change
 * @desc Change password (for logged in users)
 * @access Private
 */
router.post('/password/change', protect, asyncWrapper(authController.changePassword));

export default router; 