import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InvestIQ — AI-Powered Stock Research',
  description: 'AI-driven investment research, natural language stock screening, and earnings analysis for Indian equities.',
  keywords: ['stock research', 'AI investing', 'Indian stocks', 'NSE', 'BSE', 'equity research'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
