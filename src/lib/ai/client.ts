import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Use explicit version ID for Sonnet 4.5 (more widely available)
export const MODEL = 'claude-sonnet-4-5-20250929';

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}

export async function generateJsonCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const response = await generateCompletion(systemPrompt, userPrompt);

  // Extract JSON from response (handle potential markdown code blocks)
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                    response.match(/```\s*([\s\S]*?)\s*```/) ||
                    [null, response];

  const jsonStr = jsonMatch[1] || response;

  try {
    return JSON.parse(jsonStr.trim()) as T;
  } catch {
    console.error('Failed to parse JSON response:', response);
    throw new Error('Invalid JSON response from Claude');
  }
}