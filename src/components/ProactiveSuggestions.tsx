'use client';

import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useContract } from '@/components/providers/ContractProvider';
import type { Clause, ClauseAnalysis, SuggestResponse, ClauseChange } from '@/types/contract';

const diffStyles = {
  variables: {
    light: {
      addedBackground: '#ecfdf5',
      addedColor: '#065f46',
      removedBackground: '#fef2f2',
      removedColor: '#991b1b',
      wordAddedBackground: '#a7f3d0',
      wordRemovedBackground: '#fecaca',
    },
  },
};

export default function ProactiveSuggestions({
  clause,
  contractTitle,
  analysis,
}: {
  clause: Clause;
  contractTitle: string;
  analysis: ClauseAnalysis;
}) {
  const { proposeChange, applyChange, rejectChange, getSuggestionCache, setSuggestionCache } = useContract();
  const [suggestions, setSuggestions] = useState<Array<{
    intent: string;
    response: SuggestResponse;
    loading: boolean;
    error: string | null;
  }>>([]);
  const [handledKeys, setHandledKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const recommendations = analysis.recommendations.slice(0, 3);
    if (recommendations.length === 0) return;

    const intents = recommendations.map((rec) => rec);

    async function fetchSuggestions() {
      const results = await Promise.allSettled(
        intents.map(async (intent) => {
          const cacheKey = `${clause.id}:${intent}`;
          const cached = getSuggestionCache(cacheKey);
          if (cached) {
            return { intent, response: cached, loading: false, error: null };
          }
          try {
            const res = await fetch('/api/suggest-change', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clause, userIntent: intent, contractTitle }),
            });
            if (!res.ok) throw new Error('Failed to suggest changes');
            const data: SuggestResponse = await res.json();
            setSuggestionCache(cacheKey, data);
            return { intent, response: data, loading: false, error: null };
          } catch (err) {
            return { intent, response: null as unknown as SuggestResponse, loading: false, error: err instanceof Error ? err.message : 'Failed' };
          }
        })
      );

      const loaded = results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value;
        return { intent: intents[i], response: null as unknown as SuggestResponse, loading: false, error: 'Failed' };
      });

      setSuggestions(loaded);
    }

    setSuggestions(intents.map((intent) => ({ intent, response: null as unknown as SuggestResponse, loading: true, error: null })));
    fetchSuggestions();
  }, [clause.id, contractTitle]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAccept(suggestion: SuggestResponse['suggestions'][0]) {
    const change: ClauseChange = {
      id: nanoid(),
      clauseId: clause.id,
      type: suggestion.type,
      originalText: suggestion.originalText,
      suggestedText: suggestion.suggestedText,
      rationale: suggestion.rationale,
      status: 'pending',
    };
    proposeChange(change);
    applyChange({ ...change, status: 'accepted' });
    setHandledKeys((prev) => new Set(prev).add(suggestion.originalText + suggestion.suggestedText));
  }

  function handleReject(suggestion: SuggestResponse['suggestions'][0]) {
    const change: ClauseChange = {
      id: nanoid(),
      clauseId: clause.id,
      type: suggestion.type,
      originalText: suggestion.originalText,
      suggestedText: suggestion.suggestedText,
      rationale: suggestion.rationale,
      status: 'pending',
    };
    proposeChange(change);
    rejectChange(change.id);
    setHandledKeys((prev) => new Set(prev).add(suggestion.originalText + suggestion.suggestedText));
  }

  function handleUseAlternative(alt: SuggestResponse['alternatives'][0]) {
    handleAccept({
      type: 'modify',
      originalText: clause.text,
      suggestedText: alt.text,
      rationale: `Alternative: ${alt.pros.join(', ')}`,
    });
  }

  const allSuggestions = suggestions.flatMap((s) =>
    s.response?.suggestions?.map((sug) => ({ ...sug, intent: s.intent })) ?? []
  );

  const hasContent = allSuggestions.length > 0 ||
    suggestions.some((s) => s.loading) ||
    suggestions.some((s) => s.response?.alternatives && s.response.alternatives.length > 0) ||
    suggestions.some((s) => s.response?.negotiationTips && s.response.negotiationTips.length > 0);

  if (!hasContent && suggestions.every((s) => !s.loading)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {suggestions.some((s) => s.loading) && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          Generating suggestions based on identified concerns...
        </div>
      )}

      {allSuggestions.map((suggestion, i) => {
        const key = suggestion.originalText + suggestion.suggestedText;
        const handled = handledKeys.has(key);
        return (
          <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-auto">
              <ReactDiffViewer
                oldValue={suggestion.originalText}
                newValue={suggestion.suggestedText}
                splitView={false}
                styles={diffStyles}
                leftTitle="Original"
                rightTitle="Proposed"
                hideLineNumbers={true}
              />
            </div>
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600 mb-3">{suggestion.rationale}</p>
              {handled ? (
                <p className="text-xs font-medium text-slate-400">Handled</p>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(suggestion)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(suggestion)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {suggestions.map((s, si) =>
        s.response?.alternatives && s.response.alternatives.length > 0 ? (
          <div key={`alt-${si}`}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Alternatives
            </h4>
            <div className="space-y-2">
              {s.response.alternatives.map((alt, i) => (
                <details key={i} className="border border-slate-200 rounded-lg">
                  <summary className="p-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50">
                    {alt.text.slice(0, 80)}...
                  </summary>
                  <div className="px-3 pb-3 space-y-2">
                    {alt.pros.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 mb-1">Pros</p>
                        <ul className="space-y-0.5">
                          {alt.pros.map((pro, j) => (
                            <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {alt.cons.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-600 mb-1">Cons</p>
                        <ul className="space-y-0.5">
                          {alt.cons.map((con, j) => (
                            <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      onClick={() => handleUseAlternative(alt)}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      Use this alternative
                    </button>
                  </div>
                </details>
              ))}
            </div>
          </div>
        ) : null
      )}

      {suggestions.map((s, si) =>
        s.response?.negotiationTips && s.response.negotiationTips.length > 0 ? (
          <div key={`tips-${si}`}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Negotiation Tips
            </h4>
            <ul className="space-y-1">
              {s.response.negotiationTips.map((tip, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}