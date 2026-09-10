'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import InitialAvatar from './InitialAvatar';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', href: '/' },
    { name: 'Friends Ledger', href: '/friends' },
    { name: 'EMI Tracker', href: '/emi' },
    { name: 'Settle Up', href: '/settle' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/40">
      <div className="h-16 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary font-extrabold shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-base tracking-tighter">₹</span>
            </div>
            <span className="text-lg text-on-surface tracking-tight font-bold">
              MoneyTrack
            </span>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-tertiary"></span>
          </button>

          <div className="h-5 w-[1px] bg-outline-variant/50 mx-1 hidden sm:block"></div>

          <div className="flex items-center pl-1 cursor-pointer" title="User Profile">
            <InitialAvatar name="Aditya" size="sm" />
          </div>
        </div>
      </div>
    </header>
  );
}
