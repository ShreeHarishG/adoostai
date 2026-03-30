import { LegalPage } from '@/components/legal/LegalPage'

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updatedDate="March 3, 2026"
      intro="This policy explains how cookies and similar technologies are used in AdBoostAI."
      sections={[
        {
          heading: 'Essential Cookies',
          body: 'Essential cookies are used to maintain authenticated sessions and deliver secure product access.',
        },
        {
          heading: 'Analytics Cookies',
          body: 'Analytics cookies may be used to understand usage patterns, improve interface quality, and monitor product performance.',
        },
        {
          heading: 'Preference Cookies',
          body: 'Preference cookies help remember display and workflow settings to improve repeated visits.',
        },
        {
          heading: 'Managing Cookies',
          body: 'You can control cookie behavior in your browser settings. Disabling essential cookies may impact product functionality.',
        },
      ]}
    />
  )
}

