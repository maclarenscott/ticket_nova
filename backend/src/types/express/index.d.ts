import { IUser } from '../../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
    
    interface Response {
      [key: string]: any;
    }
  }
}

export {}; 