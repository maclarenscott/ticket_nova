"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVenueSections = exports.deleteVenue = exports.updateVenue = exports.createVenue = exports.getVenueById = exports.getAllVenues = void 0;
const venue_model_1 = __importDefault(require("../models/venue.model"));
const mongoose_1 = __importDefault(require("mongoose"));
// Get all venues with pagination
const getAllVenues = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Count total venues
        const totalVenues = await venue_model_1.default.countDocuments();
        // Get venues with pagination
        const venues = await venue_model_1.default.find()
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);
        return res.status(200).json({
            status: 'success',
            results: venues.length,
            totalPages: Math.ceil(totalVenues / limit),
            currentPage: page,
            venues
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching venues'
        });
    }
};
exports.getAllVenues = getAllVenues;
// Get venue by ID
const getVenueById = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid venue ID format'
            });
        }
        // Find venue
        const venue = await venue_model_1.default.findById(id);
        if (!venue) {
            return res.status(404).json({
                status: 'error',
                message: 'Venue not found'
            });
        }
        return res.status(200).json({
            status: 'success',
            venue
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching the venue'
        });
    }
};
exports.getVenueById = getVenueById;
// Create a new venue (Admin/Manager only)
const createVenue = async (req, res) => {
    try {
        const { name, description, address, capacity, facilities, seatingMap, sections } = req.body;
        // Check if venue with same name already exists
        const existingVenue = await venue_model_1.default.findOne({ name });
        if (existingVenue) {
            return res.status(400).json({
                status: 'error',
                message: 'A venue with this name already exists'
            });
        }
        // Create new venue
        const venue = new venue_model_1.default({
            name,
            description,
            address,
            capacity,
            facilities: facilities || [],
            seatingMap,
            sections: sections || []
        });
        // Save venue
        await venue.save();
        return res.status(201).json({
            status: 'success',
            message: 'Venue created successfully',
            venue
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while creating the venue'
        });
    }
};
exports.createVenue = createVenue;
// Update a venue (Admin/Manager only)
const updateVenue = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid venue ID format'
            });
        }
        // Check if venue exists
        const venue = await venue_model_1.default.findById(id);
        if (!venue) {
            return res.status(404).json({
                status: 'error',
                message: 'Venue not found'
            });
        }
        // Check if updating name and if new name already exists
        if (req.body.name && req.body.name !== venue.name) {
            const existingVenue = await venue_model_1.default.findOne({ name: req.body.name });
            if (existingVenue) {
                return res.status(400).json({
                    status: 'error',
                    message: 'A venue with this name already exists'
                });
            }
        }
        // Update venue
        const updatedVenue = await venue_model_1.default.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
        return res.status(200).json({
            status: 'success',
            message: 'Venue updated successfully',
            venue: updatedVenue
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while updating the venue'
        });
    }
};
exports.updateVenue = updateVenue;
// Delete a venue (Admin only)
const deleteVenue = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid venue ID format'
            });
        }
        // Check if venue exists
        const venue = await venue_model_1.default.findById(id);
        if (!venue) {
            return res.status(404).json({
                status: 'error',
                message: 'Venue not found'
            });
        }
        // TODO: Check if venue is used in any events before deletion
        // For now, we'll just proceed with deletion
        // Delete venue
        await venue_model_1.default.findByIdAndDelete(id);
        return res.status(200).json({
            status: 'success',
            message: 'Venue deleted successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while deleting the venue'
        });
    }
};
exports.deleteVenue = deleteVenue;
// Get venue sections
const getVenueSections = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid venue ID format'
            });
        }
        // Find venue
        const venue = await venue_model_1.default.findById(id);
        if (!venue) {
            return res.status(404).json({
                status: 'error',
                message: 'Venue not found'
            });
        }
        return res.status(200).json({
            status: 'success',
            sections: venue.sections
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching venue sections'
        });
    }
};
exports.getVenueSections = getVenueSections;
//# sourceMappingURL=venue.controller.js.map