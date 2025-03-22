import { Request, Response } from 'express';
import Event from '../models/event.model';
import User from '../models/user.model';
import Ticket from '../models/ticket.model';
import Performance from '../models/performance.model';

// Get dashboard stats
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total events count
    const totalEvents = await Event.countDocuments();
    
    // Get active events count
    const activeEvents = await Event.countDocuments({ 
      isActive: true, 
      isPublished: true,
      endDate: { $gte: new Date() }
    });
    
    // Get total tickets count
    const totalTickets = await Ticket.countDocuments({ 
      paymentStatus: { $in: ['completed', 'paid'] } 
    });
    
    // Get total sales amount
    const salesData = await Ticket.aggregate([
      { 
        $match: { 
          paymentStatus: { $in: ['completed', 'paid'] }
        } 
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$price' }
        }
      }
    ]);
    
    const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;
    
    // Get upcoming performances count
    const upcomingPerformances = await Performance.countDocuments({
      date: { $gte: new Date() }
    });
    
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Return all stats
    res.status(200).json({
      status: 'success',
      data: {
        totalEvents,
        activeEvents,
        totalTickets,
        totalSales,
        upcomingPerformances,
        totalUsers
      }
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch dashboard stats'
    });
  }
};

// Get recent tickets
export const getRecentTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    
    const recentTickets = await Ticket.find({
      paymentStatus: { $in: ['completed', 'paid'] }
    })
    .sort({ purchaseDate: -1 })
    .limit(limit)
    .populate({
      path: 'event',
      select: 'title'
    })
    .populate({
      path: 'customer',
      select: 'firstName lastName email'
    });
    
    // Format the tickets data for the frontend
    const formattedTickets = recentTickets.map(ticket => ({
      id: ticket.ticketNumber,
      eventName: ticket.event ? (ticket.event as any).title : 'Unknown Event',
      customerName: ticket.customer ? 
        `${(ticket.customer as any).firstName} ${(ticket.customer as any).lastName}` : 
        'Unknown Customer',
      purchaseDate: ticket.purchaseDate,
      price: ticket.price,
      status: ticket.status
    }));
    
    res.status(200).json({
      status: 'success',
      data: formattedTickets
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch recent tickets'
    });
  }
};

// Get system status
export const getSystemStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real application, you would check these services
    // For demo purposes, we're returning mocked data
    res.status(200).json({
      status: 'success',
      data: {
        database: 'online',
        api: 'online',
        paymentGateway: 'online',
        emailService: 'online',
        lastBackup: new Date().toISOString()
      }
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch system status'
    });
  }
}; 