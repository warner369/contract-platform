import { NextRequest, NextResponse } from 'next/server';
import { generateJsonCompletion } from '@/lib/ai/client';
import {
  SUGGEST_SYSTEM_PROMPT,
  createSuggestPrompt,
} from '@/lib/ai/prompts';
import type { Clause, SuggestResponse } from '@/types/contract';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const { clause, userIntent, contractTitle } = body as {
      clause: Clause;
      userIntent: string;
      contractTitle: string;
    };

    if (!clause || !userIntent || !contractTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: clause, userIntent, and contractTitle' },
        { status: 400 },
      );
    }

    const suggestions = await generateJsonCompletion<SuggestResponse>(
      SUGGEST_SYSTEM_PROMPT,
      createSuggestPrompt(clause, userIntent, contractTitle),
    );

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Suggest change error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 },
    );
  }
}