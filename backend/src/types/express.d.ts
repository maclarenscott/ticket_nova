import { IUser } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser & { id: string };
    }
  }
}

// This allows the import to be treated as a module
export {}; 