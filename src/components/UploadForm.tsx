'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadArea from './UploadArea';
import type { ParsedContract } from '@/types/contract';

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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

export default function UploadForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File | null, text: string | null) => {
    setIsLoading(true);
    setError(null);

    try {
      let response: Response;

      if (file) {
        if (file.type === 'application/pdf') {
          const extractedText = await extractPdfText(file);
          if (!extractedText || extractedText.length < 50) {
            throw new Error('Could not extract text from PDF. The file may contain only images. Try pasting the text instead.');
          }
          response = await fetch('/api/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: extractedText }),
          });
        } else {
          const formData = new FormData();
          formData.append('file', file);
          response = await fetch('/api/parse', { method: 'POST', body: formData });
        }
      } else if (text) {
        response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      } else {
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to analyse contract');
      }

      const contract = data as ParsedContract;

      sessionStorage.setItem('contract', JSON.stringify(contract));
      router.push('/contract');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-10 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">Analysing your contract…</p>
          <p className="text-xs text-slate-400 mt-1">This usually takes 10–30 seconds</p>
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