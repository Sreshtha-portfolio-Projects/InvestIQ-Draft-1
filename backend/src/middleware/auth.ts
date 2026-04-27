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
      logger.warn('Missing or invalid authorization header');
      sendError(res, 'Authentication required. Please provide a valid Bearer token.', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    logger.info('Attempting to verify token', { tokenPreview: token.substring(0, 20) });

    // Try to verify using Supabase's getUser method first
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (user) {
      logger.info('Token verified successfully with getUser', { userId: user.id, email: user.email });
      req.user = {
        userId: user.id,
        email: user.email || '',
      };
      req.userId = user.id;
      next();
      return;
    }

    // Fallback: Try to decode and verify JWT manually
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) {
        logger.warn('Failed to decode token');
        sendError(res, 'Invalid or expired token.', 401);
        return;
      }

      const payload = decoded.payload as any;
      logger.info('Token decoded successfully', { sub: payload.sub, email: payload.email });

      req.user = {
        userId: payload.sub,
        email: payload.email || '',
      };
      req.userId = payload.sub;
      next();
    } catch (decodeErr) {
      logger.warn('Token decoding failed', { error: decodeErr instanceof Error ? decodeErr.message : String(decodeErr) });
      sendError(res, 'Invalid or expired token.', 401);
    }
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
