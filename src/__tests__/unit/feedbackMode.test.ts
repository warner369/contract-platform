import { describe, it, expect } from 'vitest';
import {
  FEEDBACK_MODES,
  DEFAULT_FEEDBACK_MODE,
  feedbackModeDirective,
  isFeedbackMode,
  type FeedbackMode,
} from '@/lib/feedback-mode';

describe('feedback-mode', () => {
  describe('FEEDBACK_MODES', () => {
    it('has exactly three modes', () => {
      expect(FEEDBACK_MODES).toHaveLength(3);
    });

    it('includes aggressive, balanced, and safety_first', () => {
      const ids = FEEDBACK_MODES.map((m) => m.id);
      expect(ids).toContain('aggressive');
      expect(ids).toContain('balanced');
      expect(ids).toContain('safety_first');
    });

    it('has non-empty labels and descriptions', () => {
      for (const mode of FEEDBACK_MODES) {
        expect(mode.label.length).toBeGreaterThan(0);
        expect(mode.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('DEFAULT_FEEDBACK_MODE', () => {
    it('is balanced', () => {
      expect(DEFAULT_FEEDBACK_MODE).toBe('balanced');
    });
  });

  describe('feedbackModeDirective', () => {
    it('returns a non-empty string for each mode', () => {
      const modes: FeedbackMode[] = ['aggressive', 'balanced', 'safety_first'];
      for (const mode of modes) {
        const directive = feedbackModeDirective(mode);
        expect(directive.length).toBeGreaterThan(0);
      }
    });

    it('returns different text for each mode', () => {
      const aggressive = feedbackModeDirective('aggressive');
      const balanced = feedbackModeDirective('balanced');
      const safetyFirst = feedbackModeDirective('safety_first');
      expect(aggressive).not.toBe(balanced);
      expect(balanced).not.toBe(safetyFirst);
      expect(aggressive).not.toBe(safetyFirst);
    });

    it('aggressive directive contains adversarial language', () => {
      expect(feedbackModeDirective('aggressive').toLowerCase()).toContain('adversarial');
    });

    it('safety_first directive mentions material risks', () => {
      expect(feedbackModeDirective('safety_first').toLowerCase()).toContain('material');
    });
  });

  describe('isFeedbackMode', () => {
    it('returns true for valid modes', () => {
      expect(isFeedbackMode('aggressive')).toBe(true);
      expect(isFeedbackMode('balanced')).toBe(true);
      expect(isFeedbackMode('safety_first')).toBe(true);
    });

    it('returns false for invalid values', () => {
      expect(isFeedbackMode('invalid')).toBe(false);
      expect(isFeedbackMode('')).toBe(false);
      expect(isFeedbackMode(null)).toBe(false);
      expect(isFeedbackMode(undefined)).toBe(false);
      expect(isFeedbackMode(42)).toBe(false);
    });
  });
});
