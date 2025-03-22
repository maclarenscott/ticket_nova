import express from 'express';
import * as eventController from '../controllers/event.controller';
// import { protect, authorize } from '../middleware/auth'; // No longer needed
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

/**
 * @route GET /api/events
 * @desc Get all events with pagination and filtering
 * @access Public
 */
router.get('/', asyncHandler(eventController.getAllEvents));

/**
 * @route GET /api/events/:id
 * @desc Get event by ID
 * @access Public
 */
router.get('/:id', asyncHandler(eventController.getEventById));

/**
 * @route GET /api/events/venue/:venueId
 * @desc Get events by venue ID
 * @access Public
 */
router.get('/venue/:venueId', asyncHandler(eventController.getEventsByVenue));

/**
 * @route POST /api/events
 * @desc Create a new event
 * @access Public
 */
router.post('/', asyncHandler(eventController.createEvent));

/**
 * @route PUT /api/events/:id
 * @desc Update an event
 * @access Public
 */
router.put('/:id', asyncHandler(eventController.updateEvent));

/**
 * @route DELETE /api/events/:id
 * @desc Delete an event
 * @access Public
 */
router.delete('/:id', asyncHandler(eventController.deleteEvent));

/**
 * @route PATCH /api/events/:id/publish
 * @desc Toggle event published status
 * @access Public
 */
router.patch('/:id/publish', asyncHandler(eventController.togglePublishStatus));

/**
 * @route PATCH /api/events/:id/feature
 * @desc Toggle event featured status
 * @access Public
 */
router.patch('/:id/feature', asyncHandler(eventController.toggleFeaturedStatus));

/**
 * @route GET /api/events/categories
 * @desc Get all event categories
 * @access Public
 */
router.get('/categories', asyncHandler(eventController.getEventCategories));

export default router; 