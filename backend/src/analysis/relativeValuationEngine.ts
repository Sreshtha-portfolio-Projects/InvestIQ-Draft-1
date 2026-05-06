import type { RelativeValuationInput, RelativeValuationResult, RelativeVerdict } from '../types';

function formatRange(range: { min: number; max: number }): string {
  return `${range.min.toFixed(1)}–${range.max.toFixed(1)}`;
}

function relativePosition(
  currentPe: number,
  median: number
): 'below average' | 'near average' | 'above average' {
  const r = currentPe / median;
  if (r < 0.95) return 'below average';
  if (r > 1.05) return 'above average';
  return 'near average';
}

function sectorValuationTone(sector: string): { label: string } {
  const s = sector.toLowerCase();

  if (/(technology|software|it\b|telecom)/i.test(s)) {
    return { label: 'growth / tech-type sector' };
  }
  if (/(financial|bank|insurance)/i.test(s)) {
    return { label: 'financials' };
  }
  if (/(consumer|fmcg|f&b|staples)/i.test(s)) {
    return { label: 'defensive consumer' };
  }
  if (/(energy|utilities|materials|real estate)/i.test(s)) {
    return { label: 'cyclical / capital-intensive' };
  }
  if (/(health|pharma)/i.test(s)) {
    return { label: 'healthcare / innovation-weighted' };
  }

  return { label: sector || 'this sector' };
}

/**
 * Current P/E vs own historical median — relative only (no absolute “cheap PE” rule).
 * Range roughly [-4, +4]: higher = cheaper vs your own history.
 */
function historicalPeScore(currentPe: number, historicalMedianPe: number): number {
  const r = currentPe / historicalMedianPe;
  if (r < 0.85) return 4;
  if (r < 0.9) return 3;
  if (r < 1.0) return 1;
  if (r <= 1.1) return 0;
  if (r <= 1.2) return -2;
  return -4;
}

/**
 * Optional peer band — higher when below peers, lower when above.
 * Range roughly [-3, +3].
 */
function peerComparisonScore(
  currentPe: number,
  peer_pe_range?: { min: number; max: number }
): number {
  if (!peer_pe_range) return 0;
  const mid = (peer_pe_range.min + peer_pe_range.max) / 2;
  const halfWidth = Math.max((peer_pe_range.max - peer_pe_range.min) / 2, 0.5);
  if (currentPe < peer_pe_range.min) {
    const depth = (peer_pe_range.min - currentPe) / halfWidth;
    return Math.min(3, 1 + Math.round(depth));
  }
  if (currentPe > peer_pe_range.max) {
    const depth = (currentPe - peer_pe_range.max) / halfWidth;
    return Math.max(-3, -1 - Math.round(depth));
  }
  const z = (currentPe - mid) / halfWidth;
  if (z <= -0.35) return 1;
  if (z >= 0.35) return -1;
  return 0;
}

/** Higher growth supports paying a richer multiple — adjustment upward. Range ~[-3, +3]. */
function growthAdjustment(revenueGrowth: number): number {
  if (revenueGrowth > 22) return 3;
  if (revenueGrowth > 16) return 2;
  if (revenueGrowth > 10) return 1;
  if (revenueGrowth >= 6) return 0;
  if (revenueGrowth >= 0) return -2;
  return -3;
}

/** ROE as franchise-quality overlay. Range ~[-3, +3]. */
function roeQualityScore(roe: number): number {
  if (roe > 26) return 3;
  if (roe > 20) return 2;
  if (roe > 14) return 1;
  if (roe >= 10) return 0;
  if (roe >= 5) return -2;
  return -3;
}

function verdictFromScore(total: number): RelativeVerdict {
  if (total >= 4) return 'undervalued';
  if (total <= -4) return 'overvalued';
  return 'fairly_valued';
}

