import { NextRequest, NextResponse } from 'next/server';
import { generateJsonCompletion } from '@/lib/ai/client';
import {
  ANALYSE_SYSTEM_PROMPT,
  createAnalysePrompt,
} from '@/lib/ai/prompts';
import type { Clause, ClauseAnalysis } from '@/types/contract';

// Cloudflare Workers compatibility via OpenNext adapter
export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const { clause, contractTitle, userContext } = body as {
      clause: Clause;
      contractTitle: string;
      userContext?: string;
    };

    if (!clause || !contractTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: clause and contractTitle' },
        { status: 400 },
      );
    }

    const analysis = await generateJsonCompletion<ClauseAnalysis>(
      ANALYSE_SYSTEM_PROMPT,
      createAnalysePrompt(clause, contractTitle, userContext),
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analyse clause error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyse clause' },
      { status: 500 },
    );
  }
}