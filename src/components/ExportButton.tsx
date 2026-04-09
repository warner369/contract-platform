'use client';

import { useState } from 'react';
import { useContract } from '@/components/providers/ContractProvider';
import { exportContractToDocx } from '@/lib/export';

export default function ExportButton() {
  const { state, addAuditEntry } = useContract();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const hasTrackedChanges = state.changes.some(
    (c) => c.status === 'accepted' || c.status === 'pending',
  );

  async function handleExport() {
    if (!state.original || !state.current || !hasTrackedChanges) return;

    setIsExporting(true);
    setError(null);

    try {
      const blob = await exportContractToDocx(state);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.current.title.replace(/[^a-zA-Z0-9]/g, '_')}-tracked-changes.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addAuditEntry({
        id: crypto.randomUUID(),
        action: 'EXPORT_DOCX',
        detail: 'Exported contract as tracked-changes DOCX',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export document');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isExporting || !state.current || !hasTrackedChanges}
        onMouseEnter={() => setShowDisclaimer(true)}
        onMouseLeave={() => setShowDisclaimer(false)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          hasTrackedChanges
            ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={hasTrackedChanges ? 'Download as Word document with tracked changes' : 'Accept or propose changes to enable download'}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {isExporting ? 'Exporting...' : 'Download DOCX'}
      </button>

      {showDisclaimer && !isExporting && (
        <div className="absolute right-0 top-full mt-2 w-80 p-3 bg-white rounded-lg border border-slate-200 shadow-lg z-50 text-xs text-slate-500">
          <p className="font-semibold text-red-600 mb-1.5">
            This document will NOT match your original formatting
          </p>
          <p>
            The download generates a clean, standard contract layout with tracked changes (redline). Fonts, margins, headers, and any custom styling from your original document will not be preserved.
          </p>
          <p className="mt-1.5 font-medium text-slate-700">
            To keep your original formatting, <strong>copy the clause changes directly from this tool and paste them into your original document</strong> instead.
          </p>
        </div>
      )}

      {error && (
        <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}