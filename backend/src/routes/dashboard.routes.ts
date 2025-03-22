// @ts-ignore
import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
// import { protect, managerMiddleware } from '../middleware/auth'; // No longer needed
import asyncHandler from '../utils/asyncHandler';
import { Request, Response } from 'express';

const router = express.Router();

// Create wrappers around controller functions that handle the promise correctly
const getStats = asyncHandler(async (req: Request, res: Response) => {
  await dashboardController.getDashboardStats(req, res);
});

const getRecentTickets = asyncHandler(async (req: Request, res: Response) => {
  await dashboardController.getRecentTickets(req, res);
});

const getSystemStatus = asyncHandler(async (req: Request, res: Response) => {
  await dashboardController.getSystemStatus(req, res);
});

/**
 * @route GET /api/dashboard/stats
 * @desc Get admin dashboard statistics
 * @access Public
 */
router.get('/stats', getStats);

/**
 * @route GET /api/dashboard/recent-tickets
 * @desc Get recent tickets for dashboard
 * @access Public
 */
router.get('/recent-tickets', getRecentTickets);

/**
 * @route GET /api/dashboard/system-status
 * @desc Get system status information
 * @access Public
 */
router.get('/system-status', getSystemStatus);

export default router; 