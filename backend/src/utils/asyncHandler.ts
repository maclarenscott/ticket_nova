import { Request, Response, NextFunction } from 'express';

/**
 * Async handler to catch errors in Express route handlers
 * This wraps async controller functions to properly handle errors
 * and not return Response objects that cause TypeScript errors
 */
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler; 