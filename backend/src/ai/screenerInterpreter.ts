import { aiClient } from './aiClient';
import { PROMPTS } from './prompts';
import { getSupabaseClient } from '../db/supabase';
import { ScreenerFilters, Company, StockScreenResult } from '../types';
import { logger } from '../utils/logger';

const AVAILABLE_SECTORS = [
  'Technology',
  'Financial Services',
  'Energy',
  'Automobile',
  'Healthcare',
  'Consumer',
  'Telecom',
  'Industrials',
  'Real Estate',
  'Materials',
];

/** Aligns with executeScreenerQuery ranges (USD) */
const MID_MIN = 10_000_000_000;
const MID_MAX = 100_000_000_000;
const LARGE_MIN = 100_000_000_000;

interface ScreenerInterpretation {
  filters: ScreenerFilters;
  interpretation: string;
  suggested_query_refinements: string[];
}

type CompanyRow = Company & { financials?: Record<string, unknown>[] };

interface FinRow {
  pe_ratio?: number;
  revenue_growth?: number;
  roe?: number;
  debt_to_equity?: number;
}

const cloneFilters = (f: ScreenerFilters): ScreenerFilters => ({ ...f });

const getFin = (company: CompanyRow): FinRow | undefined =>
  company.financials?.[0] as FinRow | undefined;

const hasAnyFinancialCriterion = (f: ScreenerFilters, ignoreDebt: boolean): boolean =>
  f.max_pe != null ||
  f.min_revenue_growth != null ||
  (!ignoreDebt && f.max_debt_to_equity != null) ||
  f.min_roe != null;

function validateFilters(filters: ScreenerFilters): string[] {
  const warnings: string[] = [];
  const sector = filters.sector ?? '';

  if (
    sector === 'Technology' &&
    filters.min_revenue_growth != null &&
    filters.min_revenue_growth > 15 &&
    filters.max_pe != null &&
    filters.max_pe < 20
  ) {
    warnings.push(
      'Technology names with revenue growth above 15% often trade at P/E multiples above 20; requiring both very high growth and a P/E under 20 is an unusually tight “GARP” overlap and may exclude most realistic matches.'
    );
  }

  if (sector === 'Financial Services' && filters.max_debt_to_equity != null) {
    warnings.push(
      'Debt-to-equity is not a meaningful balance-sheet screen for most financial institutions because leverage is structurally different from industrial companies. This constraint will be ignored for Financial Services; compare CET1, leverage ratios, or net interest margin instead.'
    );
  }

  if (sector === 'Consumer' && filters.min_revenue_growth != null && filters.min_revenue_growth > 20) {
    warnings.push(
      'Large consumer and FMCG franchises often compound through margins and cash return rather than 20%+ headline revenue growth; an extremely high growth floor may not match how these businesses create value.'
    );
  }

  if (
    sector === 'Healthcare' &&
    filters.market_cap_category === 'small' &&
    filters.min_revenue_growth != null &&
    filters.min_revenue_growth > 18
  ) {
    warnings.push(
      'Small-cap healthcare and biotech can swing between boom years and flat revenue as pipelines mature; demanding consistently very high revenue growth in small cap can screen out the entire cohort.'
    );
  }

  return warnings;
}

function effectiveFiltersForExecution(filters: ScreenerFilters): {
  effective: ScreenerFilters;
  ignoreDebt: boolean;
} {
  const ignoreDebt = filters.sector === 'Financial Services';
  const effective = cloneFilters(filters);
  if (ignoreDebt) {
    delete effective.max_debt_to_equity;
  }
  return { effective, ignoreDebt };
}

function passesFinancial(
  company: CompanyRow,
  filters: ScreenerFilters,
  ignoreDebt: boolean
): boolean {
  const fin = getFin(company);
  const anyCriterion = hasAnyFinancialCriterion(filters, ignoreDebt);

  if (anyCriterion && !fin) {
    return false;
  }
  if (!anyCriterion) {
    return true;
  }

  if (filters.max_pe != null) {
    if (fin!.pe_ratio == null || fin!.pe_ratio > filters.max_pe) return false;
  }
  if (filters.min_revenue_growth != null) {
    if (fin!.revenue_growth == null || fin!.revenue_growth < filters.min_revenue_growth) {
      return false;
    }
  }
  if (!ignoreDebt && filters.max_debt_to_equity != null) {
    if (fin!.debt_to_equity == null || fin!.debt_to_equity > filters.max_debt_to_equity) {
      return false;
    }
  }
  if (filters.min_roe != null) {
    if (fin!.roe == null || fin!.roe < filters.min_roe) return false;
  }
  return true;
}

