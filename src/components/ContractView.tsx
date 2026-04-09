'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useContract } from '@/components/providers/ContractProvider';
import ClauseDetailPanel from './ClauseDetailPanel';
import type { ParsedContract } from '@/types/contract';

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function ContractView() {
  const router = useRouter();
  const { state, selectClause, setContract, getChangesForClause } = useContract();
  const mounted = useHydrated();
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mounted && !state.current && !state.isLoading) {
      const stored = sessionStorage.getItem('contract');
      if (stored) {
        try {
          const contract = JSON.parse(stored) as ParsedContract;
          setContract(contract);
        } catch {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    }
  }, [mounted, state.current, state.isLoading, router, setContract]);

  useEffect(() => {
    if (state.selectedClauseId && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [state.selectedClauseId]);

  if (!mounted || state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (!state.current) {
    return null;
  }

  const { current } = state;

  return (
    <div className="py-6">
      {/* Contract Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{current.title}</h1>
        <p className="text-sm text-slate-500 mb-4">{current.summary}</p>
        {current.parties.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {current.parties.map((party, i) => (
              <span
                key={i}
                className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full"
              >
                {party}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Clause List with inline detail panels */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Clauses
        </h2>
        {current.clauses.map((clause) => {
          const changes = getChangesForClause(clause.id);
          const pendingCount = changes.filter(c => c.status === 'pending').length;
          const acceptedCount = changes.filter(c => c.status === 'accepted').length;
          const rejectedCount = changes.filter(c => c.status === 'rejected').length;
          const originalClause = state.original?.clauses.find(c => c.id === clause.id);
          const isModified = originalClause && originalClause.text !== clause.text;
          const hasChanges = changes.length > 0;
          const isSelected = state.selectedClauseId === clause.id;

          return (
            <div key={clause.id} ref={isSelected ? detailRef : undefined}>
              <button
                onClick={() => selectClause(isSelected ? null : clause.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-400">
                        {clause.number}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {clause.title}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 capitalize">
                        {clause.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {clause.text}
                    </p>
                    {(hasChanges || isModified) && (
                      <div className="flex items-center gap-2 mt-1.5">
                        {isModified && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                            Modified
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {pendingCount} pending
                          </span>
                        )}
                        {acceptedCount > 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {acceptedCount} accepted
                          </span>
                        )}
                        {rejectedCount > 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 line-through border border-slate-200">
                            {rejectedCount} rejected
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                        clause.riskLevel === 'high'
                          ? 'bg-red-400'
                          : clause.riskLevel === 'medium'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      title={`${clause.riskLevel} risk`}
                    />
                    {clause.confidence === 'low' && (
                      <span className="text-amber-500" title="AI confidence: Low. This clause may need manual review.">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.516-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                    {clause.confidence === 'medium' && (
                      <span className="text-blue-500" title="AI confidence: Medium.">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.067A1.25 1.25 0 0010.26 14.5H10a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.067A1.25 1.25 0 008.74 9H9z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {isSelected && (
                <div className="mt-2">
                  <ClauseDetailPanel
                    clause={clause}
                    contractTitle={current.title}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}