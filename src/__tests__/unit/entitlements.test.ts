import { describe, it, expect } from 'vitest';
import {
  isActivePro,
  canUseAggressiveMode,
  canShareContract,
  PlanRequiredError,
  assertCanUseFeedbackMode,
  type PlanAwareUser,
} from '@/lib/billing/entitlements';

const freeUser: PlanAwareUser = { id: 'u1', plan: 'free' };
const proUser: PlanAwareUser = { id: 'u2', plan: 'pro' };
const expiredProUser: PlanAwareUser = {
  id: 'u3',
  plan: 'pro',
  currentPeriodEnd: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
};
const activeProUser: PlanAwareUser = {
  id: 'u4',
  plan: 'pro',
  currentPeriodEnd: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
};

describe('entitlements', () => {
  describe('isActivePro', () => {
    it('returns false for free users', () => {
      expect(isActivePro(freeUser)).toBe(false);
    });

    it('returns true for pro users without currentPeriodEnd', () => {
      expect(isActivePro(proUser)).toBe(true);
    });

    it('returns false for expired pro users', () => {
      expect(isActivePro(expiredProUser)).toBe(false);
    });

    it('returns true for active pro users', () => {
      expect(isActivePro(activeProUser)).toBe(true);
    });
  });

  describe('canUseAggressiveMode', () => {
    it('returns false for free users', () => {
      expect(canUseAggressiveMode(freeUser)).toBe(false);
    });

    it('returns true for pro users', () => {
      expect(canUseAggressiveMode(proUser)).toBe(true);
    });
  });

  describe('canShareContract', () => {
    it('returns false for free users', () => {
      expect(canShareContract(freeUser)).toBe(false);
    });

    it('returns true for pro users', () => {
      expect(canShareContract(proUser)).toBe(true);
    });
  });

  describe('PlanRequiredError', () => {
    it('has correct name and feature', () => {
      const error = new PlanRequiredError('aggressive_mode');
      expect(error.name).toBe('PlanRequiredError');
      expect(error.feature).toBe('aggressive_mode');
      expect(error.message).toBe('upgrade_required');
    });
  });

  describe('assertCanUseFeedbackMode', () => {
    it('does not throw for balanced mode on free plan', () => {
      expect(() => assertCanUseFeedbackMode(freeUser, 'balanced')).not.toThrow();
    });

    it('does not throw for safety_first mode on free plan', () => {
      expect(() => assertCanUseFeedbackMode(freeUser, 'safety_first')).not.toThrow();
    });

    it('throws PlanRequiredError for aggressive mode on free plan', () => {
      expect(() => assertCanUseFeedbackMode(freeUser, 'aggressive')).toThrow(PlanRequiredError);
    });

    it('does not throw for aggressive mode on pro plan', () => {
      expect(() => assertCanUseFeedbackMode(proUser, 'aggressive')).not.toThrow();
    });
  });
});
