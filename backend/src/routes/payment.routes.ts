import express from 'express';
import * as paymentController from '../controllers/payment.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import asyncWrapper from '../utils/asyncWrapper';

const router = express.Router();

/**
 * @route POST /api/payments/create-payment-intent
 * @desc Create a payment intent with Stripe
 * @access Public
 */
router.post('/create-payment-intent', asyncWrapper(paymentController.createPaymentIntent));

/**
 * @route POST /api/payments/confirm
 * @desc Confirm payment and update ticket status
 * @access Private
 */
router.post('/confirm', protect, asyncWrapper(paymentController.confirmPayment));

/**
 * @route POST /api/payments/cancel
 * @desc Cancel payment and release tickets
 * @access Private
 */
router.post('/cancel', protect, asyncWrapper(paymentController.cancelPayment));

/**
 * @route GET /api/payments/history
 * @desc Get payment history for current user
 * @access Private
 */
router.get('/history', protect, asyncWrapper(paymentController.getPaymentHistory));

/**
 * @route POST /api/payments/
 * @desc Process payment and create payment record
 * @access Private
 */
router.post('/', protect, asyncWrapper(paymentController.createPayment));

/**
 * @route GET /api/payments/:id
 * @desc Get payment by ID
 * @access Private
 */
router.get('/:id', protect, asyncWrapper(paymentController.getPaymentById));

/**
 * @route POST /api/payments/:id/refund
 * @desc Refund payment (admin/manager only)
 * @access Private
 */
router.post('/:id/refund', protect, restrictTo('admin', 'manager'), asyncWrapper(paymentController.refundPayment));

export default router; 