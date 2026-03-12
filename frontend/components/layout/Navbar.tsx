'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { TrendingUp, Search, Bell, User, LogOut, Menu, X, BarChart2, BookMarked, ScanSearch } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { StockSearchBar } from '@/components/stocks/StockSearchBar';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/screener', label: 'Screener', icon: ScanSearch },
  { href: '/watchlist', label: 'Watchlist', icon: BookMarked },
];

export const Navbar = () => {
  const { user, signOut } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">InvestIQ</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Search - center */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <StockSearchBar />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            {user ? (
              <>
                <span className="text-sm text-slate-400 hidden lg:block">{user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="hidden md:flex"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-slate-400 hover:text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-800 py-3 space-y-1">
            <div className="mb-3">
              <StockSearchBar />
            </div>
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {user ? (
              <button
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            ) : (
              <div className="flex gap-2 px-3 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="secondary" className="w-full">Sign in</Button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <Button className="w-full">Get started</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
