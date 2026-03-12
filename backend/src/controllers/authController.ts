import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';

export class AuthController {
  signup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const result = await authService.signup(email, password);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  });

  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  });

  getProfile = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user.userId;

    const user = await authService.getUserById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  });
}

export default new AuthController();
