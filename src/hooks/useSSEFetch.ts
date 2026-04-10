'use client';

import { useState, useCallback, useRef } from 'react';
import type { SSEEvent } from '@/lib/sse';

interface UseSSEFetchResult<T> {
  data: T | null;
  phase: string | null;
  message: string | null;
  error: string | null;
  isLoading: boolean;
  start: (url: string, body: unknown) => Promise<T | null>;
}

export function useSSEFetch<T>(): UseSSEFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (url: string, body: unknown): Promise<T | null> => {
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    setData(null);
    setPhase(null);
    setMessage(null);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let result: T | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6);
            try {
              const event: SSEEvent = JSON.parse(jsonStr);
              if (event.phase === 'error') {
                setError(event.message);
                setIsLoading(false);
                return null;
              }
              if (event.phase === 'complete' && event.data !== undefined) {
                result = event.data as T;
                setData(result);
                setPhase('complete');
                setMessage(event.message);
              } else {
                setPhase(event.phase);
                setMessage(event.message);
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim().startsWith('data: ')) {
          const jsonStr = buffer.trim().slice(6);
          try {
            const event: SSEEvent = JSON.parse(jsonStr);
            if (event.phase === 'complete' && event.data !== undefined) {
              result = event.data as T;
              setData(result);
              setPhase('complete');
              setMessage(event.message);
            } else if (event.phase === 'error') {
              setError(event.message);
            }
          } catch {
            // Skip malformed trailing data
          }
        }

        setIsLoading(false);
        return result;
      } else {
        // Non-SSE response (e.g., a validation error)
        const json = (await response.json()) as Record<string, unknown>;
        if (!response.ok) {
          setError((json.error || json.message || `Error: ${response.status}`) as string);
          setIsLoading(false);
          return null;
        }
        // If it's JSON and OK, treat as immediate complete
        setData(json as T);
        setPhase('complete');
        setMessage('Complete');
        setIsLoading(false);
        return json as T;
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return null;
      }
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
      return null;
    }
  }, []);

  return { data, phase, message, error, isLoading, start };
}