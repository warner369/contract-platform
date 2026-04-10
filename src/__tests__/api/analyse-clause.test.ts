// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/ai/client', () => ({
  generateJsonCompletion: vi.fn(),
  generateCompletion: vi.fn(),
  MODEL: 'claude-sonnet-4-5-20250929',
}));

import { POST } from '@/app/api/analyse-clause/route';
import { generateJsonCompletion } from '@/lib/ai/client';
import { sampleClause, sampleAnalysis } from '../mocks/contract-data';

const mockGenerateJsonCompletion = vi.mocked(generateJsonCompletion);

async function readSSE(response: Response): Promise<Array<{ phase: string; message: string; data?: unknown }>> {
  const text = await response.text();
  const events: Array<{ phase: string; message: string; data?: unknown }> = [];
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    try {
      events.push(JSON.parse(line.slice(6)));
    } catch { /* skip */ }
  }
  return events;
}

describe('POST /api/analyse-clause (SSE)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when clause is missing', async () => {
    const req = new NextRequest('http://localhost/api/analyse-clause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractTitle: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns SSE stream with phases for valid request', async () => {
    mockGenerateJsonCompletion.mockResolvedValueOnce(sampleAnalysis);
    const req = new NextRequest('http://localhost/api/analyse-clause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clause: sampleClause, contractTitle: 'Test Contract' }),
    });
    const res = await POST(req);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const events = await readSSE(res);
    expect(events.some((e) => e.phase === 'received')).toBe(true);
    expect(events.some((e) => e.phase === 'analysing')).toBe(true);
    expect(events.some((e) => e.phase === 'complete')).toBe(true);

    const completeEvent = events.find((e) => e.phase === 'complete');
    expect(completeEvent?.data).toBeDefined();
  });

  it('returns SSE error event when AI throws', async () => {
    mockGenerateJsonCompletion.mockRejectedValueOnce(new Error('API error'));
    const req = new NextRequest('http://localhost/api/analyse-clause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clause: sampleClause, contractTitle: 'Test' }),
    });
    const res = await POST(req);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const events = await readSSE(res);
    expect(events.some((e) => e.phase === 'error')).toBe(true);
  });
});