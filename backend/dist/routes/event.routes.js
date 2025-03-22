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
const eventController = __importStar(require("../controllers/event.controller"));
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const router = express_1.default.Router();
/**
 * @route GET /api/events
 * @desc Get all events with pagination and filtering
 * @access Public
 */
router.get('/', (0, asyncHandler_1.default)(eventController.getAllEvents));
/**
 * @route GET /api/events/:id
 * @desc Get event by ID
 * @access Public
 */
router.get('/:id', (0, asyncHandler_1.default)(eventController.getEventById));
/**
 * @route GET /api/events/venue/:venueId
 * @desc Get events by venue ID
 * @access Public
 */
router.get('/venue/:venueId', (0, asyncHandler_1.default)(eventController.getEventsByVenue));
/**
 * @route POST /api/events
 * @desc Create a new event
 * @access Private (Admin/Manager)
 */
router.post('/', auth_1.protect, (0, auth_1.authorize)(['admin', 'manager']), (0, asyncHandler_1.default)(eventController.createEvent));
/**
 * @route PUT /api/events/:id
 * @desc Update an event
 * @access Private (Admin/Manager)
 */
router.put('/:id', auth_1.protect, (0, auth_1.authorize)(['admin', 'manager']), (0, asyncHandler_1.default)(eventController.updateEvent));
/**
 * @route DELETE /api/events/:id
 * @desc Delete an event
 * @access Private (Admin/Manager)
 */
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)(['admin', 'manager']), (0, asyncHandler_1.default)(eventController.deleteEvent));
/**
 * @route PATCH /api/events/:id/publish
 * @desc Toggle event published status
 * @access Private (Admin/Manager)
 */
router.patch('/:id/publish', auth_1.protect, (0, auth_1.authorize)('admin', 'manager'), eventController.togglePublishStatus);
/**
 * @route PATCH /api/events/:id/feature
 * @desc Toggle event featured status
 * @access Private (Admin/Manager)
 */
router.patch('/:id/feature', auth_1.protect, (0, auth_1.authorize)('admin', 'manager'), eventController.toggleFeaturedStatus);
/**
 * @route GET /api/events/categories
 * @desc Get all event categories
 * @access Public
 */
router.get('/categories', eventController.getEventCategories);
exports.default = router;
//# sourceMappingURL=event.routes.js.map