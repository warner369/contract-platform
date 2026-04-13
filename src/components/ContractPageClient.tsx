'use client';

import { useState } from 'react';
import ContractView from '@/components/ContractView';
import ComparisonView from '@/components/ComparisonView';
import FeedbackModeSelector from '@/components/FeedbackModeSelector';
import UpgradeModal from '@/components/UpgradeModal';
import { useContract } from '@/components/providers/ContractProvider';
import { useAuth } from '@/components/providers/AuthProvider';

type ActiveView = 'clauses' | 'changes';

export default function ContractPageClient() {
  const [activeView, setActiveView] = useState<ActiveView>('clauses');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { state, setFeedbackMode } = useContract();
  const { user } = useAuth();

  return (
    <>
      <div className="sticky top-14 z-10 bg-[#f8f7f4] border-b border-slate-200 -mx-6 px-6 pt-2 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
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
          <div className="w-72 pb-2">
            <FeedbackModeSelector
              value={state.feedbackMode}
              onChange={setFeedbackMode}
              userPlan={user?.plan ?? 'free'}
              onUpgradeRequested={() => setShowUpgradeModal(true)}
            />
          </div>
        </div>
      </div>
      <div hidden={activeView !== 'clauses'}>
        <ContractView />
      </div>
      <div hidden={activeView !== 'changes'}>
        <ComparisonView />
      </div>
      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}