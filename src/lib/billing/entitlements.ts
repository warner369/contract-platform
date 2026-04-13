import type { FeedbackMode } from '@/lib/feedback-mode';

export type Plan = 'free' | 'pro';

export interface PlanAwareUser {
  id: string;
  plan: Plan;
  currentPeriodEnd?: number | null;
}

export function isActivePro(user: PlanAwareUser): boolean {
  if (user.plan !== 'pro') return false;
  // When currentPeriodEnd is not set (pre-Stripe), treat pro as always active
  if (user.currentPeriodEnd == null) return true;
  return user.currentPeriodEnd * 1000 > Date.now();
}

export function canUseAggressiveMode(user: PlanAwareUser): boolean {
  return isActivePro(user);
}

export function canShareContract(user: PlanAwareUser): boolean {
  return isActivePro(user);
}

export class PlanRequiredError extends Error {
  public readonly feature: 'aggressive_mode' | 'collaboration';

  constructor(feature: 'aggressive_mode' | 'collaboration') {
    super('upgrade_required');
    this.name = 'PlanRequiredError';
    this.feature = feature;
  }
}

export function assertCanUseFeedbackMode(
  user: PlanAwareUser,
  mode: FeedbackMode,
): void {
  if (mode === 'aggressive' && !canUseAggressiveMode(user)) {
    throw new PlanRequiredError('aggressive_mode');
  }
}
