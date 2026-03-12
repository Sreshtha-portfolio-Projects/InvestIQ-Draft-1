import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../db/supabase';
import config from '../config';
import { ApiError } from '../utils/apiError';
import { User, AuthPayload } from '../types';
import logger from '../utils/logger';

export class AuthService {
  async signup(email: string, password: string): Promise<{ user: User; token: string }> {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    if (password.length < 8) {
      throw ApiError.badRequest('Password must be at least 8 characters');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      logger.error('Supabase auth signup error:', authError);
      throw ApiError.badRequest(authError.message);
    }

    if (!authData.user) {
      throw ApiError.internal('Failed to create user');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: authData.user.email,
        },
      ])
      .select()
      .single();

    if (userError) {
      logger.error('Error creating user record:', userError);
      throw ApiError.internal('Failed to create user record');
    }

    const token = this.generateToken({
      userId: userData.id,
      email: userData.email,
    });

    return {
      user: userData,
      token,
    };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      logger.error('Supabase auth login error:', authError);
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (!authData.user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      logger.error('Error fetching user record:', userError);
      throw ApiError.internal('Failed to fetch user');
    }

    const token = this.generateToken({
      userId: userData.id,
      email: userData.email,
    });

    return {
      user: userData,
      token,
    };
  }

  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Error fetching user:', error);
      throw ApiError.internal('Failed to fetch user');
    }

    return data;
  }

  generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  verifyToken(token: string): AuthPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      return decoded;
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired token');
    }
  }
}

export default new AuthService();
