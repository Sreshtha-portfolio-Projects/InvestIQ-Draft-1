'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';
import { useResearchAssistant } from '@/hooks/useStocks';
import { ChatMessage, AIResearchResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { getRecommendationColor } from '@/utils/format';

const SUGGESTED_QUESTIONS = [
  'Is TCS undervalued right now?',
  'Compare Infosys vs Wipro',
  'Should I invest in HDFC Bank?',
  'What are the risks in Reliance Industries?',
  'Best IT stocks for long-term investment?',
];

interface AIResultCardProps {
  data: AIResearchResponse;
}

const AIResultCard = ({ data }: AIResultCardProps) => (
  <div className="space-y-4 mt-3">
    {/* Recommendation badge */}
    <div className="flex items-center gap-2">
      <span className={cn('px-3 py-1.5 rounded-lg text-sm font-semibold', getRecommendationColor(data.recommendation))}>
        {data.recommendation}
      </span>
      <span className="text-xs text-slate-500">
        Confidence: {data.confidence_score}/10
      </span>
    </div>

    {/* Valuation Summary */}
    <div className="bg-slate-800/50 rounded-lg p-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Valuation</p>
      <p className="text-sm text-slate-200">{data.valuation_summary}</p>
    </div>

    {/* Detailed analysis */}
    {data.detailed_analysis && (
      <div className="bg-slate-800/50 rounded-lg p-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Analysis</p>
        <p className="text-sm text-slate-200 leading-relaxed">{data.detailed_analysis}</p>
      </div>
    )}

    {/* Growth signals & risks */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {data.growth_signals?.length > 0 && (
        <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Growth Signals</span>
          </div>
          <ul className="space-y-1">
            {data.growth_signals.map((signal, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">•</span>
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.risks?.length > 0 && (
        <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-400">Key Risks</span>
          </div>
          <ul className="space-y-1">
            {data.risks.map((risk, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);

interface ResearchAssistantProps {
  defaultTicker?: string;
}

export const ResearchAssistant = ({ defaultTicker }: ResearchAssistantProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: defaultTicker
        ? `I'm ready to analyze **${defaultTicker}** for you. Ask me anything — valuation, growth prospects, risks, or comparison with peers.`
        : `I'm your AI investment research assistant. Ask me about any Indian stock — valuations, growth prospects, risks, or compare companies.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { mutate: ask, isPending } = useResearchAssistant();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (question?: string) => {
    const q = question || input.trim();
    if (!q || isPending) return;

    setInput('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: q,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    ask(
      { question: q, ticker: defaultTicker },
      {
        onSuccess: (data) => {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.detailed_analysis || data.valuation_summary,
            timestamp: new Date(),
            data,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: (err) => {
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: err instanceof Error ? err.message : 'Analysis failed. Please try again.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
          >
            {/* Avatar */}
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
              message.role === 'assistant' ? 'bg-blue-600' : 'bg-slate-700'
            )}>
              {message.role === 'assistant'
                ? <Sparkles className="w-3.5 h-3.5 text-white" />
                : <User className="w-3.5 h-3.5 text-slate-300" />
              }
            </div>

            {/* Content */}
            <div className={cn('max-w-[85%]', message.role === 'user' ? 'items-end' : 'items-start')}>
              <div className={cn(
                'rounded-xl px-4 py-2.5 text-sm',
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-slate-800 text-slate-200 rounded-tl-sm'
              )}>
                {message.content}
              </div>
              {message.data && <AIResultCard data={message.data} />}
              <span className="text-xs text-slate-600 mt-1 block">
                {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isPending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-slate-800 rounded-xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-slate-400 ml-1">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about any stock..."
            disabled={isPending}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isPending}
            loading={isPending}
            size="md"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