/** After sector + optional market cap, rank which numeric cuts bite hardest (for narrative). */
function describeRestrictiveness(pool: CompanyRow[], filters: ScreenerFilters, ignoreDebt: boolean): string | null {
  const withFin = pool.filter((c) => getFin(c));
  if (withFin.length === 0) return null;

  type Cut = { label: string; pass: number };
  const cuts: Cut[] = [];

  if (filters.max_pe != null) {
    const n = withFin.filter((c) => {
      const p = getFin(c)?.pe_ratio;
      return p != null && p <= filters.max_pe!;
    }).length;
    cuts.push({ label: 'the P/E ceiling', pass: n / withFin.length });
  }
  if (filters.min_revenue_growth != null) {
    const n = withFin.filter((c) => {
      const g = getFin(c)?.revenue_growth;
      return g != null && g >= filters.min_revenue_growth!;
    }).length;
    cuts.push({ label: 'minimum revenue growth', pass: n / withFin.length });
  }
  if (!ignoreDebt && filters.max_debt_to_equity != null) {
    const n = withFin.filter((c) => {
      const d = getFin(c)?.debt_to_equity;
      return d != null && d <= filters.max_debt_to_equity!;
    }).length;
    cuts.push({ label: 'the debt-to-equity limit', pass: n / withFin.length });
  }
  if (filters.min_roe != null) {
    const n = withFin.filter((c) => {
      const r = getFin(c)?.roe;
      return r != null && r >= filters.min_roe!;
    }).length;
    cuts.push({ label: 'minimum ROE', pass: n / withFin.length });
  }

  if (cuts.length === 0) return null;
  cuts.sort((a, b) => a.pass - b.pass);
  return cuts[0].label;
}

const alternativeStrategiesFor = (filters: ScreenerFilters): string[] => {
  const out: string[] = [];
  if (filters.max_pe != null || filters.min_revenue_growth != null) {
    out.push('Growth at a reasonable price (GARP): keep quality metrics but widen P/E or trim the growth hurdle so valuation and expansion can coexist.');
  }
  if (filters.min_roe != null) {
    out.push('High ROE compounders: anchor on ROE and balance-sheet quality first, then layer growth or valuation.');
  }
  if (out.length < 2 && (filters.sector === 'Technology' || filters.sector === 'Healthcare')) {
    out.push('Turnaround or inflection names: accept lumpier fundamentals and use cap structure and catalyst timing instead of smooth growth screens.');
  }
  if (out.length === 0) {
    return [
      'Quality at a fair price: rank by ROIC or ROE, then sort by sensible multiples within the same sector.',
      'Dividend growth: prioritize payout coverage and multi-year dividend CAGR when headline growth is noisy.',
    ];
  }
  return out.slice(0, 2);
};

function buildInsights(args: {
  warnings: string[];
  restrictivenessHint: string | null;
  hadRelaxation: boolean;
  reason_for_relaxation?: string;
  sector?: string;
  totalCount: number;
  fsDebtIgnored: boolean;
  relaxationExhausted: boolean;
}): string {
  const parts: string[] = [];

  if (args.fsDebtIgnored) {
    parts.push(
      'Debt-to-equity is not a useful constraint for financial companies, as leverage is inherent to their business model and accounting differs from industrials.'
    );
  }

  if (args.restrictivenessHint && args.totalCount === 0 && !args.hadRelaxation) {
    parts.push(
      `Within your sector and size bucket, ${args.restrictivenessHint} appears to be binding relative to the other knobs—pair that with other criteria and the intersection often goes empty.`
    );
  }

  if (args.sector === 'Technology' && args.restrictivenessHint === 'the P/E ceiling') {
    parts.push(
      'High-growth technology companies rarely trade below a P/E of 20 for long when growth is genuinely differentiated; the market prices that combination with a premium multiple.'
    );
  }

  if (args.hadRelaxation && args.reason_for_relaxation) {
    parts.push(args.reason_for_relaxation);
  }

  if (args.totalCount > 0 && !args.hadRelaxation) {
    parts.push(
      'The current screen is feasible as specified: the overlap between your valuation, quality, and growth constraints still leaves a workable set of names in the database.'
    );
  }

  if (args.totalCount > 0 && args.hadRelaxation) {
    parts.push(
      'After easing the most binding requirements, the screen yields a usable cohort without abandoning the economic idea behind your query.'
    );
  }

  if (args.relaxationExhausted) {
    parts.push(
      'The screen was stepped down through growth, ROE, leverage, valuation, and size in that order, and still produced no passing names in the current universe—treat this as a signal that the intersection is unrealistic for available data, not that the logic is wrong.'
    );
  }

  if (parts.length === 0) {
    parts.push(
      'Screening ties fundamental ratios to the tradable universe; when several filters fire at once the overlap is smaller than any single ratio suggests.'
    );
  }

  return parts.join(' ');
}

