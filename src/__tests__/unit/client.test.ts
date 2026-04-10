import { describe, it, expect } from 'vitest';

describe('coerceJsonStrings logic', () => {
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

  it('converts numbers to strings', () => {
    expect(coerceJsonStrings(42)).toBe('42');
    expect(coerceJsonStrings(0)).toBe('0');
    expect(coerceJsonStrings(-3.14)).toBe('-3.14');
  });

  it('converts booleans to strings', () => {
    expect(coerceJsonStrings(true)).toBe('true');
    expect(coerceJsonStrings(false)).toBe('false');
  });

  it('converts null and undefined to empty string', () => {
    expect(coerceJsonStrings(null)).toBe('');
    expect(coerceJsonStrings(undefined)).toBe('');
  });

  it('preserves strings', () => {
    expect(coerceJsonStrings('hello')).toBe('hello');
    expect(coerceJsonStrings('')).toBe('');
  });

  it('recursively processes arrays', () => {
    const result = coerceJsonStrings([1, 'two', true, null]);
    expect(result).toEqual(['1', 'two', 'true', '']);
  });

  it('recursively processes objects', () => {
    const result = coerceJsonStrings({ id: 1, name: 'Test', active: true, count: null });
    expect(result).toEqual({ id: '1', name: 'Test', active: 'true', count: '' });
  });

  it('handles deeply nested objects', () => {
    const result = coerceJsonStrings({
      level1: {
        level2: {
          level3: 42,
          arr: [true, false],
        },
      },
    });
    expect(result).toEqual({
      level1: {
        level2: {
          level3: '42',
          arr: ['true', 'false'],
        },
      },
    });
  });

  it('handles empty objects and arrays', () => {
    expect(coerceJsonStrings({})).toEqual({});
    expect(coerceJsonStrings([])).toEqual([]);
  });

  it('handles mixed nested structures', () => {
    const input = {
      clauses: [
        { id: 'c1', riskLevel: 'low', references: [] },
        { id: 'c2', riskLevel: 'medium', references: ['c1'] },
      ],
      summary: 'Test contract',
      parties: ['Party A', 'Party B'],
    };
    const result = coerceJsonStrings(input);
    expect(result).toEqual({
      clauses: [
        { id: 'c1', riskLevel: 'low', references: [] },
        { id: 'c2', riskLevel: 'medium', references: ['c1'] },
      ],
      summary: 'Test contract',
      parties: ['Party A', 'Party B'],
    });
  });
});

describe('JSON response parsing patterns', () => {
  it('extracts JSON from markdown code blocks', () => {
    const response = '```json\n{"title": "Test", "clauses": []}\n```';
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, response];
    const parsed = JSON.parse(jsonMatch[1]!.trim());
    expect(parsed.title).toBe('Test');
    expect(parsed.clauses).toEqual([]);
  });

  it('extracts JSON from plain code blocks', () => {
    const response = '```\n{"title": "Test"}\n```';
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, response];
    const parsed = JSON.parse(jsonMatch[1]!.trim());
    expect(parsed.title).toBe('Test');
  });

  it('falls back to raw response when no code blocks', () => {
    const response = '{"title": "Test"}';
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, response];
    const jsonStr = jsonMatch[1] || response;
    const parsed = JSON.parse(jsonStr.trim());
    expect(parsed.title).toBe('Test');
  });

  it('throws on invalid JSON', () => {
    const response = 'not valid json at all';
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, response];
    const jsonStr = jsonMatch[1] || response;
    expect(() => JSON.parse(jsonStr.trim())).toThrow();
  });
});