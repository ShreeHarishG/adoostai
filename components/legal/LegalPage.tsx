import Link from 'next/link'

interface LegalSection {
  heading: string
  body: string
}

interface LegalPageProps {
  title: string
  updatedDate: string
  intro: string
  sections: LegalSection[]
}

export function LegalPage({ title, updatedDate, intro, sections }: LegalPageProps) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <article className="surface-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Legal</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Last updated: {updatedDate}</p>
        <p className="mt-4 text-sm leading-6 text-slate-700">{intro}</p>

        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-bold text-slate-900">{section.heading}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Questions about these terms can be sent to support. Return to <Link href="/" className="font-semibold text-slate-900">AdBoostAI</Link>.
        </div>
      </article>
    </main>
  )
}

