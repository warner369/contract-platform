import { NextRequest } from 'next/server';
import { generateJsonCompletion } from '@/lib/ai/client';
import {
  SUGGEST_SYSTEM_PROMPT,
  createSuggestPrompt,
} from '@/lib/ai/prompts';
import { createSSEResponse, sseError, startHeartbeat } from '@/lib/sse';
import type { Clause, SuggestResponse } from '@/types/contract';

export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();

    const { clause, userIntent, contractTitle } = body as {
      clause: Clause;
      userIntent: string;
      contractTitle: string;
    };

    if (!clause || !userIntent || !contractTitle) {
      return sseError('Missing required fields: clause, userIntent, and contractTitle', 400);
    }

    return createSSEResponse(async (send) => {
      send('received', 'Generating suggestions...');
      send('generating', 'Crafting proposed changes...');

      const stopHeartbeat = startHeartbeat(send);
      let suggestions: SuggestResponse;
      try {
        suggestions = await generateJsonCompletion<SuggestResponse>(
          SUGGEST_SYSTEM_PROMPT,
          createSuggestPrompt(clause, userIntent, contractTitle),
        );
      } finally {
        stopHeartbeat();
      }

      send('complete', 'Suggestions ready', suggestions);
    });
  } catch (error) {
    console.error('Suggest change error:', error);
    return sseError(
      error instanceof Error ? error.message : 'Failed to generate suggestions',
      500,
    );
  }
}