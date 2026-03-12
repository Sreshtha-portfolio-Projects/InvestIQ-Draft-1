import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSupabaseClient } from '../db/supabase';
import { JwtPayload } from '../types';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  userId?: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication required. Please provide a valid Bearer token.', 401);
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify the Supabase JWT token
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid token attempt', { error: error?.message });
      sendError(res, 'Invalid or expired token.', 401);
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email || '',
    };
    req.userId = user.id;

    next();
  } catch (err) {
    logger.error('Auth middleware error', err);
    sendError(res, 'Authentication failed.', 401);
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        req.user = { userId: user.id, email: user.email || '' };
        req.userId = user.id;
      }
    }

    next();
  } catch {
    next();
  }
};
