import Link from 'next/link';
import { TrendingUp, Brain, Search, BarChart3, Sparkles, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <TrendingUp className="h-20 w-20 text-primary-600" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            InvestIQ
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-700 mb-4">
            AI-Powered Stock Research Platform
          </p>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            ChatGPT for Stock Research. Make smarter investment decisions with AI-driven analysis.
          </p>

          <div className="flex justify-center gap-4 mb-20">
            <Link href="/dashboard" className="btn btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
            <Link href="/login" className="btn btn-secondary text-lg px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Brain className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              AI Research Assistant
            </h3>
            <p className="text-gray-600">
              Get instant AI-powered analysis based on fundamentals and market data.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Search className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Natural Language Screener
            </h3>
            <p className="text-gray-600">
              Screen stocks using plain English queries.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <BarChart3 className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Earnings Call Analysis
            </h3>
            <p className="text-gray-600">
              AI analyzes earnings transcripts automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
