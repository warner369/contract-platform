export type FeedbackMode = 'aggressive' | 'balanced' | 'safety_first';

export const FEEDBACK_MODES: ReadonlyArray<{
  id: FeedbackMode;
  label: string;
  description: string;
}> = [
  {
    id: 'aggressive',
    label: 'Aggressive',
    description: 'I am looking for issues with this contract.',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'I want a balanced view of this contract.',
  },
  {
    id: 'safety_first',
    label: 'Safety First',
    description: 'I am just looking for significant risks with this contract.',
  },
];

export const DEFAULT_FEEDBACK_MODE: FeedbackMode = 'balanced';

const DIRECTIVES: Record<FeedbackMode, string> = {
  aggressive: [
    'Adopt an adversarial, thorough posture.',
    'Surface every concern — minor, moderate, and major.',
    'When a clause is ambiguous, assume the worst-case interpretation and prefer a higher risk rating.',
    'List as many risks as you can identify. Opportunities should be included only when clearly and unambiguously beneficial.',
    'Recommendations should focus on protective changes the user should request.',
  ].join(' '),
  balanced: [
    'Provide an even-handed analysis that weighs risks against opportunities.',
    'Rate risk levels objectively based on how standard or unusual the terms are.',
    'Include both concerns and potential benefits where applicable.',
  ].join(' '),
  safety_first: [
    'Only report material, high-impact risks that could cause significant financial or legal harm.',
    'Omit minor stylistic issues, low-severity concerns, and standard boilerplate observations.',
    'Keep the output concise — fewer risks, only the most important ones.',
    'If a clause is standard and low-risk, say so briefly without listing marginal concerns.',
    'Opportunities and recommendations should only be included when they address a significant risk.',
  ].join(' '),
};

export function feedbackModeDirective(mode: FeedbackMode): string {
  return DIRECTIVES[mode];
}

export function isFeedbackMode(value: unknown): value is FeedbackMode {
  return value === 'aggressive' || value === 'balanced' || value === 'safety_first';
}
