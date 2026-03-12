import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/apiResponse';

const formatZodErrors = (err: unknown): string => {
  if (err && typeof err === 'object' && 'issues' in err) {
    const issues = (err as { issues: { path: string[]; message: string }[] }).issues;
    return issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
  }
  return 'Validation failed';
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      sendError(res, `Validation error: ${formatZodErrors(result.error)}`, 400);
      return;
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      sendError(res, `Query validation error: ${formatZodErrors(result.error)}`, 400);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.query = result.data as any;
    next();
  };
};
