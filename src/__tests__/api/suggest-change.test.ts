// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/ai/client', () => ({
  generateJsonCompletion: vi.fn(),
  generateCompletion: vi.fn(),
  MODEL: 'claude-sonnet-4-5-20250929',
}));

import { POST } from '@/app/api/suggest-change/route';
import { generateJsonCompletion } from '@/lib/ai/client';
import { sampleClause, sampleSuggestResponse } from '../mocks/contract-data';

const mockGenerateJsonCompletion = vi.mocked(generateJsonCompletion);

describe('POST /api/suggest-change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when clause is missing', async () => {
    const req = new NextRequest('http://localhost/api/suggest-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIntent: 'change this', contractTitle: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing required fields');
  });

  it('returns 400 when userIntent is missing', async () => {
    const req = new NextRequest('http://localhost/api/suggest-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clause: sampleClause, contractTitle: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when contractTitle is missing', async () => {
    const req = new NextRequest('http://localhost/api/suggest-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clause: sampleClause, userIntent: 'change this' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid inputs', async () => {
    mockGenerateJsonCompletion.mockResolvedValueOnce(sampleSuggestResponse);
    const req = new NextRequest('http://localhost/api/suggest-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clause: sampleClause,
        userIntent: 'I want broader confidentiality protection',
        contractTitle: 'Test Contract',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions).toBeDefined();
    expect(body.suggestions.length).toBeGreaterThan(0);
  });

  it('returns 500 when AI throws an error', async () => {
    mockGenerateJsonCompletion.mockRejectedValueOnce(new Error('API error'));
    const req = new NextRequest('http://localhost/api/suggest-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clause: sampleClause,
        userIntent: 'change this',
        contractTitle: 'Test',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});