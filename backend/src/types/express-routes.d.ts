import 'express';
import { IUser } from '../models/user.model';

declare module 'express' {
  export interface Request {
    user?: IUser;
  }

  export interface Response {
    [key: string]: any;
  }

  export interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): any;
  }
} 