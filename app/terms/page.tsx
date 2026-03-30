import { LegalPage } from '@/components/legal/LegalPage'

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      updatedDate="March 3, 2026"
      intro="These Terms govern access to and use of AdBoostAI. By using the product, you agree to these terms, including usage limits, acceptable conduct, and service conditions."
      sections={[
        {
          heading: 'Account Use',
          body: 'You are responsible for activity performed through your account and must provide accurate information. Access credentials must be kept confidential.',
        },
        {
          heading: 'Service Scope',
          body: 'AdBoostAI provides analytical recommendations and simulations for campaign optimization. Final decisions remain your responsibility.',
        },
        {
          heading: 'Acceptable Use',
          body: 'You may not use the service for unlawful activities, abuse platform resources, or attempt unauthorized access to data or infrastructure.',
        },
        {
          heading: 'Availability and Changes',
          body: 'Features may evolve over time. We may modify, suspend, or discontinue parts of the service with reasonable notice when practical.',
        },
      ]}
    />
  )
}