function confidenceFromScoreAndRange(
  breakdown: { historical_pe_score: number; peer_comparison_score: number },
  historical_pe_range: { min: number; max: number },
  historical_median_pe: number
): 'high' | 'medium' | 'low' {
  const rangeWidth =
    historical_pe_range.max > historical_pe_range.min
      ? (historical_pe_range.max - historical_pe_range.min) / historical_median_pe
      : 0.5;

  if (rangeWidth > 0.95) return 'low';
  if (Math.abs(breakdown.historical_pe_score) >= 3 && rangeWidth < 0.45) return 'high';
  return 'medium';
}

function buildReasoning(
  input: RelativeValuationInput,
  breakdown: {
    historical_pe_score: number;
    peer_comparison_score: number;
    growth_adjustment: number;
    roe_quality_score: number;
  },
  score: number
): string[] {
  const { current_pe, historical_median_pe, historical_pe_range, revenue_growth, roe, peer_pe_range } =
    input;
  const { label } = sectorValuationTone(input.sector);

  const lines: string[] = [
    `Score = historical_pe_score (${breakdown.historical_pe_score}) + peer_comparison_score (${breakdown.peer_comparison_score}) + growth_adjustment (${breakdown.growth_adjustment}) + roe_quality_score (${breakdown.roe_quality_score}) = ${score}. Higher reads more attractive on this rubric (cheap vs history, peers, and fundamentals).`,
    `Historical: ${current_pe.toFixed(1)}× vs median ~${historical_median_pe.toFixed(1)}× in a ${formatRange(
      historical_pe_range
    )} band—component reflects where you sit on your own time series, not a generic P/E cutoff.`,
    `Growth adjustment uses ${revenue_growth.toFixed(1)}% revenue growth; ROE quality uses ${roe.toFixed(1)}%—both justify how much multiple expansion the market can rationally pay for in ${label}.`,
  ];

  if (peer_pe_range) {
    lines.push(
      `Peer comparison: ${formatRange(peer_pe_range)}; being inside/outside that band shifts the peer term without hardcoding “P/E must be below X.”`
    );
  } else {
    lines.push('Peer comparison term is zero—add a peer P/E band when you want cross-sectional context.');
  }

  return lines;
}

function buildInsight(
  verdict: RelativeVerdict,
  companyName: string,
  score: number,
  median: number,
  currentPe: number,
  relPos: string
): string {
  const tag =
    verdict === 'undervalued'
      ? 'the composite tilts attractive'
      : verdict === 'overvalued'
        ? 'the composite tilts rich'
        : 'the composite sits balanced';

  return `${companyName}: score ${score} (${tag}) with ${currentPe.toFixed(1)}× on a ~${median.toFixed(
    1
  )}× median and ${relPos} positioning—history, peers (if provided), growth, and ROE all feed one number, not a single ratio rule.`;
}

export function computeRelativeValuation(input: RelativeValuationInput): RelativeValuationResult {
  const {
    company_name,
    current_pe,
    historical_median_pe,
    historical_pe_range,
    revenue_growth,
    roe,
  } = input;

  const historical_pe_score = historicalPeScore(current_pe, historical_median_pe);
  const peer_comparison_score = peerComparisonScore(current_pe, input.peer_pe_range);
  const growth_adjustment = growthAdjustment(revenue_growth);
  const roe_quality_score = roeQualityScore(roe);

  const score =
    historical_pe_score + peer_comparison_score + growth_adjustment + roe_quality_score;

  const score_breakdown = {
    historical_pe_score,
    peer_comparison_score,
    growth_adjustment,
    roe_quality_score,
  };

  const verdict = verdictFromScore(score);
  const relPos = relativePosition(current_pe, historical_median_pe);
  const confidence = confidenceFromScoreAndRange(
    { historical_pe_score, peer_comparison_score },
    historical_pe_range,
    historical_median_pe
  );

  const reasoning = buildReasoning(input, score_breakdown, score);

  return {
    verdict,
    score,
    score_breakdown,
    confidence,
    analysis: {
      current_pe,
      historical_range: formatRange(historical_pe_range),
      historical_median: historical_median_pe,
      relative_position: relPos,
    },
    reasoning,
    insight: buildInsight(verdict, company_name, score, historical_median_pe, current_pe, relPos),
  };
}
