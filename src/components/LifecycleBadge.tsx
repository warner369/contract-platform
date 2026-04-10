'use client';

import { useState, useEffect, useRef } from 'react';
import { useContract } from '@/components/providers/ContractProvider';
import type { ContractLifecycleState } from '@/types/contract';

const LABELS: Record<ContractLifecycleState, string> = {
  uploaded: 'Uploaded',
  structured: 'Structured',
  internal_review: 'Internal Review',
  in_negotiation: 'In Negotiation',
  agreed: 'Agreed',
  finalised: 'Finalised',
};

const COLORS: Record<ContractLifecycleState, string> = {
  uploaded: 'bg-slate-100 text-slate-700',
  structured: 'bg-blue-100 text-blue-700',
  internal_review: 'bg-amber-100 text-amber-700',
  in_negotiation: 'bg-amber-100 text-amber-700',
  agreed: 'bg-emerald-100 text-emerald-700',
  finalised: 'bg-emerald-200 text-emerald-800',
};

const TRANSITIONS: Record<ContractLifecycleState, ContractLifecycleState[]> = {
  uploaded: [],
  structured: ['internal_review'],
  internal_review: ['in_negotiation'],
  in_negotiation: ['agreed'],
  agreed: ['finalised'],
  finalised: [],
};

export default function LifecycleBadge() {
  const { state, setLifecycleState } = useContract();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const currentState = state.lifecycleState;
  const nextStates = TRANSITIONS[currentState];
  const canTransition = nextStates.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => canTransition && setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${COLORS[currentState]} ${canTransition ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        disabled={!canTransition}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
        {LABELS[currentState]}
        {canTransition && (
          <svg className="w-3 h-3 opacity-60" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {open && nextStates.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1">
          {nextStates.map((nextState) => (
            <button
              key={nextState}
              onClick={() => {
                setLifecycleState(nextState);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${COLORS[nextState].split(' ')[0]}`} />
              <span className="text-slate-700">{LABELS[nextState]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}