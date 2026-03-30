'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LineChart, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Analyze' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/import', label: 'Import' },
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
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="top-gradient inline-flex h-9 w-9 items-center justify-center rounded-xl text-white">
              <LineChart className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">AdBoostAI</p>
              <p className="text-xs text-slate-500">Campaign Intelligence</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <div>{children}</div>

      <footer className="border-t border-slate-200 bg-white/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Built for production-grade decision support.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

