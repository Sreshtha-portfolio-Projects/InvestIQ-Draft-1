import { Router } from 'express';
import { z } from 'zod';
import { signUp, signIn, signOut, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1).optional(),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/signup', validateBody(signUpSchema), signUp);
router.post('/signin', validateBody(signInSchema), signIn);
router.post('/signout', authenticate, signOut);
router.get('/me', authenticate, getMe);

export default router;
