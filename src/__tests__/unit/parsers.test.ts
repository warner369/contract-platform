import { describe, it, expect, vi } from 'vitest';
import { extractText } from '@/lib/parsers';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'Extracted text from docx' }),
  },
}));

describe('extractText', () => {
  it('throws for unsupported MIME types', async () => {
    await expect(
      extractText(Buffer.from(''), 'text/plain'),
    ).rejects.toThrow('Unsupported file type');
  });

  it('throws for PDF MIME type (handled client-side)', async () => {
    await expect(
      extractText(Buffer.from(''), 'application/pdf'),
    ).rejects.toThrow('Unsupported file type');
  });

  it('routes DOCX MIME type to docx parser', async () => {
    const result = await extractText(
      Buffer.from('fake'),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(result).toBe('Extracted text from docx');
  });

  it('routes legacy Word MIME type to docx parser', async () => {
    const result = await extractText(
      Buffer.from('fake'),
      'application/msword',
    );
    expect(result).toBe('Extracted text from docx');
  });
});