'use client';

import { useEffect, useState } from 'react';
import { useContract } from '@/components/providers/ContractProvider';
import SuggestChangePanel from './SuggestChangePanel';
import type { Clause, ClauseAnalysis } from '@/types/contract';

export default function ClauseDetailPanel({
  clause,
  contractTitle,
}: {
  clause: Clause;
  contractTitle: string;
}) {
  const { selectClause } = useContract();
  const [analysis, setAnalysis] = useState<ClauseAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);

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

          {/* Opportunities */}
          {analysis.opportunities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Opportunities
              </h4>
              <ul className="space-y-1">
                {analysis.opportunities.map((opp, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {opp}
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

      {/* Suggest Changes Section */}
      <div className="mt-4 border-t border-slate-200 pt-4">
        <button
          onClick={() => setShowSuggest(!showSuggest)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showSuggest ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
          Suggest changes
        </button>
        {showSuggest && (
          <div className="mt-3">
            <SuggestChangePanel clause={clause} contractTitle={contractTitle} />
          </div>
        )}
      </div>
    </div>
  );
}