"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAvailableTickets = exports.deletePerformance = exports.updatePerformance = exports.createPerformance = exports.getPerformancesByEvent = exports.getPerformanceById = exports.getAllPerformances = void 0;
const performance_model_1 = __importDefault(require("../models/performance.model"));
const event_model_1 = __importDefault(require("../models/event.model"));
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
const mongoose_1 = __importDefault(require("mongoose"));
// Get all performances with pagination and filtering
const getAllPerformances = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {};
        // Filter by event if provided
        if (req.query.event) {
            filter.event = req.query.event;
        }
        // Filter by date range
        if (req.query.startDate) {
            filter.date = { $gte: new Date(req.query.startDate) };
        }
        if (req.query.endDate) {
            filter.date = filter.date || {};
            filter.date.$lte = new Date(req.query.endDate);
        }
        // Filter by sold out status
        if (req.query.isSoldOut === 'true') {
            filter.isSoldOut = true;
        }
        else if (req.query.isSoldOut === 'false') {
            filter.isSoldOut = false;
        }
        // Filter by active status
        if (req.query.isActive === 'true') {
            filter.isActive = true;
        }
        else if (req.query.isActive === 'false') {
            filter.isActive = false;
        }
        // Count total matching documents
        const totalPerformances = await performance_model_1.default.countDocuments(filter);
        // Get performances with pagination
        const performances = await performance_model_1.default.find(filter)
            .sort({ date: 1, startTime: 1 })
            .skip(skip)
            .limit(limit)
            .populate('event', 'title category');
        return res.status(200).json({
            status: 'success',
            results: performances.length,
            totalPages: Math.ceil(totalPerformances / limit),
            currentPage: page,
            performances
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching performances'
        });
    }
};
exports.getAllPerformances = getAllPerformances;
// Get performance by ID
const getPerformanceById = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid performance ID format'
            });
        }
        // Find performance
        const performance = await performance_model_1.default.findById(id)
            .populate('event', 'title description category venue');
        if (!performance) {
            return res.status(404).json({
                status: 'error',
                message: 'Performance not found'
            });
        }
        return res.status(200).json({
            status: 'success',
            performance
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching the performance'
        });
    }
};
exports.getPerformanceById = getPerformanceById;
// Get performances by event ID
const getPerformancesByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid event ID format'
            });
        }
        // Check if event exists
        const event = await event_model_1.default.findById(eventId);
        if (!event) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        // Get performances for this event
        const performances = await performance_model_1.default.find({ event: eventId })
            .sort({ date: 1, startTime: 1 });
        return res.status(200).json({
            status: 'success',
            results: performances.length,
            event: {
                _id: event._id,
                title: event.title
            },
            performances
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while fetching performances'
        });
    }
};
exports.getPerformancesByEvent = getPerformancesByEvent;
// Create a new performance (Admin/Manager only)
const createPerformance = async (req, res) => {
    try {
        const { event, date, startTime, endTime, totalCapacity, ticketTypes, notes } = req.body;
        // Validate that event exists
        if (!mongoose_1.default.Types.ObjectId.isValid(event)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid event ID format'
            });
        }
        const eventExists = await event_model_1.default.findById(event);
        if (!eventExists) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        // Calculate total available tickets from ticketTypes
        const availableTickets = ticketTypes.reduce((sum, type) => sum + type.availableCount, 0);
        // Create new performance
        const performance = new performance_model_1.default({
            event,
            date,
            startTime,
            endTime,
            totalCapacity,
            availableTickets,
            ticketTypes,
            notes,
            isActive: true,
            isSoldOut: availableTickets === 0
        });
        // Save performance
        await performance.save();
        // Update event with this performance
        await event_model_1.default.findByIdAndUpdate(event, { $push: { performances: performance._id } });
        return res.status(201).json({
            status: 'success',
            message: 'Performance created successfully',
            performance
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while creating the performance'
        });
    }
};
exports.createPerformance = createPerformance;
// Update a performance (Admin/Manager only)
const updatePerformance = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid performance ID format'
            });
        }
        // Find performance
        const performance = await performance_model_1.default.findById(id);
        if (!performance) {
            return res.status(404).json({
                status: 'error',
                message: 'Performance not found'
            });
        }
        // Check if this performance already has tickets
        const ticketCount = await ticket_model_1.default.countDocuments({ 'performance._id': id });
        // If tickets exist, restrict what can be updated
        if (ticketCount > 0) {
            // Extract only allowed fields to update
            const allowedUpdates = {
                notes: req.body.notes,
                isActive: req.body.isActive
            };
            // Update performance with restricted fields
            const updatedPerformance = await performance_model_1.default.findByIdAndUpdate(id, { $set: allowedUpdates }, { new: true, runValidators: true });
            return res.status(200).json({
                status: 'success',
                message: 'Performance updated with restrictions (tickets already exist)',
                performance: updatedPerformance
            });
        }
        // If no tickets exist, allow full update
        // Calculate total available tickets from ticketTypes if provided
        if (req.body.ticketTypes) {
            req.body.availableTickets = req.body.ticketTypes.reduce((sum, type) => sum + type.availableCount, 0);
        }
        // Update performance
        const updatedPerformance = await performance_model_1.default.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
        return res.status(200).json({
            status: 'success',
            message: 'Performance updated successfully',
            performance: updatedPerformance
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while updating the performance'
        });
    }
};
exports.updatePerformance = updatePerformance;
// Delete a performance (Admin/Manager only)
const deletePerformance = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid performance ID format'
            });
        }
        // Find performance
        const performance = await performance_model_1.default.findById(id);
        if (!performance) {
            return res.status(404).json({
                status: 'error',
                message: 'Performance not found'
            });
        }
        // Check if this performance has tickets
        const ticketCount = await ticket_model_1.default.countDocuments({ 'performance._id': id });
        if (ticketCount > 0) {
            // If tickets exist, mark as inactive instead of deleting
            await performance_model_1.default.findByIdAndUpdate(id, { isActive: false });
            return res.status(200).json({
                status: 'success',
                message: 'Performance has associated tickets and has been marked as inactive'
            });
        }
        // Remove reference from event
        await event_model_1.default.findByIdAndUpdate(performance.event, { $pull: { performances: id } });
        // If no tickets, delete the performance
        await performance_model_1.default.findByIdAndDelete(id);
        return res.status(200).json({
            status: 'success',
            message: 'Performance deleted successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while deleting the performance'
        });
    }
};
exports.deletePerformance = deletePerformance;
// Update available tickets count (for admin use, manual override)
const updateAvailableTickets = async (req, res) => {
    try {
        const { id } = req.params;
        const { availableTickets } = req.body;
        // Validate ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid performance ID format'
            });
        }
        if (availableTickets === undefined || availableTickets < 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Available tickets must be a non-negative number'
            });
        }
        // Find performance
        const performance = await performance_model_1.default.findById(id);
        if (!performance) {
            return res.status(404).json({
                status: 'error',
                message: 'Performance not found'
            });
        }
        // Update available tickets
        performance.availableTickets = availableTickets;
        // Update isSoldOut status
        performance.isSoldOut = availableTickets === 0;
        await performance.save();
        return res.status(200).json({
            status: 'success',
            message: 'Available tickets updated successfully',
            performance
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred while updating available tickets'
        });
    }
};
exports.updateAvailableTickets = updateAvailableTickets;
//# sourceMappingURL=performance.controller.js.map