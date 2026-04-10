'use client';

import { useEffect, useState } from 'react';
import { useContract } from '@/components/providers/ContractProvider';
import SuggestChangePanel from './SuggestChangePanel';
import ProactiveSuggestions from './ProactiveSuggestions';
import ClauseNotes from './ClauseNotes';
import ThreadPanel from './ThreadPanel';
import VariablesPanel from './VariablesPanel';
import type { Clause, ClauseAnalysis } from '@/types/contract';

function Section({
  title,
  defaultOpen = true,
  count,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-slate-200 pt-3 mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 w-full text-left"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
        {title}
        {count !== undefined && count > 0 && (
          <span className="text-[10px] font-bold bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5">
            {count}
          </span>
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function ClauseDetailPanel({
  clause,
  contractTitle,
}: {
  clause: Clause;
  contractTitle: string;
}) {
  const { selectClause, getAnalysisCache, setAnalysisCache, getNotesForClause, getThreadsForClause, state } = useContract();
  const relevantVariableCount = state.variables.filter((v) => v.affectedClauseIds.includes(clause.id)).length;
  const [analysis, setAnalysis] = useState<ClauseAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualSuggest, setShowManualSuggest] = useState(false);

  useEffect(() => {
    const cached = getAnalysisCache(clause.id);
    if (cached) {
      setAnalysis(cached);
      return;
    }

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
        setAnalysisCache(clause.id, data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalysis();
  }, [clause.id, contractTitle, getAnalysisCache, setAnalysisCache]);

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
        <>
          <Section title="What this means" defaultOpen={true}>
            <p className="text-sm text-slate-700">{analysis.explanation}</p>
          </Section>

          {analysis.risks.length > 0 && (
            <Section title="Potential concerns" defaultOpen={true} count={analysis.risks.length}>
              <ul className="space-y-1">
                {analysis.risks.map((risk, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {analysis.opportunities.length > 0 && (
            <Section title="Opportunities" defaultOpen={true} count={analysis.opportunities.length}>
              <ul className="space-y-1">
                {analysis.opportunities.map((opp, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {opp}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Suggested improvements" defaultOpen={true}>
            <ProactiveSuggestions clause={clause} contractTitle={contractTitle} analysis={analysis} />
            <div className="mt-3">
              <button
                onClick={() => setShowManualSuggest(!showManualSuggest)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showManualSuggest ? 'Hide manual input' : 'Or describe what you want to change'}
              </button>
              {showManualSuggest && (
                <div className="mt-2">
                  <SuggestChangePanel clause={clause} contractTitle={contractTitle} />
                </div>
              )}
            </div>
          </Section>

          {analysis.relatedClauses.length > 0 && (
            <Section title="Related clauses" defaultOpen={false} count={analysis.relatedClauses.length}>
              <ol className="space-y-2">
                {analysis.relatedClauses.map((rel, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-slate-400 font-medium min-w-[1.25rem]">{i + 1}.</span>
                    <span>
                      <button
                        onClick={() => selectClause(rel.clauseId)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {rel.clauseId}
                      </button>
                      <span className="text-slate-500"> — {rel.relationship}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {analysis.recommendations.length > 0 && (
            <Section title="Considerations" defaultOpen={false} count={analysis.recommendations.length}>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Notes" defaultOpen={false} count={getNotesForClause(clause.id).length}>
            <ClauseNotes clauseId={clause.id} />
          </Section>

          <Section title="Discussion" defaultOpen={false} count={getThreadsForClause(clause.id).length}>
            <ThreadPanel clauseId={clause.id} />
          </Section>

          <Section title="Variables" defaultOpen={false} count={relevantVariableCount}>
            <VariablesPanel clauseId={clause.id} />
          </Section>
        </>
      ) : null}
    </div>
  );
}