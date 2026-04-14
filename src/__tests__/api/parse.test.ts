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

describe('POST /api/parse', () => {
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
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
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

  it('returns parsed contract as JSON for valid text body', async () => {
    mockGenerateJsonCompletion.mockResolvedValueOnce(sampleContract);
    const req = new NextRequest('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: longText }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');

    const body = (await res.json()) as { contract?: { title?: string } };
    expect(body.contract?.title).toBe(sampleContract.title);
  });

  it('returns parsed contract as JSON for DOCX file upload', async () => {
    const extractedText =
      'Extracted text from a DOCX file that is long enough to pass the minimum length check for parsing contracts';
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
    expect(res.status).toBe(200);

    const body = (await res.json()) as { contract?: { title?: string } };
    expect(body.contract?.title).toBe(sampleContract.title);
    expect(mockExtractText).toHaveBeenCalled();
  });

  it('returns 500 with error payload when AI throws', async () => {
    mockGenerateJsonCompletion.mockRejectedValueOnce(new Error('Something went wrong'));
    const req = new NextRequest('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: longText }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('Something went wrong');
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
