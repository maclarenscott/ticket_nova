import { Request, Response } from 'express';
import Venue from '../models/venue.model';
import mongoose from 'mongoose';

// Get all venues
export const getAllVenues = async (req: Request, res: Response) => {
  try {
    // Basic pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Only show active venues to non-admin users
    const filter: any = {};
    if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'Manager')) {
      filter.isActive = true;
    }
    
    // Count total venues
    const totalVenues = await Venue.countDocuments(filter);
    
    // Get venues with pagination
    const venues = await Venue.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .select('name address capacity facilities isActive');
    
    return res.status(200).json({
      status: 'success',
      results: venues.length,
      totalPages: Math.ceil(totalVenues / limit),
      currentPage: page,
      venues
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching venues'
    });
  }
};

// Get venue by ID
export const getVenueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid venue ID format'
      });
    }
    
    // Find venue
    const venue = await Venue.findById(id);
    
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }
    
    // Check if venue is active for non-admin users
    if (!venue.isActive && (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'Manager'))) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this venue'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      venue
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching the venue'
    });
  }
};

// Create a new venue (Admin/Manager only)
export const createVenue = async (req: Request, res: Response) => {
  try {
    // Create new venue
    const venue = new Venue(req.body);
    
    // Save venue
    await venue.save();
    
    return res.status(201).json({
      status: 'success',
      message: 'Venue created successfully',
      venue
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while creating the venue'
    });
  }
};

// Update a venue (Admin/Manager only)
export const updateVenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid venue ID format'
      });
    }
    
    // Find and update venue
    const venue = await Venue.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Venue updated successfully',
      venue
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while updating the venue'
    });
  }
};

// Delete a venue (Admin only)
export const deleteVenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid venue ID format'
      });
    }
    
    // Check if venue exists
    const venue = await Venue.findById(id);
    
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }
    
    // Check if venue has associated events
    // In a real application, you would need to check for associated events
    // For now, we'll just set isActive to false instead of deleting
    
    venue.isActive = false;
    await venue.save();
    
    return res.status(200).json({
      status: 'success',
      message: 'Venue has been deactivated'
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while deactivating the venue'
    });
  }
};

// Get venue sections
export const getVenueSections = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid venue ID format'
      });
    }
    
    // Find venue
    const venue = await Venue.findById(id);
    
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
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching venue sections'
    });
  }
}; 