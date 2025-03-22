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
const orderController = __importStar(require("../controllers/order.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const asyncWrapper_1 = __importDefault(require("../utils/asyncWrapper"));
const router = express_1.default.Router();
// Protect all routes after this middleware
router.use(auth_middleware_1.protect);
// Create a new order
router.post('/', (0, asyncWrapper_1.default)(orderController.createOrder));
// Get my orders
router.get('/my-orders', (0, asyncWrapper_1.default)(orderController.getMyOrders));
// Get order by ID
router.get('/:id', (0, asyncWrapper_1.default)(orderController.getOrderById));
// Admin and manager routes
router.use((0, auth_middleware_1.restrictTo)('admin', 'manager'));
// Get all orders (admin/manager only)
router.get('/', (0, asyncWrapper_1.default)(orderController.getAllOrders));
// Update order status (admin/manager only)
router.patch('/:id/status', (0, asyncWrapper_1.default)(orderController.updateOrderStatus));
exports.default = router;
//# sourceMappingURL=order.routes.js.map