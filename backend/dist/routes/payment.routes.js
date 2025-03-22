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
const paymentController = __importStar(require("../controllers/payment.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const asyncWrapper_1 = __importDefault(require("../utils/asyncWrapper"));
const router = express_1.default.Router();
/**
 * @route POST /api/payments/create-payment-intent
 * @desc Create a payment intent with Stripe
 * @access Public
 */
router.post('/create-payment-intent', (0, asyncWrapper_1.default)(paymentController.createPaymentIntent));
/**
 * @route POST /api/payments/confirm
 * @desc Confirm payment and update ticket status
 * @access Private
 */
router.post('/confirm', auth_middleware_1.protect, (0, asyncWrapper_1.default)(paymentController.confirmPayment));
/**
 * @route POST /api/payments/cancel
 * @desc Cancel payment and release tickets
 * @access Private
 */
router.post('/cancel', auth_middleware_1.protect, (0, asyncWrapper_1.default)(paymentController.cancelPayment));
/**
 * @route GET /api/payments/history
 * @desc Get payment history for current user
 * @access Private
 */
router.get('/history', auth_middleware_1.protect, (0, asyncWrapper_1.default)(paymentController.getPaymentHistory));
/**
 * @route POST /api/payments/
 * @desc Process payment and create payment record
 * @access Private
 */
router.post('/', auth_middleware_1.protect, (0, asyncWrapper_1.default)(paymentController.createPayment));
/**
 * @route GET /api/payments/:id
 * @desc Get payment by ID
 * @access Private
 */
router.get('/:id', auth_middleware_1.protect, (0, asyncWrapper_1.default)(paymentController.getPaymentById));
/**
 * @route POST /api/payments/:id/refund
 * @desc Refund payment (admin/manager only)
 * @access Private
 */
router.post('/:id/refund', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'manager'), (0, asyncWrapper_1.default)(paymentController.refundPayment));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map