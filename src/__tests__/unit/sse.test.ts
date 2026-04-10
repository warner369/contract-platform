import { describe, it, expect, vi } from 'vitest';
import { createSSEResponse, sseError, startHeartbeat } from '@/lib/sse';

describe('createSSEResponse', () => {
  it('emits phase events and completes with data', async () => {
    const response = createSSEResponse(async (send) => {
      send('started', 'Starting...');
      send('processing', 'Working...');
      send('complete', 'Done', { result: 42 });
    });

    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');

    const text = await response.text();
    const events = text.split('\n\n').filter(Boolean).map((line) => {
      const data = line.replace(/^data: /, '');
      return JSON.parse(data);
    });

    expect(events).toHaveLength(3);
    expect(events[0].phase).toBe('started');
    expect(events[0].message).toBe('Starting...');
    expect(events[1].phase).toBe('processing');
    expect(events[1].message).toBe('Working...');
    expect(events[2].phase).toBe('complete');
    expect(events[2].message).toBe('Done');
    expect(events[2].data).toEqual({ result: 42 });
  });

  it('emits error event when handler throws', async () => {
    const response = createSSEResponse(async () => {
      throw new Error('Something went wrong');
    });

    const text = await response.text();
    const events = text.split('\n\n').filter(Boolean).map((line) => {
      const data = line.replace(/^data: /, '');
      return JSON.parse(data);
    });

    expect(events).toHaveLength(1);
    expect(events[0].phase).toBe('error');
    expect(events[0].message).toBe('Something went wrong');
  });

  it('handles empty phases', async () => {
    const response = createSSEResponse(async (send) => {
      send('complete', 'Done', { data: 'test' });
    });

    const text = await response.text();
    const events = text.split('\n\n').filter(Boolean).map((line) => {
      const data = line.replace(/^data: /, '');
      return JSON.parse(data);
    });

    expect(events).toHaveLength(1);
    expect(events[0].phase).toBe('complete');
  });
});

describe('startHeartbeat', () => {
  it('sends heartbeat events at the specified interval', () => {
    vi.useFakeTimers();
    const events: Array<{ phase: string; message: string }> = [];
    const send = (phase: string, message: string) => {
      events.push({ phase, message });
    };

    const stop = startHeartbeat(send);

    expect(events).toHaveLength(0);

    vi.advanceTimersByTime(15_000);
    expect(events).toHaveLength(1);
    expect(events[0].phase).toBe('heartbeat');
    expect(events[0].message).toBe('Still processing...');

    vi.advanceTimersByTime(15_000);
    expect(events).toHaveLength(2);

    stop();

    vi.advanceTimersByTime(30_000);
    expect(events).toHaveLength(2);

    vi.useRealTimers();
  });

  it('stops sending heartbeats when stop is called', () => {
    vi.useFakeTimers();
    const events: Array<{ phase: string; message: string }> = [];
    const send = (phase: string, message: string) => {
      events.push({ phase, message });
    };

    const stop = startHeartbeat(send);
    vi.advanceTimersByTime(15_000);
    expect(events).toHaveLength(1);

    stop();

    vi.advanceTimersByTime(60_000);
    expect(events).toHaveLength(1);

    vi.useRealTimers();
  });
});

describe('sseError', () => {
  it('returns JSON error response with status', () => {
    const response = sseError('Bad request', 400);
    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('defaults to status 500', () => {
    const response = sseError('Server error');
    expect(response.status).toBe(500);
  });
});