"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Async handler to catch errors in Express route handlers
 * This wraps async controller functions to properly handle errors
 * and not return Response objects that cause TypeScript errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.default = asyncHandler;
//# sourceMappingURL=asyncHandler.js.map