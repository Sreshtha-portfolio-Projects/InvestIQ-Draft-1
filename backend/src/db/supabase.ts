import { createClient } from '@supabase/supabase-js';
import config from '../config';
import logger from '../utils/logger';

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      logger.error('Supabase connection error:', error);
      return false;
    }
    logger.info('Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection failed:', error);
    return false;
  }
};

export default supabase;
