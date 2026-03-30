import { LegalPage } from '@/components/legal/LegalPage'

export default function SecurityPage() {
  return (
    <LegalPage
      title="Security"
      updatedDate="March 3, 2026"
      intro="AdBoostAI is designed with product security and operational reliability in mind for campaign decision workflows."
      sections={[
        {
          heading: 'Access Control',
          body: 'User data access is scoped by ownership checks, authenticated sessions, and server-side authorization controls.',
        },
        {
          heading: 'Application Safeguards',
          body: 'Input validation, structured logging, and controlled API flows are used to reduce operational and data-handling risk.',
        },
        {
          heading: 'Data Protection',
          body: 'Campaign records are stored in managed infrastructure with monitored access and recovery-oriented operational practices.',
        },
        {
          heading: 'Reporting',
          body: 'If you identify a potential vulnerability, report it through support channels with reproduction steps and impact details.',
        },
      ]}
    />
  )
}

