import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { sendSuccess, sendError, sendCreated } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;
    const data = await authService.signUp({ email, password, fullName });
    sendCreated(res, {
      user: data.user,
      session: data.session,
    }, 'Account created successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign up failed';
    sendError(res, message, 400);
  }
};

export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const data = await authService.signIn({ email, password });
    sendSuccess(res, {
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
    }, 'Signed in successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign in failed';
    sendError(res, message, 401);
  }
};

export const signOut = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await authService.signOut(token);
    }
    sendSuccess(res, null, 'Signed out successfully');
  } catch (err) {
    sendError(res, 'Sign out failed', 500);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    sendSuccess(res, { user: req.user });
  } catch {
    sendError(res, 'Failed to get user info', 500);
  }
};
