import { Request, Response } from 'express';
import Event from '../models/event.model';
import User from '../models/user.model';
import Ticket from '../models/ticket.model';

// Simple dashboard stats
export const getBasicStats = (req: Request, res: Response) => {
  Promise.all([
    Event.countDocuments(),
    User.countDocuments(),
    Ticket.countDocuments()
  ])
  .then(([events, users, tickets]) => {
    res.json({
      status: 'success',
      data: {
        totalEvents: events,
        totalUsers: users,
        totalTickets: tickets
      }
    });
  })
  .catch(err => {
    console.error('Error getting dashboard stats:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get dashboard stats' 
    });
  });
}; 