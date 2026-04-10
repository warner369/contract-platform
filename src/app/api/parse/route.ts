import { NextRequest } from 'next/server';
import { extractText } from '@/lib/parsers';
import { generateJsonCompletion } from '@/lib/ai/client';
import {
  PARSE_SYSTEM_PROMPT,
  createParsePrompt,
} from '@/lib/ai/prompts';
import { createSSEResponse, sseError, startHeartbeat } from '@/lib/sse';
import type { ParsedContract } from '@/types/contract';

export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<Response> {
  let text: string;

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return sseError('No file provided', 400);
      }

      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (!allowedTypes.includes(file.type)) {
        return sseError('PDF files must be uploaded as extracted text. Please use the text paste option for PDFs.', 400);
      }

      if (file.size > 20 * 1024 * 1024) {
        return sseError('File too large. Maximum size is 20MB.', 400);
      }

      return createSSEResponse(async (send) => {
        send('upload', 'Upload successful');

        send('extracting', 'Extracting text from document...');
        const buffer = Buffer.from(await file.arrayBuffer());
        const extractedText = await extractText(buffer, file.type);

        if (extractedText.length < 100) {
          throw new Error('Contract text is too short. Please provide a complete contract.');
        }

        send('analysing', 'Analyzing contract structure...');
        const stopHeartbeat = startHeartbeat(send);
        let contract: ParsedContract;
        try {
          contract = await generateJsonCompletion<ParsedContract>(
            PARSE_SYSTEM_PROMPT,
            createParsePrompt(extractedText),
          );
        } finally {
          stopHeartbeat();
        }

        if (!contract.title || !contract.clauses || !Array.isArray(contract.clauses)) {
          throw new Error('Failed to parse contract structure');
        }

        send('structuring', 'Building contract map...');
        send('complete', 'Analysis complete', contract);
      });
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!body.text || typeof body.text !== 'string') {
        return sseError('No text provided in request body', 400);
      }
      text = body.text;

      if (text.length < 100) {
        return sseError('Contract text is too short. Please provide a complete contract.', 400);
      }

      return createSSEResponse(async (send) => {
        send('upload', 'Upload successful');
        send('analysing', 'Analyzing contract structure...');

        const stopHeartbeat = startHeartbeat(send);
        let contract: ParsedContract;
        try {
          contract = await generateJsonCompletion<ParsedContract>(
            PARSE_SYSTEM_PROMPT,
            createParsePrompt(text),
          );
        } finally {
          stopHeartbeat();
        }

        if (!contract.title || !contract.clauses || !Array.isArray(contract.clauses)) {
          throw new Error('Failed to parse contract structure');
        }

        send('structuring', 'Building contract map...');
        send('complete', 'Analysis complete', contract);
      });
    } else {
      return sseError('Unsupported content type', 400);
    }
  } catch (error) {
    console.error('Parse error:', error);
    if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
      return sseError('API configuration error. Please check server configuration.', 500);
    }
    return sseError(
      error instanceof Error ? error.message : 'An unexpected error occurred while parsing the contract',
      500,
    );
  }
}