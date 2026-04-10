'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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
  const { state, selectClause, setContract, getChangesForClause, getNotesForClause, getThreadsForClause } = useContract();
  const mounted = useHydrated();
  const detailRef = useRef<HTMLDivElement>(null);
  const [recentlyAffectedIds, setRecentlyAffectedIds] = useState<Set<string>>(new Set());
  const prevVarValuesRef = useRef<Record<string, string>>({});
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    const prevValues = prevVarValuesRef.current;
    const currentValues: Record<string, string> = {};
    for (const v of state.variables) {
      currentValues[v.id] = v.value;
    }

    const affectedIds = new Set<string>();
    for (const v of state.variables) {
      if (prevValues[v.id] && prevValues[v.id] !== v.value) {
        v.affectedClauseIds.forEach((id) => affectedIds.add(id));
      }
    }

    prevVarValuesRef.current = currentValues;

    if (affectedIds.size > 0) {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      setRecentlyAffectedIds(affectedIds);
      highlightTimerRef.current = setTimeout(() => {
        setRecentlyAffectedIds(new Set());
        highlightTimerRef.current = null;
      }, 3000);
    }
  }, [state.variables]);

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

  const filteredClauses = searchQuery
    ? current.clauses.filter((c) => {
        const q = searchQuery.toLowerCase();
        return c.text.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
      })
    : current.clauses;

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
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Clauses
          </h2>
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clauses..."
              className="w-full pl-9 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {searchQuery && (
          <p className="text-xs text-slate-400 mb-2">
            Showing {filteredClauses.length} of {current.clauses.length} clauses
          </p>
        )}
        {filteredClauses.length === 0 && searchQuery && (
          <div className="p-4 text-center text-sm text-slate-400">
            No clauses match &lsquo;{searchQuery}&rsquo;
          </div>
        )}
        {filteredClauses.map((clause) => {
          const changes = getChangesForClause(clause.id);
          const pendingCount = changes.filter(c => c.status === 'pending').length;
          const acceptedCount = changes.filter(c => c.status === 'accepted').length;
          const rejectedCount = changes.filter(c => c.status === 'rejected').length;
          const originalClause = state.original?.clauses.find(c => c.id === clause.id);
          const isModified = originalClause && originalClause.text !== clause.text;
          const hasChanges = changes.length > 0;
          const isSelected = state.selectedClauseId === clause.id;
          const isAffected = recentlyAffectedIds.has(clause.id);
          const notesForClause = getNotesForClause(clause.id);
          const threadsForClause = getThreadsForClause(clause.id);

          return (
            <div key={clause.id} ref={isSelected ? detailRef : undefined}>
              <button
                onClick={() => selectClause(isSelected ? null : clause.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50'
                    : isAffected
                    ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-300'
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
                    {notesForClause.length > 0 && (
                      <span className="text-slate-400 flex items-center gap-0.5" title={`${notesForClause.length} note${notesForClause.length !== 1 ? 's' : ''}`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-[10px]">{notesForClause.length}</span>
                      </span>
                    )}
                    {threadsForClause.length > 0 && (
                      <span className="text-slate-400 flex items-center gap-0.5" title={`${threadsForClause.length} discussion${threadsForClause.length !== 1 ? 's' : ''}`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-[10px]">{threadsForClause.length}</span>
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