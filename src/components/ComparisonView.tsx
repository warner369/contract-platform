'use client';

import { useContract } from '@/components/providers/ContractProvider';

export default function ComparisonView() {
  const { state } = useContract();

  if (!state.original || !state.current) {
    return (
      <div className="p-6 rounded-xl border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">
          No contract loaded. Upload a contract to see the comparison view.
        </p>
      </div>
    );
  }

  const hasChanges = state.changes.length > 0;

  // Find clauses that differ between original and current
  const changedClauses = state.original.clauses.filter((originalClause) => {
    const currentClause = state.current?.clauses.find(
      (c) => c.id === originalClause.id,
    );
    return currentClause && currentClause.text !== originalClause.text;
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Changes Summary
        </h2>
        {hasChanges ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {state.changes.filter((c) => c.status === 'accepted').length} changes
              accepted, {state.changes.filter((c) => c.status === 'rejected').length}{' '}
              rejected, {state.changes.filter((c) => c.status === 'pending').length}{' '}
              pending.
            </p>
            <div className="grid gap-2">
              {state.changes.map((change) => (
                <div
                  key={`${change.clauseId}-${change.status}`}
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

      {/* Side-by-side comparison */}
      {changedClauses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Changed Clauses
          </h3>
          {changedClauses.map((originalClause) => {
            const currentClause = state.current?.clauses.find(
              (c) => c.id === originalClause.id,
            );
            if (!currentClause) return null;

            return (
              <div
                key={originalClause.id}
                className="grid grid-cols-2 gap-4"
              >
                {/* Original */}
                <div className="p-4 rounded-xl border border-slate-200 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-400">
                      Original
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      Clause {originalClause.number}: {originalClause.title}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{String(originalClause.text ?? '')}</p>
                </div>

                {/* Current */}
                <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-400">
                      Modified
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      Clause {currentClause.number}: {currentClause.title}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{String(currentClause.text ?? '')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}