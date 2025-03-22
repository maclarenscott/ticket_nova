import express from 'express';
import * as venueController from '../controllers/venue.controller';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

/**
 * @route GET /api/venues
 * @desc Get all venues with pagination
 * @access Public
 */
router.get('/', asyncHandler(venueController.getAllVenues));

/**
 * @route GET /api/venues/:id
 * @desc Get venue by ID
 * @access Public
 */
router.get('/:id', asyncHandler(venueController.getVenueById));

/**
 * @route POST /api/venues
 * @desc Create a new venue
 * @access Public
 */
router.post('/', asyncHandler(venueController.createVenue));

/**
 * @route PUT /api/venues/:id
 * @desc Update a venue
 * @access Public
 */
router.put('/:id', asyncHandler(venueController.updateVenue));

/**
 * @route DELETE /api/venues/:id
 * @desc Delete a venue (actually deactivates it)
 * @access Public
 */
router.delete('/:id', asyncHandler(venueController.deleteVenue));

/**
 * @route GET /api/venues/:id/sections
 * @desc Get venue sections
 * @access Public
 */
router.get('/:id/sections', venueController.getVenueSections);

export default router; 