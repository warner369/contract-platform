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

describe('POST /api/analyse-clause', () => {
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
    const body = await res.json();
    expect(body.error).toContain('Missing required fields');
  });

  it('returns 400 when contractTitle is missing', async () => {
    const req = new NextRequest('http://localhost/api/analyse-clause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clause: sampleClause }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid clause and contractTitle', async () => {
    mockGenerateJsonCompletion.mockResolvedValueOnce(sampleAnalysis);
    const req = new NextRequest('http://localhost/api/analyse-clause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clause: sampleClause, contractTitle: 'Test Contract' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.explanation).toBeDefined();
  });

  it('passes userContext through when provided', async () => {
    mockGenerateJsonCompletion.mockResolvedValueOnce(sampleAnalysis);
    const req = new NextRequest('http://localhost/api/analyse-clause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clause: sampleClause,
        contractTitle: 'Test Contract',
        userContext: 'I am a small business owner',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockGenerateJsonCompletion).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when AI throws an error', async () => {
    mockGenerateJsonCompletion.mockRejectedValueOnce(new Error('API error'));
    const req = new NextRequest('http://localhost/api/analyse-clause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clause: sampleClause, contractTitle: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});