import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Haiku 4.5 — fast enough to fit inside Cloudflare Workers wall-clock limits.
export const MODEL = 'claude-haiku-4-5-20251001';

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 8192,
): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  if (message.stop_reason === 'max_tokens') {
    throw new Error(
      'The document is too large for the AI to process in a single response. ' +
      'Please try uploading a shorter contract or breaking it into smaller sections.',
    );
  }

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}

function coerceJsonStrings(value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(coerceJsonStrings);
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = coerceJsonStrings(val);
    }
    return result;
  }
  return String(value);
}

export async function generateJsonCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 8192,
): Promise<T> {
  const response = await generateCompletion(systemPrompt, userPrompt, maxTokens);

  // Extract JSON from response (handle potential markdown code blocks)
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                    response.match(/```\s*([\s\S]*?)\s*```/) ||
                    [null, response];

  const jsonStr = jsonMatch[1] || response;

  try {
    const parsed = JSON.parse(jsonStr.trim()) as T;
    return coerceJsonStrings(parsed) as T;
  } catch {
    console.error('Failed to parse JSON response:', response);
    throw new Error('Invalid JSON response from Claude');
  }
}