export class ScreenerInterpreterService {
  async screen(userQuery: string): Promise<StockScreenResult> {
    const prompt = PROMPTS.SCREENER_INTERPRETER(userQuery, AVAILABLE_SECTORS);
    const interpretation = await aiClient.generateJSON<ScreenerInterpretation>(prompt);

    logger.info('Screener interpretation', { query: userQuery, filters: interpretation.filters });

    return this.runScreen(interpretation.filters, {
      interpretation: interpretation.interpretation,
      suggestions: interpretation.suggested_query_refinements || [],
    });
  }

  /** Run validation, DB query, optional relaxation; used by NL `screen` and can be wired to structured APIs later. */
  async runScreen(
    rawFilters: ScreenerFilters,
    meta?: { interpretation?: string; suggestions?: string[] }
  ): Promise<StockScreenResult> {
    const warnings = validateFilters(rawFilters);
    const { effective: initialEffective, ignoreDebt } = effectiveFiltersForExecution(rawFilters);
    const fsDebtIgnored = rawFilters.sector === 'Financial Services' && rawFilters.max_debt_to_equity != null;

    let companies = await this.executeScreenerQuery(initialEffective, ignoreDebt, false);
    let relaxed_filters: ScreenerFilters | undefined;
    let reason_for_relaxation: string | undefined;
    let relaxationExplanation = '';
    let relaxationExhausted = false;

    const basePool = await this.fetchUniverseSlice(rawFilters, false);
    const restrictivenessHint = describeRestrictiveness(basePool, initialEffective, ignoreDebt);

    if (companies.length === 0) {
      const rel = await this.relaxUntilMatches(cloneFilters(initialEffective), ignoreDebt);
      if (rel) {
        companies = rel.companies;
        relaxed_filters = rel.relaxed;
        reason_for_relaxation = rel.reason;
        relaxationExplanation = rel.reason;
      } else {
        relaxationExhausted = true;
      }
    }

    const insights = buildInsights({
      warnings,
      restrictivenessHint,
      hadRelaxation: !!relaxed_filters,
      reason_for_relaxation: relaxationExplanation,
      sector: rawFilters.sector,
      totalCount: companies.length,
      fsDebtIgnored,
      relaxationExhausted,
    });

    const alt = alternativeStrategiesFor(rawFilters);
    const shouldShowAlt = warnings.length > 0 || !!relaxed_filters || companies.length === 0;
    const alternative_strategies = shouldShowAlt ? alt.slice(0, 2) : undefined;

    return {
      companies,
      applied_filters: rawFilters,
      interpretation: meta?.interpretation,
      insights,
      warnings,
      relaxed_filters,
      reason_for_relaxation,
      alternative_strategies,
      suggestions: meta?.suggestions ?? [],
      total_count: companies.length,
    };
  }

