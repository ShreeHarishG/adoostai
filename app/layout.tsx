import type { Metadata } from 'next'
import './globals.css'
import { SiteShell } from '@/components/layout/SiteShell'

export const metadata: Metadata = {
  title: 'AdBoostAI | Campaign Intelligence',
  description: 'Forecast risk, understand fatigue, and act on clear campaign priorities.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
