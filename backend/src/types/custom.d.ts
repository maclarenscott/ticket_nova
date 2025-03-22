// Allow any return type in Express route handlers
declare namespace Express {
  export interface Response {
    [key: string]: any;
  }
} 