export interface SSEEvent {
  phase: string;
  message: string;
  data?: unknown;
}

export type SSESender = (phase: string, message: string, data?: unknown) => void;

const encoder = new TextEncoder();

const HEARTBEAT_INTERVAL_MS = 15_000;

export function startHeartbeat(send: SSESender): () => void {
  const id = setInterval(() => {
    send('heartbeat', 'Still processing...');
  }, HEARTBEAT_INTERVAL_MS);
  return () => clearInterval(id);
}

export function createSSEResponse(
  handler: (send: SSESender) => Promise<void>,
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const send: SSESender = (phase, message, data) => {
        const event: SSEEvent = { phase, message, data };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        await handler(send);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ phase: 'error', message: errMsg })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

export function sseError(message: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Fetch a POST endpoint that returns SSE events and parse them.
 * Returns the data from the 'complete' event.
 * Calls onPhase for each intermediate phase event.
 */
export async function fetchSSE<T>(
  url: string,
  body: unknown,
  onPhase?: (phase: string, message: string) => void,
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream') && response.body) {
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
        try {
          const event: SSEEvent = JSON.parse(line.slice(6));
          if (event.phase === 'error') {
            throw new Error(event.message);
          }
          if (event.phase === 'complete' && event.data !== undefined) {
            result = event.data as T;
          }
          onPhase?.(event.phase, event.message);
        } catch (e) {
          if (e instanceof Error) throw e;
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      try {
        const event: SSEEvent = JSON.parse(buffer.trim().slice(6));
        if (event.phase === 'complete' && event.data !== undefined) {
          result = event.data as T;
        }
        if (event.phase === 'error') {
          throw new Error(event.message);
        }
        onPhase?.(event.phase, event.message);
      } catch (e) {
        if (e instanceof Error) throw e;
      }
    }

    if (result === null) {
      throw new Error('No response received from server');
    }
    return result;
  }

  // Fallback: non-SSE response (e.g., validation error)
  if (!response.ok) {
    const data = (await response.json().catch(() => ({ error: `Error: ${response.status}` }))) as Record<string, unknown>;
    throw new Error((data.error as string) || `Error: ${response.status}`);
  }

  return response.json();
}