'use client';

import { useState } from 'react';
import { FileText, TrendingUp, TrendingDown, Target, Loader2 } from 'lucide-react';
import { useEarningsAnalysis, useAnalyzeEarnings } from '@/hooks/useStocks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { getSentimentColor } from '@/utils/format';
import { cn } from '@/utils/cn';

interface EarningsAnalyzerProps {
  companyId: string;
  companyName: string;
}

export const EarningsAnalyzer = ({ companyId, companyName }: EarningsAnalyzerProps) => {
  const [transcript, setTranscript] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const { data: existingAnalysis, isLoading } = useEarningsAnalysis(companyId);
  const { mutate: analyze, isPending, data: newAnalysis } = useAnalyzeEarnings();

  const analysis = newAnalysis || existingAnalysis;

  const handleAnalyze = () => {
    if (!transcript.trim()) return;
    analyze({ companyId, transcript });
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Analysis</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowUpload(!showUpload)}
        >
          <FileText className="w-4 h-4" />
          {showUpload ? 'Hide' : 'Analyze Transcript'}
        </Button>
      </CardHeader>

      {/* Upload form */}
      {showUpload && (
        <div className="mb-5 space-y-3">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={`Paste ${companyName} earnings call transcript here...`}
            rows={5}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <Button
            onClick={handleAnalyze}
            loading={isPending}
            disabled={transcript.trim().length < 100}
          >
            Analyze with AI
          </Button>
        </div>
      )}

      {/* Analysis result */}
      {analysis ? (
        <div className="space-y-4">
          {/* Sentiment + Summary */}
          <div className="flex items-start gap-3">
            <Badge
              variant={
                analysis.management_sentiment === 'positive' ? 'success' :
                analysis.management_sentiment === 'negative' ? 'danger' : 'warning'
              }
            >
              Management: {analysis.management_sentiment}
            </Badge>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>

          {/* Two column: growth + risks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Growth signals */}
            {analysis.growth_signals?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">Growth Signals</span>
                </div>
                <ul className="space-y-1.5">
                  {analysis.growth_signals.map((signal, i) => (
                    <li key={i} className="text-xs text-slate-400 flex gap-1.5">
                      <span className="text-emerald-400 shrink-0">+</span>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk signals */}
            {analysis.risk_signals?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">Risk Signals</span>
                </div>
                <ul className="space-y-1.5">
                  {analysis.risk_signals.map((risk, i) => (
                    <li key={i} className="text-xs text-slate-400 flex gap-1.5">
                      <span className="text-red-400 shrink-0">−</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Strategic initiatives */}
          {analysis.key_strategic_initiatives?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">Strategic Initiatives</span>
              </div>
              <ul className="space-y-1.5">
                {analysis.key_strategic_initiatives.map((init, i) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-1.5">
                    <span className="text-blue-400 shrink-0">→</span>
                    {init}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Guidance */}
          {analysis.guidance && (Object.values(analysis.guidance).some(Boolean)) && (
            <div className="bg-slate-800/50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-slate-400">Management Guidance</p>
              {analysis.guidance.revenue && (
                <p className="text-xs text-slate-300"><span className="text-slate-500">Revenue:</span> {analysis.guidance.revenue}</p>
              )}
              {analysis.guidance.margins && (
                <p className="text-xs text-slate-300"><span className="text-slate-500">Margins:</span> {analysis.guidance.margins}</p>
              )}
              {analysis.guidance.capex && (
                <p className="text-xs text-slate-300"><span className="text-slate-500">Capex:</span> {analysis.guidance.capex}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No earnings analysis available.</p>
          <p className="text-xs text-slate-600 mt-1">Upload a transcript to get AI insights.</p>
        </div>
      )}
    </Card>
  );
};