  private async relaxUntilMatches(
    filters: ScreenerFilters,
    ignoreDebt: boolean
  ): Promise<{ companies: CompanyRow[]; relaxed: ScreenerFilters; reason: string } | null> {
    const reasons: string[] = [];
    let working = cloneFilters(filters);

    const tryRun = async (capExpanded: boolean) =>
      this.executeScreenerQuery(working, ignoreDebt, capExpanded);

    let companies = await tryRun(false);

    const relaxGrowth = () => {
      if (working.min_revenue_growth == null || working.min_revenue_growth <= 0) return false;
      const prev = working.min_revenue_growth;
      working.min_revenue_growth = Math.round(prev * 0.68 * 10) / 10;
      reasons.push(
        `Minimum revenue growth was eased from ${prev}% to ${working.min_revenue_growth}% (roughly a third off) because growth screens paired with valuation or quality bars often clear the field before anything else does.`
      );
      return true;
    };

    const relaxRoe = () => {
      if (working.min_roe == null || working.min_roe <= 0) return false;
      const prev = working.min_roe;
      working.min_roe = Math.round(prev * 0.86 * 10) / 10;
      reasons.push(
        `Minimum ROE was reduced from ${prev}% to ${working.min_roe}% (mid-teens haircut) to reflect that ROE floors interact badly with growth requirements in the same basket.`
      );
      return true;
    };

    const relaxDebt = () => {
      if (ignoreDebt || working.max_debt_to_equity == null) return false;
      reasons.push(
        'The debt-to-equity ceiling was removed temporarily so capital-structure light names are not double-penalized alongside profitability and growth requirements.'
      );
      delete working.max_debt_to_equity;
      return true;
    };

    const relaxPe = () => {
      if (working.max_pe == null) return false;
      const prev = working.max_pe;
      working.max_pe = Math.round(prev * 1.42 * 10) / 10;
      reasons.push(
        `The P/E ceiling was raised from ${prev} to ${working.max_pe} (about 40%) because low-multiple and high-growth rarely stack in the same tight band.`
      );
      return true;
    };

    const relaxCap = () => {
      if (working.market_cap_category == null) return false;
      const prev = working.market_cap_category;
      reasons.push(
        `Market cap was widened beyond the original "${prev}" bucket so adjacent liquidity tiers qualify—pure single-bucket mid/small/large screens frequently return zero when fundamentals are strict.`
      );
      delete working.market_cap_category;
      return true;
    };

    const sequence = [relaxGrowth, relaxRoe, relaxDebt, relaxPe, relaxCap];
    let capExpanded = false;

    for (let round = 0; round < 3 && companies.length === 0; round++) {
      for (const step of sequence) {
        if (companies.length > 0) break;
        const changed = step();
        if (changed) {
          companies = await tryRun(capExpanded);
        }
        if (companies.length > 0) break;
      }
      if (companies.length === 0 && working.market_cap_category != null && !capExpanded) {
        capExpanded = true;
        companies = await tryRun(true);
        if (companies.length > 0) {
          reasons.push(
            'Adjacent market-cap bands were merged into the query (e.g. mid caps with small or large neighbors) so size does not zero out an already selective fundamental stack.'
          );
          break;
        }
      }
      if (companies.length === 0 && round === 2) {
        if (working.min_revenue_growth != null) {
          delete working.min_revenue_growth;
          reasons.push('Minimum revenue growth was removed on the last pass so at least a comparable set of names can surface for review.');
          companies = await tryRun(capExpanded);
        }
        if (companies.length === 0 && working.min_roe != null) {
          delete working.min_roe;
          reasons.push('Minimum ROE was removed so the book is not empty while you inspect trade-offs manually.');
          companies = await tryRun(capExpanded);
        }
      }
    }

    if (companies.length === 0) {
      return null;
    }

    return {
      companies,
      relaxed: working,
      reason: reasons.join(' '),
    };
  }

  /** Companies matching sector and optional market cap only (for restrictiveness narrative). */
  private async fetchUniverseSlice(filters: ScreenerFilters, marketCapExpanded: boolean): Promise<CompanyRow[]> {
    try {
      const supabase = getSupabaseClient();
      let q = supabase
        .from('companies')
        .select(
          `id, name, ticker, sector, market_cap, financials ( pe_ratio, revenue_growth, roe, debt_to_equity, year )`
        )
        .order('name');

      if (filters.sector) {
        q = q.eq('sector', filters.sector);
      }
      q = this.applyMarketCapToQuery(q, filters.market_cap_category, marketCapExpanded);

      const { data, error } = await q.limit(400);
      if (error || !data) return [];
      return data as CompanyRow[];
    } catch {
      return [];
    }
  }

  private applyMarketCapToQuery(query: any, category: ScreenerFilters['market_cap_category'], expanded: boolean): any {
    if (!category) return query;

    if (!expanded) {
      if (category === 'large') return query.gte('market_cap', LARGE_MIN);
      if (category === 'mid') return query.gte('market_cap', MID_MIN).lte('market_cap', MID_MAX);
      return query.lte('market_cap', MID_MIN);
    }

    if (category === 'small') return query.lte('market_cap', MID_MAX);
    if (category === 'large') return query.gte('market_cap', MID_MIN);
    return query;
  }

  private async executeScreenerQuery(
    filters: ScreenerFilters,
    ignoreDebt: boolean,
    marketCapExpanded: boolean
  ): Promise<CompanyRow[]> {
    try {
      const supabase = getSupabaseClient();
      let companyQuery = supabase
        .from('companies')
        .select(
          `
          *,
          financials (
            pe_ratio,
            eps,
            revenue_growth,
            roe,
            debt_to_equity,
            year
          )
        `
        )
        .order('name');

      if (filters.sector) {
        companyQuery = companyQuery.eq('sector', filters.sector);
      }

      companyQuery = this.applyMarketCapToQuery(
        companyQuery,
        filters.market_cap_category,
        marketCapExpanded
      );

      const { data: companies, error } = await companyQuery.limit(400);

      if (error) {
        logger.error('Screener DB query error', error);
        return [];
      }

      if (!companies) return [];

      return (companies as CompanyRow[]).filter((c) => passesFinancial(c, filters, ignoreDebt));
    } catch (err) {
      logger.error('Screener query execution failed', err);
      return [];
    }
  }
}

export const screenerInterpreterService = new ScreenerInterpreterService();
