import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/parsers';
import { generateJsonCompletion } from '@/lib/ai/client';
import {
  PARSE_SYSTEM_PROMPT,
  createParsePrompt,
} from '@/lib/ai/prompts';
import type { ParsedContract } from '@/types/contract';

export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') || '';
    let text: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 },
        );
      }

      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'PDF files must be uploaded as extracted text. Please use the text paste option for PDFs.' },
          { status: 400 },
        );
      }

      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 20MB.' },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractText(buffer, file.type);
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!body.text || typeof body.text !== 'string') {
        return NextResponse.json(
          { error: 'No text provided in request body' },
          { status: 400 },
        );
      }
      text = body.text;
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 },
      );
    }

    if (text.length < 100) {
      return NextResponse.json(
        { error: 'Contract text is too short. Please provide a complete contract.' },
        { status: 400 },
      );
    }

    const contract = await generateJsonCompletion<ParsedContract>(
      PARSE_SYSTEM_PROMPT,
      createParsePrompt(text),
    );

    if (!contract.title || !contract.clauses || !Array.isArray(contract.clauses)) {
      return NextResponse.json(
        { error: 'Failed to parse contract structure' },
        { status: 500 },
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Parse error:', error);

    if (error instanceof Error) {
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          { error: 'API configuration error. Please check server configuration.' },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while parsing the contract' },
      { status: 500 },
    );
  }
}