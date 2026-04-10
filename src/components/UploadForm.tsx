'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import UploadArea from './UploadArea';
import type { ParsedContract } from '@/types/contract';
import type { SSEEvent } from '@/lib/sse';

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
  { phase: 'upload', label: 'Upload successful', icon: 'check' as const },
  { phase: 'extracting', label: 'Extracting text from document...', icon: 'spinner' as const },
  { phase: 'analysing', label: 'Analyzing contract structure...', icon: 'spinner' as const },
  { phase: 'structuring', label: 'Building clause map...', icon: 'spinner' as const },
  { phase: 'saving', label: 'Saving contract...', icon: 'spinner' as const },
  { phase: 'complete', label: 'Analysis complete', icon: 'check' as const },
];

export default function UploadForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleUpload = async (file: File | null, text: string | null) => {
    setIsLoading(true);
    setError(null);
    setPhase('upload');

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      let body: string;
      let fetchUrl: string;

      if (file) {
        if (file.type === 'application/pdf') {
          setPhase('extracting');
          const extractedText = await extractPdfText(file);
          if (!extractedText || extractedText.length < 50) {
            throw new Error('Could not extract text from PDF. The file may contain only images. Try pasting the text instead.');
          }
          body = JSON.stringify({ text: extractedText });
          fetchUrl = '/api/parse';
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/parse', {
            method: 'POST',
            body: formData,
            signal: abortController.signal,
          });

          if (!response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/event-stream')) {
              // SSE error — read the stream
              const reader = response.body!.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                  if (!line.startsWith('data: ')) continue;
                  try {
                    const event: SSEEvent = JSON.parse(line.slice(6));
                    if (event.phase === 'error') {
                      throw new Error(event.message);
                    }
                  } catch (e) {
                    if (e instanceof Error) throw e;
                  }
                }
              }
            } else {
              const data = (await response.json()) as { error?: string };
              throw new Error(data.error ?? 'Failed to analyse contract');
            }
            return;
          }

          // SSE response for file upload
          await handleSSEResponse(response);
          return;
        }
      } else if (text) {
        body = JSON.stringify({ text });
        fetchUrl = '/api/parse';
      } else {
        setIsLoading(false);
        return;
      }

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: abortController.signal,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream')) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const event: SSEEvent = JSON.parse(line.slice(6));
                if (event.phase === 'error') {
                  throw new Error(event.message);
                }
              } catch (e) {
                if (e instanceof Error) throw e;
              }
            }
          }
          throw new Error('Failed to analyse contract');
        } else {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? 'Failed to analyse contract');
        }
      }

      await handleSSEResponse(response);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  async function handleSSEResponse(response: Response) {
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event: SSEEvent = JSON.parse(line.slice(6));
          if (event.phase === 'error') {
            throw new Error(event.message);
          }
          setPhase(event.phase);
          if (event.phase === 'complete' && event.data !== undefined) {
            const contract = event.data as ParsedContract;
            setPhase('saving');
            try {
              const saveRes = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contract }),
              });
              const saved = await saveRes.json() as { id?: string; error?: string };
              if (!saveRes.ok || saved.error) {
                throw new Error(saved.error || 'Failed to save contract');
              }
              router.push(`/contracts/${saved.id}`);
            } catch (saveErr) {
              setError(saveErr instanceof Error ? saveErr.message : 'Failed to save contract');
              return;
            }
            return;
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'SyntaxError') throw e;
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      try {
        const event: SSEEvent = JSON.parse(buffer.trim().slice(6));
        if (event.phase === 'complete' && event.data !== undefined) {
          const contract = event.data as ParsedContract;
          setPhase('saving');
          try {
            const saveRes = await fetch('/api/contracts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contract }),
            });
            const saved = await saveRes.json() as { id?: string; error?: string };
            if (!saveRes.ok || saved.error) {
              throw new Error(saved.error || 'Failed to save contract');
            }
            router.push(`/contracts/${saved.id}`);
          } catch (saveErr) {
            setError(saveErr instanceof Error ? saveErr.message : 'Failed to save contract');
            return;
          }
          return;
        }
        if (event.phase === 'error') {
          throw new Error(event.message);
        }
      } catch (e) {
        if (e instanceof Error && e.message !== 'SyntaxError') throw e;
      }
    }
  }

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
      <UploadArea onUpload={handleUpload} />
      {error && (
        <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}