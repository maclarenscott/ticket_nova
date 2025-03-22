import express from 'express';
import * as ticketController from '../controllers/ticket.controller';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/tickets
 * @desc Get all tickets with pagination and filtering
 * @access Private (Admin/Manager)
 */
router.get('/', protect, authorize(['admin', 'manager']), ticketController.getAllTickets);

/**
 * @route GET /api/tickets/:id
 * @desc Get ticket by ID
 * @access Private
 */
router.get('/:id', protect, ticketController.getTicketById);

/**
 * @route POST /api/tickets
 * @desc Create a new ticket
 * @access Private
 */
router.post('/', protect, ticketController.createTicket);

/**
 * @route PATCH /api/tickets/:id/status
 * @desc Update ticket status
 * @access Private (Admin/Manager/Owner)
 */
router.patch('/:id/status', protect, ticketController.updateTicketStatus);

/**
 * @route GET /api/tickets/my-tickets
 * @desc Get current user's tickets
 * @access Private
 */
router.get('/my-tickets', protect, ticketController.getMyTickets);

/**
 * @route GET /api/tickets/:id/pdf
 * @desc Generate ticket PDF
 * @access Private
 */
router.get('/:id/pdf', protect, ticketController.generateTicketPDF);

/**
 * @route POST /api/tickets/:id/email
 * @desc Email ticket to user
 * @access Private
 */
router.post('/:id/email', protect, ticketController.emailTicket);

export default router; 