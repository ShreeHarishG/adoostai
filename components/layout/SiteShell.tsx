'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Analyze' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/import', label: 'Import' },
  { href: '/architecture', label: 'Architecture' },
  { href: '/security', label: 'Security' },
]

const legalLinks = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/cookies', label: 'Cookies' },
]

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B1120]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/20">
              <Activity className="h-4.5 w-4.5 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">AdBoostAI</p>
              <p className="text-[11px] text-slate-400">Campaign Intelligence</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] p-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/[0.06] bg-[#0B1120]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Production-grade AI decision support.</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-slate-300">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
