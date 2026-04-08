'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useContract } from '@/components/providers/ContractProvider';
import type { ParsedContract, ClauseAnalysis } from '@/types/contract';

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function ContractView() {
  const router = useRouter();
  const { state, selectClause, setContract } = useContract();
  const mounted = useHydrated();

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
    <div className="max-w-7xl mx-auto px-6 py-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clause List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Clauses
          </h2>
          {current.clauses.map((clause) => (
            <button
              key={clause.id}
              onClick={() => selectClause(clause.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                state.selectedClauseId === clause.id
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
                </div>
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
              </div>
            </button>
          ))}
        </div>

        {/* Clause Detail Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            {state.selectedClauseId ? (
              <ClauseDetailPanel
                clause={current.clauses.find((c) => c.id === state.selectedClauseId)!}
                contractTitle={current.title}
              />
            ) : (
              <div className="p-6 rounded-xl border border-slate-200 bg-white">
                <p className="text-sm text-slate-500">
                  Click a clause to see its explanation, risk assessment, and related clauses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClauseDetailPanel({
  clause,
  contractTitle,
}: {
  clause: import('@/types/contract').Clause;
  contractTitle: string;
}) {
  const { selectClause } = useContract();
  const [analysis, setAnalysis] = useState<ClauseAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/analyse-clause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clause, contractTitle }),
        });
        if (!response.ok) {
          throw new Error('Failed to analyse clause');
        }
        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalysis();
  }, [clause.id, contractTitle]);

  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold text-slate-400">
            Clause {clause.number}
          </span>
          <h3 className="text-sm font-semibold text-slate-900">{clause.title}</h3>
        </div>
        <button
          onClick={() => selectClause(null)}
          className="text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      </div>

      {/* Risk Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium mb-4 ${
          clause.riskLevel === 'high'
            ? 'bg-red-100 text-red-700'
            : clause.riskLevel === 'medium'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            clause.riskLevel === 'high'
              ? 'bg-red-400'
              : clause.riskLevel === 'medium'
              ? 'bg-amber-400'
              : 'bg-emerald-400'
          }`}
        />
        {clause.riskLevel.charAt(0).toUpperCase() + clause.riskLevel.slice(1)} Risk
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : analysis ? (
        <div className="space-y-4">
          {/* Explanation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              What this means
            </h4>
            <p className="text-sm text-slate-700">{analysis.explanation}</p>
          </div>

          {/* Risks */}
          {analysis.risks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Potential concerns
              </h4>
              <ul className="space-y-1">
                {analysis.risks.map((risk, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Clauses */}
          {analysis.relatedClauses.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Related clauses
              </h4>
              <ul className="space-y-1">
                {analysis.relatedClauses.map((rel, i) => (
                  <li key={i} className="text-sm text-slate-600">
                    <span className="font-medium">{rel.clauseId}</span>: {rel.relationship}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Considerations
              </h4>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}