// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/ai/client', () => ({
  generateJsonCompletion: vi.fn(),
  generateCompletion: vi.fn(),
  MODEL: 'claude-sonnet-4-5-20250929',
}));

vi.mock('@/lib/parsers', () => ({
  extractText: vi.fn(),
}));

import { POST } from '@/app/api/parse/route';
import { generateJsonCompletion } from '@/lib/ai/client';
import { extractText } from '@/lib/parsers';
import { sampleContract } from '../mocks/contract-data';

const mockGenerateJsonCompletion = vi.mocked(generateJsonCompletion);
const mockExtractText = vi.mocked(extractText);

const longText = 'A'.repeat(200);

async function readSSE(response: Response): Promise<{ events: Array<{ phase: string; message: string; data?: unknown }> }> {
  const text = await response.text();
  const events: Array<{ phase: string; message: string; data?: unknown }> = [];

  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    try {
      const event = JSON.parse(line.slice(6));
      events.push(event);
    } catch {
      // skip malformed lines
    }
  }

  return { events };
}

describe('POST /api/parse (SSE)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for JSON body with no text', async () => {
    const req = new NextRequest('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    // Validation errors return plain JSON, not SSE
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No text provided');
  });

  it('returns 400 when text is too short', async () => {
    const req = new NextRequest('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'short' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for PDF file uploads', async () => {
    const formData = new FormData();
    const pdfFile = new File(['fake pdf'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', pdfFile);
    const req = new NextRequest('http://localhost/api/parse', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when multipart form data has no file', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://localhost/api/parse', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns SSE stream with phases for valid JSON text', async () => {
    mockGenerateJsonCompletion.mockResolvedValueOnce(sampleContract);
    const req = new NextRequest('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: longText }),
    });
    const res = await POST(req);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const { events } = await readSSE(res);
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0].phase).toBe('upload');
    expect(events.some((e) => e.phase === 'analysing')).toBe(true);
    expect(events.some((e) => e.phase === 'complete')).toBe(true);

    const completeEvent = events.find((e) => e.phase === 'complete');
    expect(completeEvent?.data).toBeDefined();
    const contractData = completeEvent?.data as Record<string, unknown> | undefined;
    expect(contractData?.title).toBe(sampleContract.title);
  });

  it('returns SSE stream with phases for DOCX file upload', async () => {
    const extractedText = 'Extracted text from a DOCX file that is long enough to pass the minimum length check for parsing contracts';
    mockExtractText.mockResolvedValueOnce(extractedText);
    mockGenerateJsonCompletion.mockResolvedValueOnce(sampleContract);

    const formData = new FormData();
    const docxFile = new File([Buffer.from('fake')], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    formData.append('file', docxFile);

    const req = new NextRequest('http://localhost/api/parse', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const { events } = await readSSE(res);
    expect(events.some((e) => e.phase === 'upload')).toBe(true);
    expect(events.some((e) => e.phase === 'extracting')).toBe(true);
    expect(events.some((e) => e.phase === 'analysing')).toBe(true);
    expect(events.some((e) => e.phase === 'complete')).toBe(true);
  });

  it('returns SSE error event when AI throws', async () => {
    mockGenerateJsonCompletion.mockRejectedValueOnce(new Error('Something went wrong'));
    const req = new NextRequest('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: longText }),
    });
    const res = await POST(req);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const { events } = await readSSE(res);
    expect(events.some((e) => e.phase === 'error')).toBe(true);
  });

  it('returns 400 for unsupported content type', async () => {
    const req = new NextRequest('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'some text',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});