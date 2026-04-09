'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useContract } from '@/components/providers/ContractProvider';
import type { Clause, SuggestResponse, ClauseChange } from '@/types/contract';

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

export default function SuggestChangePanel({
  clause,
  contractTitle,
}: {
  clause: Clause;
  contractTitle: string;
}) {
  const { proposeChange, applyChange, rejectChange, getSuggestionCache, setSuggestionCache } = useContract();
  const [intent, setIntent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SuggestResponse | null>(null);
  const [handledSuggestions, setHandledSuggestions] = useState<Set<string>>(new Set());
  const [previewSuggestionId, setPreviewSuggestionId] = useState<string | null>(null);

  async function handleSubmit() {
    if (!intent.trim()) return;
    setIsLoading(true);
    setError(null);

    const cacheKey = `${clause.id}:${intent.trim()}`;
    const cached = getSuggestionCache(cacheKey);
    if (cached) {
      setResponse(cached);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/suggest-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clause, userIntent: intent.trim(), contractTitle }),
      });
      if (!res.ok) throw new Error('Failed to suggest changes');
      const data: SuggestResponse = await res.json();
      setSuggestionCache(cacheKey, data);
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

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
    setHandledSuggestions((prev) => new Set(prev).add(suggestion.originalText + suggestion.suggestedText));
    setPreviewSuggestionId(null);
  }

  function handleReject(suggestion: SuggestResponse['suggestions'][0]) {
    const change: ClauseChange = {
      id: nanoid(),
      clauseId: clause.id,
      type: suggestion.type,
      originalText: suggestion.originalText,
      suggestedText: suggestion.suggestedText,
      rationale: suggestion.rationale,
      status: 'rejected',
    };
    proposeChange(change);
    rejectChange(change.id);
    setHandledSuggestions((prev) => new Set(prev).add(suggestion.originalText + suggestion.suggestedText));
    setPreviewSuggestionId(null);
  }

  function handleUseAlternative(alt: SuggestResponse['alternatives'][0]) {
    const suggestion = {
      type: 'modify' as const,
      originalText: clause.text,
      suggestedText: alt.text,
      rationale: `Alternative: ${alt.pros.join(', ')}`,
    };
    handleAccept(suggestion);
  }

  const suggestionKey = (s: SuggestResponse['suggestions'][0]) => s.originalText + s.suggestedText;

  return (
    <div className="space-y-4">
      <div>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="What do you want to achieve? e.g. 'I want to ensure I have full IP ownership'"
          className="w-full p-3 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          rows={3}
        />
        <button
          onClick={handleSubmit}
          disabled={!intent.trim() || isLoading}
          className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Suggesting...' : 'Suggest changes'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {response && (
        <div className="space-y-4">
          {response.suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Suggested Changes
              </h4>
              <div className="space-y-3">
                {response.suggestions.map((suggestion, i) => {
                  const key = suggestionKey(suggestion);
                  const handled = handledSuggestions.has(key);
                  const isPreviewing = previewSuggestionId === key;

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
                      <div className="p-3 border-t border-slate-200">
                        <p className="text-sm text-slate-600 mb-3">{suggestion.rationale}</p>
                        {handled ? (
                          <p className="text-xs font-medium text-slate-500">
                            {handledSuggestions.has(key) ? 'Handled' : ''}
                          </p>
                        ) : isPreviewing ? (
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
                            <button
                              onClick={() => setPreviewSuggestionId(null)}
                              className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-50"
                            >
                              Revert preview
                            </button>
                          </div>
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
                            <button
                              onClick={() => setPreviewSuggestionId(key)}
                              className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                            >
                              Preview
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {response.alternatives.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Alternatives
              </h4>
              <div className="space-y-2">
                {response.alternatives.map((alt, i) => (
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
          )}

          {response.negotiationTips.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Negotiation Tips
              </h4>
              <ul className="space-y-1">
                {response.negotiationTips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}