import { v4 as uuidv4 } from 'uuid';
import { NextFunction, Request, Response } from 'express';

const X_REQUEST_ID = 'x-request-id';

export const extractFromHeaderOrGenerate = (req: Request): string => {
  const headerId = req.header(X_REQUEST_ID);
  if (headerId && headerId.trim() !== '') {
    return headerId;
  }
  return uuidv4();
};

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = extractFromHeaderOrGenerate(req);
  res.setHeader(X_REQUEST_ID, requestId);
  req.ctx.requestId = requestId;
  next();
};
