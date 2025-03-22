import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';

// Load environment variables
dotenv.config();

// Import route handlers
import authRoutes from './routes/auth.routes';
import venueRoutes from './routes/venue.routes';
import eventRoutes from './routes/event.routes';
import performanceRoutes from './routes/performance.routes';
import ticketRoutes from './routes/ticket.routes';
import paymentRoutes from './routes/payment.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Import models for test endpoint
import Event from './models/event.model';
import User from './models/user.model';
import Ticket from './models/ticket.model';

// Import test controller
import * as dashboardTestController from './controllers/dashboardTest.controller';

// Create Express app
const app = express();

// Set port
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketing-system')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`Origin ${origin} not allowed by CORS`);
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/performances', performanceRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running successfully'
  });
});

// Test endpoint for dashboard stats - TEMPORARY FOR DEBUGGING
app.get('/api/test/dashboard', async (req, res) => {
  try {
    // Get total events count
    const totalEvents = await Event.countDocuments();
    
    // Get total users
    const totalUsers = await User.countDocuments();
    
    res.json({
      status: 'success',
      message: 'Test endpoint working',
      data: {
        totalEvents,
        totalUsers
      }
    });
  } catch (err) {
    console.error('Test endpoint error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Test endpoint failed'
    });
  }
});

// Another test endpoint with simpler implementation
app.get('/api/test/dashboard2', dashboardTestController.getBasicStats);

// Unprotected dashboard endpoint for testing
app.get('/api/dashboard/test-stats', async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ 
      isActive: true, 
      isPublished: true,
      endDate: { $gte: new Date() }
    });
    
    const totalTickets = await Ticket.countDocuments({ 
      paymentStatus: { $in: ['completed', 'paid'] } 
    });
    
    const totalUsers = await User.countDocuments();
    
    res.json({
      status: 'success',
      data: {
        totalEvents,
        activeEvents,
        totalTickets,
        totalUsers
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard stats'
    });
  }
});

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to the Dalhousie Arts Centre Ticketing System API',
    version: '1.0.0',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found - The requested resource does not exist'
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}); 