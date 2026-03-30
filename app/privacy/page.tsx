import { LegalPage } from '@/components/legal/LegalPage'

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedDate="March 3, 2026"
      intro="This policy describes how AdBoostAI collects, processes, and protects personal and campaign-related information."
      sections={[
        {
          heading: 'Data We Process',
          body: 'We process account identifiers, campaign performance inputs, and user actions in the product to generate analysis and improve recommendation quality.',
        },
        {
          heading: 'Why We Process Data',
          body: 'Data is used to operate core features such as campaign scoring, forecasting, explainability timelines, and collaboration adaptation.',
        },
        {
          heading: 'Retention',
          body: 'We retain data while your account is active and as required for operational integrity, compliance, and legitimate business purposes.',
        },
        {
          heading: 'Security Practices',
          body: 'We apply access controls, logging, and least-privilege principles to protect stored campaign and account information.',
        },
      ]}
    />
  )
}

