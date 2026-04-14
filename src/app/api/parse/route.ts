import { NextRequest } from 'next/server';
import { extractText } from '@/lib/parsers';
import { generateJsonCompletion } from '@/lib/ai/client';
import {
  PARSE_SYSTEM_PROMPT,
  createParsePrompt,
} from '@/lib/ai/prompts';
import { isFeedbackMode, DEFAULT_FEEDBACK_MODE, type FeedbackMode } from '@/lib/feedback-mode';
import type { ParsedContract } from '@/types/contract';

export const maxDuration = 60;

function errorResponse(message: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const contentType = request.headers.get('content-type') || '';
    let text: string;
    let feedbackMode: FeedbackMode = DEFAULT_FEEDBACK_MODE;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const rawMode = formData.get('feedbackMode');
      if (isFeedbackMode(rawMode)) feedbackMode = rawMode;

      if (!file) {
        return errorResponse('No file provided', 400);
      }

      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (!allowedTypes.includes(file.type)) {
        return errorResponse(
          'PDF files must be uploaded as extracted text. Please use the text paste option for PDFs.',
          400,
        );
      }

      if (file.size > 20 * 1024 * 1024) {
        return errorResponse('File too large. Maximum size is 20MB.', 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractText(buffer, file.type);
    } else if (contentType.includes('application/json')) {
      const body = (await request.json()) as { text?: string; feedbackMode?: string };
      if (!body.text || typeof body.text !== 'string') {
        return errorResponse('No text provided in request body', 400);
      }
      text = body.text;
      if (isFeedbackMode(body.feedbackMode)) feedbackMode = body.feedbackMode;
    } else {
      return errorResponse('Unsupported content type', 400);
    }

    if (text.length < 100) {
      return errorResponse('Contract text is too short. Please provide a complete contract.', 400);
    }

    const contract = await generateJsonCompletion<ParsedContract>(
      PARSE_SYSTEM_PROMPT,
      createParsePrompt(text, feedbackMode),
    );

    if (!contract.title || !contract.clauses || !Array.isArray(contract.clauses)) {
      return errorResponse('Failed to parse contract structure', 500);
    }

    return jsonResponse({ contract });
  } catch (error) {
    console.error('Parse error:', error);
    if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
      return errorResponse('API configuration error. Please check server configuration.', 500);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred while parsing the contract',
      500,
    );
  }
}
