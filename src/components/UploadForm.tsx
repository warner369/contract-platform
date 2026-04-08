'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadArea from './UploadArea';
import type { ParsedContract } from '@/types/contract';

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
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch('/api/parse', { method: 'POST', body: formData });
      } else {
        response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to analyse contract');
      }

      const contract = data as ParsedContract;

      // Store in sessionStorage for the contract page to retrieve
      // The ContractProvider will handle state management after navigation
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