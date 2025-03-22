import { Request, Response } from 'express';
import Performance from '../models/performance.model';
import Event from '../models/event.model';
import Ticket from '../models/ticket.model';
import mongoose from 'mongoose';

// Get all performances with pagination and filtering
export const getAllPerformances = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {};
    
    // Filter by event if provided
    if (req.query.event) {
      filter.event = req.query.event;
    }
    
    // Filter by date range
    if (req.query.startDate) {
      filter.date = { $gte: new Date(req.query.startDate as string) };
    }
    
    if (req.query.endDate) {
      filter.date = filter.date || {};
      filter.date.$lte = new Date(req.query.endDate as string);
    }
    
    // Filter by sold out status
    if (req.query.isSoldOut === 'true') {
      filter.isSoldOut = true;
    } else if (req.query.isSoldOut === 'false') {
      filter.isSoldOut = false;
    }
    
    // Filter by active status
    if (req.query.isActive === 'true') {
      filter.isActive = true;
    } else if (req.query.isActive === 'false') {
      filter.isActive = false;
    }
    
    // Count total matching documents
    const totalPerformances = await Performance.countDocuments(filter);
    
    // Get performances with pagination
    const performances = await Performance.find(filter)
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
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching performances'
    });
  }
};

// Get performance by ID
export const getPerformanceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid performance ID format'
      });
    }
    
    // Find performance
    const performance = await Performance.findById(id)
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
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching the performance'
    });
  }
};

// Get performances by event ID
export const getPerformancesByEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid event ID format'
      });
    }
    
    // Check if event exists
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }
    
    // Get performances for this event
    const performances = await Performance.find({ event: eventId })
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
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching performances'
    });
  }
};

// Create a new performance (Admin/Manager only)
export const createPerformance = async (req: Request, res: Response) => {
  try {
    const {
      event,
      date,
      startTime,
      endTime,
      totalCapacity,
      ticketTypes,
      notes
    } = req.body;
    
    // Validate that event exists
    if (!mongoose.Types.ObjectId.isValid(event)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid event ID format'
      });
    }
    
    const eventExists = await Event.findById(event);
    if (!eventExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }
    
    // Calculate total available tickets from ticketTypes
    const availableTickets = ticketTypes.reduce(
      (sum: number, type: { availableCount: number }) => sum + type.availableCount,
      0
    );
    
    // Create new performance
    const performance = new Performance({
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
    await Event.findByIdAndUpdate(
      event,
      { $push: { performances: performance._id } }
    );
    
    return res.status(201).json({
      status: 'success',
      message: 'Performance created successfully',
      performance
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while creating the performance'
    });
  }
};

// Update a performance (Admin/Manager only)
export const updatePerformance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid performance ID format'
      });
    }
    
    // Find performance
    const performance = await Performance.findById(id);
    
    if (!performance) {
      return res.status(404).json({
        status: 'error',
        message: 'Performance not found'
      });
    }
    
    // Check if this performance already has tickets
    const ticketCount = await Ticket.countDocuments({ 'performance._id': id });
    
    // If tickets exist, restrict what can be updated
    if (ticketCount > 0) {
      // Extract only allowed fields to update
      const allowedUpdates = {
        notes: req.body.notes,
        isActive: req.body.isActive
      };
      
      // Update performance with restricted fields
      const updatedPerformance = await Performance.findByIdAndUpdate(
        id,
        { $set: allowedUpdates },
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({
        status: 'success',
        message: 'Performance updated with restrictions (tickets already exist)',
        performance: updatedPerformance
      });
    }
    
    // If no tickets exist, allow full update
    // Calculate total available tickets from ticketTypes if provided
    if (req.body.ticketTypes) {
      req.body.availableTickets = req.body.ticketTypes.reduce(
        (sum: number, type: { availableCount: number }) => sum + type.availableCount,
        0
      );
    }
    
    // Update performance
    const updatedPerformance = await Performance.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      status: 'success',
      message: 'Performance updated successfully',
      performance: updatedPerformance
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while updating the performance'
    });
  }
};

// Delete a performance (Admin/Manager only)
export const deletePerformance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid performance ID format'
      });
    }
    
    // Find performance
    const performance = await Performance.findById(id);
    
    if (!performance) {
      return res.status(404).json({
        status: 'error',
        message: 'Performance not found'
      });
    }
    
    // Check if this performance has tickets
    const ticketCount = await Ticket.countDocuments({ 'performance._id': id });
    
    if (ticketCount > 0) {
      // If tickets exist, mark as inactive instead of deleting
      await Performance.findByIdAndUpdate(id, { isActive: false });
      
      return res.status(200).json({
        status: 'success',
        message: 'Performance has associated tickets and has been marked as inactive'
      });
    }
    
    // Remove reference from event
    await Event.findByIdAndUpdate(
      performance.event,
      { $pull: { performances: id } }
    );
    
    // If no tickets, delete the performance
    await Performance.findByIdAndDelete(id);
    
    return res.status(200).json({
      status: 'success',
      message: 'Performance deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while deleting the performance'
    });
  }
};

// Update available tickets count (for admin use, manual override)
export const updateAvailableTickets = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { availableTickets } = req.body;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
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
    const performance = await Performance.findById(id);
    
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
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while updating available tickets'
    });
  }
}; 