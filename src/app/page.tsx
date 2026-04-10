'use client';

import UploadForm from '@/components/UploadForm';
import { useAuth } from '@/components/providers/AuthProvider';

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

const features = [
  {
    icon: <BoltIcon />,
    title: 'Instant clause analysis',
    description: 'Upload a contract and get every clause broken down, categorised, and risk-assessed in seconds.',
  },
  {
    icon: <ShieldIcon />,
    title: 'Plain-language explanations',
    description: 'Understand exactly what each clause means without needing a law degree. Click any clause to expand it.',
  },
  {
    icon: <PencilIcon />,
    title: 'Intent-based editing',
    description: 'Tell the AI what you want — "I need longer payment terms" — and it drafts the clause language for you to review.',
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f4]">
      {/* Nav */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900 tracking-tight">Clause</span>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{user.name}</span>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-xs text-slate-400 hover:text-slate-600">Sign out</button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a href="/login" className="text-sm text-slate-500 hover:text-slate-700">Sign in</a>
              <a href="/register" className="text-xs font-medium px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Create account</a>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            AI-powered contract review
          </div>

          <h1 className="text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-5 max-w-2xl mx-auto">
            Understand every clause before you sign
          </h1>

          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-12">
            Upload a contract and get instant clause-by-clause analysis, plain-language explanations, risk flags, and AI-assisted negotiation tools — all without leaving your browser.
          </p>

          {/* Upload card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto">
            <p className="text-sm font-medium text-slate-600 mb-5">
              Upload a contract to get started
            </p>
            <UploadForm />
            <p className="text-xs text-slate-400 mt-4">
              PDF, Word (.docx), or plain text · Processed securely · Stored in your account
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="grid grid-cols-3 gap-8">
              {features.map((f) => (
                <div key={f.title} className="flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-10 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { step: '01', heading: 'Upload your contract', body: 'Drop in a PDF or Word document, or paste the contract text directly. Supports most standard contract formats.' },
              { step: '02', heading: 'Review clause by clause', body: 'The contract is parsed into numbered clauses. Click any clause to get a plain-language explanation and risk assessment.' },
              { step: '03', heading: 'Negotiate with confidence', body: 'Propose changes in plain language or edit directly. The AI suggests specific clause language — you decide what to accept.' },
            ].map((item) => (
              <div key={item.step} className="bg-white border border-slate-200 rounded-xl p-6">
                <span className="text-3xl font-bold text-slate-100 leading-none">{item.step}</span>
                <h3 className="text-sm font-semibold text-slate-900 mt-2 mb-2">{item.heading}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Clause</span>
          <span className="text-xs text-slate-400">AI-powered contract review</span>
        </div>
      </footer>
    </div>
  );
}
