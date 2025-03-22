"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ticketController = __importStar(require("../controllers/ticket.controller"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * @route GET /api/tickets
 * @desc Get all tickets with pagination and filtering
 * @access Private (Admin/Manager)
 */
router.get('/', auth_1.protect, (0, auth_1.authorize)(['admin', 'manager']), ticketController.getAllTickets);
/**
 * @route GET /api/tickets/:id
 * @desc Get ticket by ID
 * @access Private
 */
router.get('/:id', auth_1.protect, ticketController.getTicketById);
/**
 * @route POST /api/tickets
 * @desc Create a new ticket
 * @access Private
 */
router.post('/', auth_1.protect, ticketController.createTicket);
/**
 * @route PATCH /api/tickets/:id/status
 * @desc Update ticket status
 * @access Private (Admin/Manager/Owner)
 */
router.patch('/:id/status', auth_1.protect, ticketController.updateTicketStatus);
/**
 * @route GET /api/tickets/my-tickets
 * @desc Get current user's tickets
 * @access Private
 */
router.get('/my-tickets', auth_1.protect, ticketController.getMyTickets);
/**
 * @route GET /api/tickets/:id/pdf
 * @desc Generate ticket PDF
 * @access Private
 */
router.get('/:id/pdf', auth_1.protect, ticketController.generateTicketPDF);
/**
 * @route POST /api/tickets/:id/email
 * @desc Email ticket to user
 * @access Private
 */
router.post('/:id/email', auth_1.protect, ticketController.emailTicket);
exports.default = router;
//# sourceMappingURL=ticket.routes.js.map