import { Request, Response, NextFunction } from 'express';

/**
 * A wrapper for async controller functions that return Response objects
 * Helps TypeScript understand the function signature better than express-async-handler
 */
const asyncWrapper = (handler: (req: Request, res: Response, next?: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
    // The response is handled within the controller, so we don't return anything
  };
};

export default asyncWrapper; 