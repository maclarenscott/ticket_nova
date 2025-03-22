"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventCategories = exports.toggleFeaturedStatus = exports.togglePublishStatus = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.getAllEvents = void 0;
const event_model_1 = __importDefault(require("../models/event.model"));
const performance_model_1 = __importDefault(require("../models/performance.model"));
const mongoose_1 = __importDefault(require("mongoose"));
// Get all events with pagination and filtering
const getAllEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {};
        // Only show published events to non-admin users
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
            filter.isPublished = true;
            filter.isActive = true;
        }
        // Filter by category if provided
        if (req.query.category) {
            filter.category = req.query.category;
        }
        // Filter by title search if provided
        if (req.query.search) {
            filter.title = { $regex: req.query.search, $options: 'i' };
        }
        // Filter by featured events
        if (req.query.featured === 'true') {
            filter.isFeatured = true;
        }
        // Filter by date range
        if (req.query.startDate) {
            filter.startDate = { $gte: new Date(req.query.startDate) };
        }
        if (req.query.endDate) {
            filter.endDate = { $lte: new Date(req.query.endDate) };
        }
        // Count total matching documents
        const totalEvents = await event_model_1.default.countDocuments(filter);
        // Get events with pagination
        const events = await event_model_1.default.find(filter)
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(limit)
            .populate('venue', 'name address capacity')
            .populate('organizer', 'firstName lastName email');
        return res.status(200).json({
            status: 'success',
            results: events.length,
            totalPages: Math.ceil(totalEvents / limit),
            currentPage: page,
            events
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching events'
        });
    }
};
exports.getAllEvents = getAllEvents;
// Get event by ID
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid event ID format'
            });
        }
        // Find event
        const event = await event_model_1.default.findById(id)
            .populate('venue', 'name address capacity seatingMap facilities')
            .populate('organizer', 'firstName lastName email')
            .populate({
            path: 'performances',
            select: 'date startTime endTime availableTickets ticketTypes',
            options: { sort: { date: 1 } }
        });
        if (!event) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        // Check if event is published for non-admin users
        if (!event.isPublished && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager'))) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to view this event'
            });
        }
        return res.status(200).json({
            status: 'success',
            event
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching the event'
        });
    }
};
exports.getEventById = getEventById;
// Create a new event (Admin/Manager only)
const createEvent = async (req, res) => {
    try {
        const { title, description, venue, category, startDate, endDate, duration, image, isPublished, isFeatured, tags } = req.body;
        // Create new event
        const event = new event_model_1.default({
            title,
            description,
            venue,
            organizer: req.user.id, // Set current user as organizer
            category,
            startDate,
            endDate,
            duration,
            image,
            isPublished: isPublished || false,
            isFeatured: isFeatured || false,
            isActive: true,
            tags: tags || []
        });
        // Save event
        await event.save();
        return res.status(201).json({
            status: 'success',
            message: 'Event created successfully',
            event
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while creating the event'
        });
    }
};
exports.createEvent = createEvent;
// Update an event (Admin/Manager only)
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid event ID format'
            });
        }
        // Find event
        const event = await event_model_1.default.findById(id);
        if (!event) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        // Update event fields
        const updatedEvent = await event_model_1.default.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
        return res.status(200).json({
            status: 'success',
            message: 'Event updated successfully',
            event: updatedEvent
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while updating the event'
        });
    }
};
exports.updateEvent = updateEvent;
// Delete an event (Admin/Manager only)
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid event ID format'
            });
        }
        // Check if event exists
        const event = await event_model_1.default.findById(id);
        if (!event) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        // Check if event has associated performances
        const performanceCount = await performance_model_1.default.countDocuments({ event: id });
        if (performanceCount > 0) {
            // If there are performances, just mark as inactive instead of deleting
            await event_model_1.default.findByIdAndUpdate(id, { isActive: false });
            return res.status(200).json({
                status: 'success',
                message: 'Event has associated performances and has been marked as inactive'
            });
        }
        // If no performances, delete the event
        await event_model_1.default.findByIdAndDelete(id);
        return res.status(200).json({
            status: 'success',
            message: 'Event deleted successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while deleting the event'
        });
    }
};
exports.deleteEvent = deleteEvent;
// Toggle event published status (Admin/Manager only)
const togglePublishStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid event ID format'
            });
        }
        // Find event
        const event = await event_model_1.default.findById(id);
        if (!event) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        // Toggle published status
        event.isPublished = !event.isPublished;
        await event.save();
        return res.status(200).json({
            status: 'success',
            message: `Event ${event.isPublished ? 'published' : 'unpublished'} successfully`,
            isPublished: event.isPublished
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while toggling publish status'
        });
    }
};
exports.togglePublishStatus = togglePublishStatus;
// Toggle event featured status (Admin/Manager only)
const toggleFeaturedStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid event ID format'
            });
        }
        // Find event
        const event = await event_model_1.default.findById(id);
        if (!event) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        // Toggle featured status
        event.isFeatured = !event.isFeatured;
        await event.save();
        return res.status(200).json({
            status: 'success',
            message: `Event ${event.isFeatured ? 'marked as featured' : 'removed from featured'} successfully`,
            isFeatured: event.isFeatured
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while toggling featured status'
        });
    }
};
exports.toggleFeaturedStatus = toggleFeaturedStatus;
// Get event categories
const getEventCategories = async (_req, res) => {
    try {
        // Use aggregation to get distinct categories
        const categories = await event_model_1.default.aggregate([
            { $match: { isActive: true, isPublished: true } },
            { $group: { _id: '$category' } },
            { $sort: { _id: 1 } }
        ]);
        return res.status(200).json({
            status: 'success',
            categories: categories.map(cat => cat._id)
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching event categories'
        });
    }
};
exports.getEventCategories = getEventCategories;
//# sourceMappingURL=event.controller.js.map