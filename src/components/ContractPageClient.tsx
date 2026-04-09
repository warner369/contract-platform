'use client';

import { useState } from 'react';
import ContractView from '@/components/ContractView';
import ComparisonView from '@/components/ComparisonView';

type ActiveView = 'clauses' | 'changes';

export default function ContractPageClient() {
  const [activeView, setActiveView] = useState<ActiveView>('clauses');

  return (
    <>
      <div className="flex gap-1 mb-0">
        {(['clauses', 'changes'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeView === view
                ? 'text-slate-900 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
            }`}
          >
            {view === 'clauses' ? 'Clauses' : 'Changes'}
          </button>
        ))}
      </div>
      {activeView === 'clauses' ? <ContractView /> : <ComparisonView />}
    </>
  );
}