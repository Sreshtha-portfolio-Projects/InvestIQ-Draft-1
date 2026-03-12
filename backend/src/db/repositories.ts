import supabase from './supabase';
import { Company, Financial, Watchlist, EarningsTranscript } from '../types';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export class CompanyRepository {
  async findByTicker(ticker: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Error finding company by ticker:', error);
      throw ApiError.internal('Database error');
    }

    return data;
  }

  async search(query: string, limit: number = 10): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .or(`ticker.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      logger.error('Error searching companies:', error);
      throw ApiError.internal('Database error');
    }

    return data || [];
  }

  async create(company: Partial<Company>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert([company])
      .select()
      .single();

    if (error) {
      logger.error('Error creating company:', error);
      throw ApiError.internal('Database error');
    }

    return data;
  }

  async getAll(limit: number = 100): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(limit);

    if (error) {
      logger.error('Error getting all companies:', error);
      throw ApiError.internal('Database error');
    }

    return data || [];
  }

  async getBySector(sector: string): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('sector', sector);

    if (error) {
      logger.error('Error getting companies by sector:', error);
      throw ApiError.internal('Database error');
    }

    return data || [];
  }
}

export class FinancialRepository {
  async findByCompanyId(companyId: string): Promise<Financial[]> {
    const { data, error } = await supabase
      .from('financials')
      .select('*')
      .eq('company_id', companyId)
      .order('year', { ascending: false })
      .order('quarter', { ascending: false });

    if (error) {
      logger.error('Error finding financials:', error);
      throw ApiError.internal('Database error');
    }

    return data || [];
  }

  async findLatestByCompanyId(companyId: string): Promise<Financial | null> {
    const { data, error } = await supabase
      .from('financials')
      .select('*')
      .eq('company_id', companyId)
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Error finding latest financial:', error);
      throw ApiError.internal('Database error');
    }

    return data;
  }

  async create(financial: Partial<Financial>): Promise<Financial> {
    const { data, error } = await supabase
      .from('financials')
      .insert([financial])
      .select()
      .single();

    if (error) {
      logger.error('Error creating financial:', error);
      throw ApiError.internal('Database error');
    }

    return data;
  }

  async screenCompanies(filters: any): Promise<any[]> {
    let query = supabase
      .from('financials')
      .select('*, companies(*)')
      .order('year', { ascending: false });

    if (filters.pe_ratio) {
      if (filters.pe_ratio.min) query = query.gte('pe_ratio', filters.pe_ratio.min);
      if (filters.pe_ratio.max) query = query.lte('pe_ratio', filters.pe_ratio.max);
    }

    if (filters.revenue_growth) {
      if (filters.revenue_growth.min) query = query.gte('revenue_growth', filters.revenue_growth.min);
    }

    if (filters.roe) {
      if (filters.roe.min) query = query.gte('roe', filters.roe.min);
    }

    if (filters.debt_to_equity) {
      if (filters.debt_to_equity.max) query = query.lte('debt_to_equity', filters.debt_to_equity.max);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error screening companies:', error);
      throw ApiError.internal('Database error');
    }

    return data || [];
  }
}

export class WatchlistRepository {
  async findByUserId(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('watchlists')
      .select('*, companies(*)')
      .eq('user_id', userId);

    if (error) {
      logger.error('Error finding watchlist:', error);
      throw ApiError.internal('Database error');
    }

    return data || [];
  }

  async create(userId: string, companyId: string): Promise<Watchlist> {
    const { data, error } = await supabase
      .from('watchlists')
      .insert([{ user_id: userId, company_id: companyId }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw ApiError.badRequest('Company already in watchlist');
      }
      logger.error('Error creating watchlist entry:', error);
      throw ApiError.internal('Database error');
    }

    return data;
  }

  async delete(userId: string, companyId: string): Promise<void> {
    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId);

    if (error) {
      logger.error('Error deleting watchlist entry:', error);
      throw ApiError.internal('Database error');
    }
  }

  async exists(userId: string, companyId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error checking watchlist:', error);
      throw ApiError.internal('Database error');
    }

    return !!data;
  }
}

export class EarningsTranscriptRepository {
  async findByCompanyId(companyId: string): Promise<EarningsTranscript[]> {
    const { data, error } = await supabase
      .from('earnings_transcripts')
      .select('*')
      .eq('company_id', companyId)
      .order('year', { ascending: false })
      .order('quarter', { ascending: false });

    if (error) {
      logger.error('Error finding earnings transcripts:', error);
      throw ApiError.internal('Database error');
    }

    return data || [];
  }

  async findById(id: string): Promise<EarningsTranscript | null> {
    const { data, error } = await supabase
      .from('earnings_transcripts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Error finding earnings transcript:', error);
      throw ApiError.internal('Database error');
    }

    return data;
  }

  async create(transcript: Partial<EarningsTranscript>): Promise<EarningsTranscript> {
    const { data, error } = await supabase
      .from('earnings_transcripts')
      .insert([transcript])
      .select()
      .single();

    if (error) {
      logger.error('Error creating earnings transcript:', error);
      throw ApiError.internal('Database error');
    }

    return data;
  }
}
