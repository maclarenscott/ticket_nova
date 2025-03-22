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
const authController = __importStar(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const asyncWrapper_1 = __importDefault(require("../utils/asyncWrapper"));
const router = express_1.default.Router();
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', (0, asyncWrapper_1.default)(authController.register));
/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', (0, asyncWrapper_1.default)(authController.login));
/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', auth_middleware_1.protect, (0, asyncWrapper_1.default)(authController.getCurrentUser));
/**
 * @route POST /api/auth/password/reset-request
 * @desc Request password reset
 * @access Public
 */
router.post('/password/reset-request', (0, asyncWrapper_1.default)(authController.requestPasswordReset));
/**
 * @route POST /api/auth/password/reset
 * @desc Reset password with token
 * @access Public
 */
router.post('/password/reset', (0, asyncWrapper_1.default)(authController.resetPassword));
/**
 * @route POST /api/auth/password/change
 * @desc Change password (for logged in users)
 * @access Private
 */
router.post('/password/change', auth_middleware_1.protect, (0, asyncWrapper_1.default)(authController.changePassword));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map