import { getSupabaseClient } from '../db/supabase';
import { logger } from '../utils/logger';

interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  async signUp(data: SignUpData) {
    const supabase = getSupabaseClient();

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (error) {
      logger.warn('Sign up failed', { email: data.email, error: error.message });
      throw new Error(error.message);
    }

    // Create profile record
    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
      });
    }

    logger.info('User signed up', { email: data.email });

    // If session is null (email confirmation required), auto-sign in the user
    if (!authData.session) {
      logger.info('No session from signup, attempting auto-signin', { email: data.email });
      return this.signIn(data);
    }

    return authData;
  }

  async signIn(data: SignInData) {
    const supabase = getSupabaseClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      logger.warn('Sign in failed', { email: data.email });
      throw new Error(error.message);
    }

    logger.info('User signed in', { email: data.email });
    return authData;
  }

  async signOut(token: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      logger.warn('Sign out error', error.message);
    }
  }

  async getUser(token: string) {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return null;
    return user;
  }
}

export const authService = new AuthService();
