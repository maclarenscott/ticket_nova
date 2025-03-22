import express from 'express';
import * as orderController from '../controllers/order.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import asyncWrapper from '../utils/asyncWrapper';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Create a new order
router.post('/', asyncWrapper(orderController.createOrder));

// Get my orders
router.get('/my-orders', asyncWrapper(orderController.getMyOrders));

// Get order by ID
router.get('/:id', asyncWrapper(orderController.getOrderById));

// Admin and manager routes
router.use(restrictTo('admin', 'manager'));

// Get all orders (admin/manager only)
router.get('/', asyncWrapper(orderController.getAllOrders));

// Update order status (admin/manager only)
router.patch('/:id/status', asyncWrapper(orderController.updateOrderStatus));

export default router; 