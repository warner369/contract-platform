import { describe, it, expect } from 'vitest';
import { createParsePrompt, createAnalysePrompt, createSuggestPrompt } from '@/lib/ai/prompts';
import type { Clause } from '@/types/contract';

describe('createParsePrompt', () => {
  it('includes the contract text', () => {
    const result = createParsePrompt('This is a contract');
    expect(result).toContain('This is a contract');
  });

  it('includes JSON structure guidance', () => {
    const result = createParsePrompt('some text');
    expect(result).toContain('"title"');
    expect(result).toContain('"clauses"');
    expect(result).toContain('"parties"');
  });
});

describe('createAnalysePrompt', () => {
  const clause: Clause = {
    id: 'clause-1',
    number: '3',
    title: 'Payment Terms',
    text: 'Payment is due within 30 days.',
    category: 'payment',
    references: [],
    riskLevel: 'low',
    riskNotes: '',
  };

  it('includes clause number, title, and text', () => {
    const result = createAnalysePrompt(clause, 'My Contract');
    expect(result).toContain('Clause 3: Payment Terms');
    expect(result).toContain('Payment is due within 30 days.');
  });

  it('includes contract context', () => {
    const result = createAnalysePrompt(clause, 'My Contract');
    expect(result).toContain('My Contract');
  });

  it('includes user context when provided', () => {
    const result = createAnalysePrompt(clause, 'My Contract', 'I am a small business');
    expect(result).toContain('I am a small business');
  });

  it('omits user context when not provided', () => {
    const result = createAnalysePrompt(clause, 'My Contract');
    expect(result).not.toContain('User context:');
  });
});

describe('createSuggestPrompt', () => {
  const clause: Clause = {
    id: 'clause-2',
    number: '5',
    title: 'Liability',
    text: 'Liability is limited to the contract value.',
    category: 'liability',
    references: [],
    riskLevel: 'high',
    riskNotes: 'Very restrictive',
  };

  it('includes clause details', () => {
    const result = createSuggestPrompt(clause, 'I want higher liability cap', 'Test Contract');
    expect(result).toContain('Original clause 5: Liability');
    expect(result).toContain('Liability is limited to the contract value.');
  });

  it('includes user intent', () => {
    const result = createSuggestPrompt(clause, 'I want higher liability cap', 'Test Contract');
    expect(result).toContain('I want higher liability cap');
  });

  it('includes contract context', () => {
    const result = createSuggestPrompt(clause, 'some intent', 'Test Contract');
    expect(result).toContain('Test Contract');
  });

  it('includes label in alternatives structure', () => {
    const result = createSuggestPrompt(clause, 'some intent', 'Test Contract');
    expect(result).toContain('"label"');
  });
});