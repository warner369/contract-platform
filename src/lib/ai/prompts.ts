import type { Clause, ParsedContract, ClauseAnalysis } from '@/types/contract';

export const PARSE_SYSTEM_PROMPT = `You are a legal contract analyst. Your job is to parse contracts into structured data.

You MUST respond with valid JSON only. No explanations before or after.

For each clause, identify:
1. A unique ID (format: "clause-N" where N is sequential)
2. The clause number as it appears in the document
3. A descriptive title
4. The full clause text
5. A category (definitions, payment, liability, termination, ip, confidentiality, indemnity, force_majeure, dispute_resolution, general, other)
6. Cross-references to other clauses (by their IDs)
7. A risk level (low, medium, high) based on how favourable/standard the terms are
8. Brief risk notes explaining any concerns

The summary should capture the key points and overall nature of the agreement.
List all parties identified in the contract.`;

export function createParsePrompt(contractText: string): string {
  return `Parse this contract into structured JSON:

${contractText}

Return a JSON object with this structure:
{
  "title": "Contract title",
  "summary": "Brief summary of key points",
  "parties": ["Party A", "Party B"],
  "clauses": [
    {
      "id": "clause-1",
      "number": "1",
      "title": "Definitions",
      "text": "Full clause text...",
      "category": "definitions",
      "references": ["clause-5"],
      "riskLevel": "low",
      "riskNotes": "Standard definitions clause"
    }
  ]
}`;
}

export const ANALYSE_SYSTEM_PROMPT = `You are a legal contract analyst providing plain-language explanations.

Explain what each clause means in simple terms that a non-lawyer can understand.
Identify potential risks or concerns from the user's perspective.
Map dependencies to other clauses and explain why they're related.

You MUST respond with valid JSON only.`;

export function createAnalysePrompt(
  clause: Clause,
  contractContext: string,
  userContext?: string,
): string {
  return `Analyse this clause from a contract.

Clause ${clause.number}: ${clause.title}
"${clause.text}"

Contract context: This is from "${contractContext}".
${userContext ? `User context: ${userContext}` : ''}

Provide analysis as JSON:
{
  "explanation": "Plain-language explanation of what this clause means",
  "risks": ["Risk 1", "Risk 2"],
  "opportunities": ["Potential benefit 1"],
  "relatedClauses": [
    {
      "clauseId": "clause-5",
      "relationship": "This clause modifies the liability cap defined in clause 5"
    }
  ],
  "recommendations": ["Consider requesting X"]
}`;
}

export const SUGGEST_SYSTEM_PROMPT = `You are a legal contract negotiation assistant.

When users express an intent, you suggest specific clause language changes.
Always present suggestions as proposals that the user must explicitly accept.
Never modify text automatically.

You MUST respond with valid JSON only.`;

export function createSuggestPrompt(
  clause: Clause,
  userIntent: string,
  contractContext: string,
): string {
  return `The user wants to negotiate this clause.

Original clause ${clause.number}: ${clause.title}
"${clause.text}"

User's intent: "${userIntent}"
Contract context: "${contractContext}"

Suggest specific changes as JSON:
{
  "suggestions": [
    {
      "type": "modify",
      "originalText": "the specific text to change",
      "suggestedText": "the replacement text",
      "rationale": "Why this change addresses the user's intent"
    }
  ],
  "alternatives": [
    {
      "text": "Alternative clause text option",
      "pros": ["Advantage 1"],
      "cons": ["Disadvantage 1"]
    }
  ],
  "negotiationTips": ["Tip 1", "Tip 2"]
}`;
}

export type ParseResponse = ParsedContract;
export type AnalyseResponse = ClauseAnalysis;
export type SuggestResponse = {
  suggestions: Array<{
    type: 'modify' | 'add' | 'remove';
    originalText: string;
    suggestedText: string;
    rationale: string;
  }>;
  alternatives: Array<{
    text: string;
    pros: string[];
    cons: string[];
  }>;
  negotiationTips: string[];
};