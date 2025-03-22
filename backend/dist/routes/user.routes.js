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
const userController = __importStar(require("../controllers/user.controller"));
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const router = express_1.default.Router();
/**
 * @route GET /api/users
 * @desc Get all users with pagination and filtering
 * @access Private (Admin)
 */
router.get('/', auth_1.protect, (0, auth_1.authorize)(['admin']), (0, asyncHandler_1.default)(userController.getAllUsers));
/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private (Admin or self)
 */
router.get('/:id', auth_1.protect, (0, asyncHandler_1.default)(userController.getUserById));
/**
 * @route POST /api/users
 * @desc Create a new user
 * @access Private (Admin)
 */
router.post('/', auth_1.protect, (0, auth_1.authorize)(['admin']), (0, asyncHandler_1.default)(userController.createUser));
/**
 * @route PUT /api/users/:id
 * @desc Update user information
 * @access Private (Admin or self)
 */
router.put('/:id', auth_1.protect, (0, asyncHandler_1.default)(userController.updateUser));
/**
 * @route PATCH /api/users/:id/role
 * @desc Update user role
 * @access Private (Admin)
 */
router.patch('/:id/role', auth_1.protect, (0, auth_1.authorize)(['admin']), (0, asyncHandler_1.default)(userController.updateUserRole));
/**
 * @route PATCH /api/users/:id/status
 * @desc Toggle user active status
 * @access Private (Admin)
 */
router.patch('/:id/status', auth_1.protect, (0, auth_1.authorize)(['admin']), (0, asyncHandler_1.default)(userController.toggleUserStatus));
exports.default = router;
//# sourceMappingURL=user.routes.js.map