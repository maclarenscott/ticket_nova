import 'express';

declare module 'express' {
  export interface RouterOptions {
    mergeParams?: boolean;
    strict?: boolean;
    caseSensitive?: boolean;
  }

  interface RequestHandler<
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    Locals extends Record<string, any> = Record<string, any>
  > {
    (
      req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
      res: Response<ResBody, Locals>,
      next: NextFunction
    ): void | Promise<any>;
  }
} 