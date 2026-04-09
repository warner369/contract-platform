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

interface SuggestionGroup {
  intent: string;
  response: SuggestResponse | null;
  loading: boolean;
  error: string | null;
}

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
  const [groups, setGroups] = useState<SuggestionGroup[]>([]);
  const [handledKeys, setHandledKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const recommendations = analysis.recommendations.slice(0, 3);
    if (recommendations.length === 0) return;

    async function fetchSuggestions() {
      const results = await Promise.allSettled(
        recommendations.map(async (intent) => {
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
            return { intent, response: null, loading: false, error: err instanceof Error ? err.message : 'Failed' };
          }
        })
      );

      const loaded = results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value;
        return { intent: recommendations[i], response: null, loading: false, error: 'Failed' };
      });

      setGroups(loaded);
    }

    setGroups(recommendations.map((intent) => ({ intent, response: null, loading: true, error: null })));
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

  function handleUseAlternative(suggestion: SuggestResponse['suggestions'][0], alt: SuggestResponse['alternatives'][0]) {
    handleAccept({
      type: 'modify',
      originalText: suggestion.originalText,
      suggestedText: alt.text,
      rationale: `Alternative: ${alt.pros.join(', ')}`,
    });
  }

  const hasAnyHandled = handledKeys.size > 0;

  const hasContent = groups.some((g) => g.loading) ||
    groups.some((g) => g.response && (g.response.suggestions.length > 0 || (g.response.alternatives && g.response.alternatives.length > 0) || (g.response.negotiationTips && g.response.negotiationTips.length > 0)));

  if (!hasContent && groups.every((g) => !g.loading)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {groups.some((g) => g.loading) && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          Generating suggestions based on identified concerns...
        </div>
      )}

      {groups.map((group, gi) => {
        if (!group.response || group.response.suggestions.length === 0) return null;

        return (
          <div key={gi}>
            <p className="text-xs text-slate-400 italic mb-2">Based on: &ldquo;{group.intent}&rdquo;</p>

            {group.response.suggestions.map((suggestion, si) => {
              const key = suggestion.originalText + suggestion.suggestedText;
              const handled = handledKeys.has(key);
              const isDimmed = hasAnyHandled && !handled;

              return (
                <div
                  key={si}
                  className={`border border-slate-200 rounded-lg overflow-hidden mb-3 transition-opacity ${
                    isDimmed ? 'opacity-40' : 'opacity-100'
                  }`}
                >
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-600">Accepted</span>
                        <button
                          onClick={() => {
                            setHandledKeys((prev) => {
                              const next = new Set(prev);
                              next.delete(key);
                              return next;
                            });
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 underline"
                        >
                          Choose a different option
                        </button>
                      </div>
                    ) : isDimmed ? (
                      <button
                        onClick={() => setHandledKeys(new Set())}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Use this instead
                      </button>
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

                  {group.response.alternatives && group.response.alternatives.length > 0 && (
                    <div className="border-t border-slate-200 px-3 py-2 bg-white">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Alternatives
                      </p>
                      <div className="space-y-2">
                        {group.response.alternatives.map((alt, ai) => (
                          <details key={ai} className="border border-slate-100 rounded-md">
                            <summary className="p-2 text-xs font-medium text-slate-600 cursor-pointer hover:bg-slate-50">
                              {alt.text.slice(0, 100)}{alt.text.length > 100 ? '...' : ''}
                            </summary>
                            <div className="px-2 pb-2 space-y-1.5">
                              {alt.pros.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-emerald-600 mb-0.5">Pros</p>
                                  <ul className="space-y-0.5">
                                    {alt.pros.map((pro, j) => (
                                      <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                                        <span className="text-emerald-500">•</span>
                                        {pro}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {alt.cons.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-amber-600 mb-0.5">Cons</p>
                                  <ul className="space-y-0.5">
                                    {alt.cons.map((con, j) => (
                                      <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                                        <span className="text-amber-500">•</span>
                                        {con}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <button
                                onClick={() => handleUseAlternative(suggestion, alt)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700"
                              >
                                Use this alternative
                              </button>
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {group.response.negotiationTips && group.response.negotiationTips.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Negotiation Tips
                </p>
                <ul className="space-y-0.5">
                  {group.response.negotiationTips.map((tip, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">→</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}