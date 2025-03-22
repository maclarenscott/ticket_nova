"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A wrapper for async controller functions that return Response objects
 * Helps TypeScript understand the function signature better than express-async-handler
 */
const asyncWrapper = (handler) => {
    return (req, res, next) => {
        handler(req, res, next).catch(next);
        // The response is handled within the controller, so we don't return anything
    };
};
exports.default = asyncWrapper;
//# sourceMappingURL=asyncWrapper.js.map