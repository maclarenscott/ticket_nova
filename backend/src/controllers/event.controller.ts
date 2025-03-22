import { Request, Response } from 'express';
import Event from '../models/event.model';
import Performance from '../models/performance.model';
import mongoose from 'mongoose';

// Get all events with pagination and filtering
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {};
    
    // Only show published events to non-admin users
    if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'Manager')) {
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
      filter.startDate = { $gte: new Date(req.query.startDate as string) };
    }
    
    if (req.query.endDate) {
      filter.endDate = { $lte: new Date(req.query.endDate as string) };
    }
    
    // Count total matching documents
    const totalEvents = await Event.countDocuments(filter);
    
    // Get events with pagination
    const events = await Event.find(filter)
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
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching events'
    });
  }
};

// Get event by ID
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid event ID format'
      });
    }
    
    // Find event
    const event = await Event.findById(id)
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
    if (!event.isPublished && (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'Manager'))) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this event'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      event
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching the event'
    });
  }
};

// Create a new event (Admin/Manager only)
export const createEvent = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      venue,
      category,
      startDate,
      endDate,
      duration,
      image,
      isPublished,
      isFeatured,
      tags
    } = req.body;
    
    // Create new event
    const event = new Event({
      title,
      description,
      venue,
      // Use a default organizer ID if req.user is undefined
      organizer: req.user?.id || '65f5b3d35584cf887562a8b7', // Use a default admin ID
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
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while creating the event'
    });
  }
};

// Update an event (Admin/Manager only)
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid event ID format'
      });
    }
    
    // Find event
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }
    
    // Update event fields
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      status: 'success',
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while updating the event'
    });
  }
};

// Delete an event (Admin/Manager only)
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid event ID format'
      });
    }
    
    // Check if event exists
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }
    
    // Check if event has associated performances
    const performanceCount = await Performance.countDocuments({ event: id });
    
    if (performanceCount > 0) {
      // If there are performances, just mark as inactive instead of deleting
      await Event.findByIdAndUpdate(id, { isActive: false });
      
      return res.status(200).json({
        status: 'success',
        message: 'Event has associated performances and has been marked as inactive'
      });
    }
    
    // If no performances, delete the event
    await Event.findByIdAndDelete(id);
    
    return res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while deleting the event'
    });
  }
};

// Toggle event published status (Admin/Manager only)
export const togglePublishStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid event ID format'
      });
    }
    
    // Find event
    const event = await Event.findById(id);
    
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
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while toggling publish status'
    });
  }
};

// Toggle event featured status (Admin/Manager only)
export const toggleFeaturedStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid event ID format'
      });
    }
    
    // Find event
    const event = await Event.findById(id);
    
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
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while toggling featured status'
    });
  }
};

// Get event categories
export const getEventCategories = async (_req: Request, res: Response) => {
  try {
    // Use aggregation to get distinct categories
    const categories = await Event.aggregate([
      { $match: { isActive: true, isPublished: true } },
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } }
    ]);
    
    return res.status(200).json({
      status: 'success',
      categories: categories.map(cat => cat._id)
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching event categories'
    });
  }
};

// Get events by venue ID
export const getEventsByVenue = async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid venue ID format'
      });
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = { venue: venueId };
    
    // Only show published events to non-admin users
    if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'Manager')) {
      filter.isPublished = true;
      filter.isActive = true;
    }
    
    // Count total matching documents
    const totalEvents = await Event.countDocuments(filter);
    
    // Get events with pagination
    const events = await Event.find(filter)
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
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching events for this venue'
    });
  }
}; 