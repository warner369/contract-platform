'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import UploadArea from './UploadArea';
import { useAuth } from '@/components/providers/AuthProvider';
import { DEFAULT_FEEDBACK_MODE, type FeedbackMode } from '@/lib/feedback-mode';
import type { ParsedContract } from '@/types/contract';

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(pageText);
  }

  return pages.join('\n\n').replace(/\s+/g, ' ').trim();
}

const PARSE_PHASES = [
  { phase: 'upload', label: 'Upload successful' },
  { phase: 'extracting', label: 'Extracting text from document...' },
  { phase: 'analysing', label: 'Analyzing contract structure...' },
  { phase: 'saving', label: 'Saving contract...' },
  { phase: 'complete', label: 'Analysis complete' },
];

export default function UploadForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [phase, setPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleUpload = async (
    file: File | null,
    text: string | null,
    feedbackMode: FeedbackMode = DEFAULT_FEEDBACK_MODE,
  ) => {
    setIsLoading(true);
    setError(null);
    setPhase('upload');

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      let response: Response;

      if (file) {
        if (file.type === 'application/pdf') {
          setPhase('extracting');
          const extractedText = await extractPdfText(file);
          if (!extractedText || extractedText.length < 50) {
            throw new Error(
              'Could not extract text from PDF. The file may contain only images. Try pasting the text instead.',
            );
          }
          setPhase('analysing');
          response = await fetch('/api/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: extractedText, feedbackMode }),
            signal: abortController.signal,
          });
        } else {
          setPhase('extracting');
          const formData = new FormData();
          formData.append('file', file);
          formData.append('feedbackMode', feedbackMode);
          setPhase('analysing');
          response = await fetch('/api/parse', {
            method: 'POST',
            body: formData,
            signal: abortController.signal,
          });
        }
      } else if (text) {
        setPhase('analysing');
        response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, feedbackMode }),
          signal: abortController.signal,
        });
      } else {
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Failed to analyse contract (${response.status})`);
      }

      const parsed = (await response.json()) as { contract: ParsedContract };
      if (!parsed.contract) {
        throw new Error('Invalid response from parse endpoint');
      }

      setPhase('saving');
      const saveRes = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: parsed.contract, feedbackMode }),
      });
      const saved = (await saveRes.json()) as { id?: string; error?: string };
      if (!saveRes.ok || saved.error) {
        throw new Error(saved.error || `Save failed (${saveRes.status})`);
      }

      setPhase('complete');
      router.push(`/contracts/${saved.id}`);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
      setPhase(null);
    }
  };

  if (isLoading || phase) {
    const currentPhaseIndex = PARSE_PHASES.findIndex((p) => p.phase === phase);

    return (
      <div className="w-full max-w-2xl mx-auto py-10 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
        <div className="w-full max-w-sm space-y-2">
          {PARSE_PHASES.map((p, i) => {
            const phaseState: 'completed' | 'current' | 'upcoming' =
              currentPhaseIndex < 0
                ? 'upcoming'
                : i < currentPhaseIndex
                ? 'completed'
                : i === currentPhaseIndex
                ? 'current'
                : 'upcoming';

            return (
              <div key={p.phase} className="flex items-center gap-3">
                {phaseState === 'completed' && (
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {phaseState === 'current' && (
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin flex-shrink-0" />
                )}
                {phaseState === 'upcoming' && (
                  <div className="w-4 h-4 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    phaseState === 'completed'
                      ? 'text-emerald-600'
                      : phaseState === 'current'
                      ? 'text-slate-700 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <UploadArea onUpload={handleUpload} userPlan={user?.plan ?? 'free'} />
      {error && (
        <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
