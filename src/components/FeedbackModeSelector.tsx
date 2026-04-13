'use client';

import { FEEDBACK_MODES, type FeedbackMode } from '@/lib/feedback-mode';
import type { Plan } from '@/lib/billing/entitlements';

interface FeedbackModeSelectorProps {
  value: FeedbackMode;
  onChange: (mode: FeedbackMode) => void;
  userPlan?: Plan;
  onUpgradeRequested?: () => void;
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function FeedbackModeSelector({
  value,
  onChange,
  userPlan = 'free',
  onUpgradeRequested,
}: FeedbackModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Analysis Mode
      </label>
      <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
        {FEEDBACK_MODES.map((mode) => {
          const isLocked = mode.id === 'aggressive' && userPlan !== 'pro';
          const isActive = value === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                if (isLocked) {
                  onUpgradeRequested?.();
                } else {
                  onChange(mode.id);
                }
              }}
              title={mode.description}
              className={`flex-1 py-2.5 px-3 text-xs font-medium transition-colors relative ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : isLocked
                  ? 'text-slate-400 hover:text-slate-500 hover:bg-slate-50 cursor-not-allowed'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                {mode.label}
                {isLocked && (
                  <>
                    <LockIcon className="w-3 h-3" />
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-700 rounded px-1 py-0.5 uppercase">
                      Pro
                    </span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
