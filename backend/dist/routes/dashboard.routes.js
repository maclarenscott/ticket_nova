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
// @ts-ignore
const express_1 = __importDefault(require("express"));
const dashboardController = __importStar(require("../controllers/dashboard.controller"));
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const router = express_1.default.Router();
// Create wrappers around controller functions that handle the promise correctly
const getStats = (0, asyncHandler_1.default)(async (req, res) => {
    await dashboardController.getDashboardStats(req, res);
});
const getRecentTickets = (0, asyncHandler_1.default)(async (req, res) => {
    await dashboardController.getRecentTickets(req, res);
});
const getSystemStatus = (0, asyncHandler_1.default)(async (req, res) => {
    await dashboardController.getSystemStatus(req, res);
});
/**
 * @route GET /api/dashboard/stats
 * @desc Get admin dashboard statistics
 * @access Private (Admin, Manager)
 */
router.get('/stats', auth_1.protect, auth_1.managerMiddleware, getStats);
/**
 * @route GET /api/dashboard/recent-tickets
 * @desc Get recent tickets for dashboard
 * @access Private (Admin, Manager)
 */
router.get('/recent-tickets', auth_1.protect, auth_1.managerMiddleware, getRecentTickets);
/**
 * @route GET /api/dashboard/system-status
 * @desc Get system status information
 * @access Private (Admin, Manager)
 */
router.get('/system-status', auth_1.protect, auth_1.managerMiddleware, getSystemStatus);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map