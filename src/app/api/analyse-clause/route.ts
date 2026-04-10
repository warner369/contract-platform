import { NextRequest } from 'next/server';
import { generateJsonCompletion } from '@/lib/ai/client';
import {
  ANALYSE_SYSTEM_PROMPT,
  createAnalysePrompt,
} from '@/lib/ai/prompts';
import { createSSEResponse, sseError, startHeartbeat } from '@/lib/sse';
import type { Clause, ClauseAnalysis } from '@/types/contract';

export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();

    const { clause, contractTitle, userContext } = body as {
      clause: Clause;
      contractTitle: string;
      userContext?: string;
    };

    if (!clause || !contractTitle) {
      return sseError('Missing required fields: clause and contractTitle', 400);
    }

    return createSSEResponse(async (send) => {
      send('received', 'Analyzing clause...');
      send('analysing', 'Generating analysis...');

      const stopHeartbeat = startHeartbeat(send);
      let analysis: ClauseAnalysis;
      try {
        analysis = await generateJsonCompletion<ClauseAnalysis>(
          ANALYSE_SYSTEM_PROMPT,
          createAnalysePrompt(clause, contractTitle, userContext),
        );
      } finally {
        stopHeartbeat();
      }

      send('complete', 'Analysis complete', analysis);
    });
  } catch (error) {
    console.error('Analyse clause error:', error);
    return sseError(
      error instanceof Error ? error.message : 'Failed to analyse clause',
      500,
    );
  }
}