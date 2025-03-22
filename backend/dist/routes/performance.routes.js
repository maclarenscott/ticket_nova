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
const performanceController = __importStar(require("../controllers/performance.controller"));
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const router = express_1.default.Router();
/**
 * @route GET /api/performances
 * @desc Get all performances with pagination and filtering
 * @access Public
 */
router.get('/', (0, asyncHandler_1.default)(performanceController.getAllPerformances));
/**
 * @route GET /api/performances/:id
 * @desc Get performance by ID
 * @access Public
 */
router.get('/:id', (0, asyncHandler_1.default)(performanceController.getPerformanceById));
/**
 * @route GET /api/performances/event/:eventId
 * @desc Get performances by event ID
 * @access Public
 */
router.get('/event/:eventId', (0, asyncHandler_1.default)(performanceController.getPerformancesByEvent));
/**
 * @route POST /api/performances
 * @desc Create a new performance
 * @access Private (Admin/Manager)
 */
router.post('/', auth_1.protect, (0, auth_1.authorize)(['admin', 'manager']), (0, asyncHandler_1.default)(performanceController.createPerformance));
/**
 * @route PUT /api/performances/:id
 * @desc Update a performance
 * @access Private (Admin/Manager)
 */
router.put('/:id', auth_1.protect, (0, auth_1.authorize)(['admin', 'manager']), (0, asyncHandler_1.default)(performanceController.updatePerformance));
/**
 * @route DELETE /api/performances/:id
 * @desc Delete a performance
 * @access Private (Admin/Manager)
 */
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)(['admin', 'manager']), (0, asyncHandler_1.default)(performanceController.deletePerformance));
/**
 * @route PATCH /api/performances/:id/tickets
 * @desc Update available tickets for a performance
 * @access Private (Admin/Manager)
 */
router.patch('/:id/tickets', auth_1.protect, (0, auth_1.authorize)(['admin', 'manager']), (0, asyncHandler_1.default)(performanceController.updateAvailableTickets));
exports.default = router;
//# sourceMappingURL=performance.routes.js.map