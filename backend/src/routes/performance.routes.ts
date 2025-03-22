import express from 'express';
import * as performanceController from '../controllers/performance.controller';
import { protect, authorize } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

/**
 * @route GET /api/performances
 * @desc Get all performances with pagination and filtering
 * @access Public
 */
router.get('/', asyncHandler(performanceController.getAllPerformances));

/**
 * @route GET /api/performances/:id
 * @desc Get performance by ID
 * @access Public
 */
router.get('/:id', asyncHandler(performanceController.getPerformanceById));

/**
 * @route GET /api/performances/event/:eventId
 * @desc Get performances by event ID
 * @access Public
 */
router.get('/event/:eventId', asyncHandler(performanceController.getPerformancesByEvent));

/**
 * @route POST /api/performances
 * @desc Create a new performance
 * @access Private (Admin/Manager)
 */
router.post('/', protect, authorize(['admin', 'manager']), asyncHandler(performanceController.createPerformance));

/**
 * @route PUT /api/performances/:id
 * @desc Update a performance
 * @access Private (Admin/Manager)
 */
router.put('/:id', protect, authorize(['admin', 'manager']), asyncHandler(performanceController.updatePerformance));

/**
 * @route DELETE /api/performances/:id
 * @desc Delete a performance
 * @access Private (Admin/Manager)
 */
router.delete('/:id', protect, authorize(['admin', 'manager']), asyncHandler(performanceController.deletePerformance));

/**
 * @route PATCH /api/performances/:id/tickets
 * @desc Update available tickets for a performance
 * @access Private (Admin/Manager)
 */
router.patch('/:id/tickets', protect, authorize(['admin', 'manager']), asyncHandler(performanceController.updateAvailableTickets));

export default router; 