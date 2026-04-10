'use client';

import { useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useContract } from '@/components/providers/ContractProvider';

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
  line: {
    padding: '4px 8px',
  },
  contentText: {
    fontSize: '13px',
    lineHeight: '1.5',
  },
  gutter: {
    minWidth: '32px',
    padding: '0 6px',
  },
};

type ViewFilter = 'all' | 'pending';

export default function ComparisonView() {
  const { state } = useContract();
  const [filter, setFilter] = useState<ViewFilter>('all');

  if (!state.original || !state.current) {
    return (
      <div className="p-6 rounded-xl border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">
          No contract loaded. Upload a contract to see the comparison view.
        </p>
      </div>
    );
  }

  const allChanges = state.changes;
  const acceptedCount = allChanges.filter((c) => c.status === 'accepted').length;
  const rejectedCount = allChanges.filter((c) => c.status === 'rejected').length;
  const pendingCount = allChanges.filter((c) => c.status === 'pending').length;

  const changedClauses = state.original.clauses.filter((originalClause) => {
    const currentClause = state.current?.clauses.find(
      (c) => c.id === originalClause.id,
    );
    return currentClause && currentClause.text !== originalClause.text;
  });

  const displayedChanges =
    filter === 'pending'
      ? allChanges.filter((c) => c.status === 'pending')
      : allChanges;

  const displayedClauseIds =
    filter === 'pending'
      ? new Set(displayedChanges.map((c) => c.clauseId))
      : new Set(changedClauses.map((c) => c.id));

  const displayedClauses =
    filter === 'pending'
      ? changedClauses.filter((c) => displayedClauseIds.has(c.id))
      : changedClauses;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Changes Summary
          </h2>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-white text-slate-500 hover:text-slate-700'
              }`}
            >
              All changes
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-white text-slate-500 hover:text-slate-700'
              }`}
            >
              Pending only
            </button>
          </div>
        </div>

        {allChanges.length > 0 ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              {acceptedCount > 0 && (
                <span className="text-sm">
                  <span className="font-semibold text-emerald-700">{acceptedCount}</span>{' '}
                  <span className="text-slate-500">accepted</span>
                </span>
              )}
              {rejectedCount > 0 && (
                <span className="text-sm">
                  <span className="font-semibold text-red-700">{rejectedCount}</span>{' '}
                  <span className="text-slate-500">rejected</span>
                </span>
              )}
              {pendingCount > 0 && (
                <span className="text-sm">
                  <span className="font-semibold text-amber-700">{pendingCount}</span>{' '}
                  <span className="text-slate-500">pending</span>
                </span>
              )}
            </div>
            <div className="grid gap-2">
              {displayedChanges.map((change) => (
                <div
                  key={`${change.id}-${change.status}`}
                  className={`p-3 rounded-lg text-sm ${
                    change.status === 'accepted'
                      ? 'bg-emerald-50 border border-emerald-200'
                      : change.status === 'rejected'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-amber-50 border border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      Clause {change.clauseId}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        change.status === 'accepted'
                          ? 'text-emerald-600'
                          : change.status === 'rejected'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {change.status.charAt(0).toUpperCase() + change.status.slice(1)}
                    </span>
                  </div>
                  {change.status !== 'rejected' && (
                    <p className="text-slate-600 mt-1 line-clamp-2">
                      {String(change.suggestedText ?? '')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No changes have been made yet. Propose changes to clauses to see them
            compared here.
          </p>
        )}
      </div>

      {/* Diff comparison */}
      {displayedClauses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            {filter === 'pending' ? 'Pending Changes' : 'Changed Clauses'}
          </h3>
          {displayedClauses.map((originalClause) => {
            const currentClause = state.current?.clauses.find(
              (c) => c.id === originalClause.id,
            );
            if (!currentClause) return null;

            return (
              <div
                key={originalClause.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-xs font-semibold text-slate-400">
                    Clause {originalClause.number}:
                  </span>{' '}
                  <span className="text-sm font-semibold text-slate-900">
                    {originalClause.title}
                  </span>
                </div>
                <div className="max-h-96 overflow-auto">
                  <ReactDiffViewer
                    oldValue={String(originalClause.text ?? '')}
                    newValue={String(currentClause.text ?? '')}
                    splitView={true}
                    leftTitle="Original"
                    rightTitle="Modified"
                    styles={diffStyles}
                    hideLineNumbers={true}
                    showDiffOnly={true}
                    extraLinesSurroundingDiff={1}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filter === 'pending' && displayedClauses.length === 0 && allChanges.length > 0 && (
        <div className="p-6 rounded-xl border border-slate-200 bg-white">
          <p className="text-sm text-slate-500">
            No pending changes. All changes have been accepted or rejected.
          </p>
        </div>
      )}
    </div>
  );
}