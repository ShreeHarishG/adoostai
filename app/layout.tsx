import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SiteShell } from '@/components/layout/SiteShell'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'AdBoostAI — Campaign Intelligence Platform',
  description: 'Real-time AI that watches your campaigns, debates the signals, and acts before budget is wasted.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
