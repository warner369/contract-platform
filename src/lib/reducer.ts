import type {
  ContractState,
  ContractAction,
  ClauseChange,
} from '@/types/contract';
import { DEFAULT_FEEDBACK_MODE } from '@/lib/feedback-mode';

export const initialState: ContractState = {
  original: null,
  current: null,
  changes: [],
  notes: [],
  threads: [],
  variables: [],
  auditLog: [],
  lifecycleState: 'uploaded',
  feedbackMode: DEFAULT_FEEDBACK_MODE,
  selectedClauseId: null,
  isLoading: false,
  error: null,
};

export function contractReducer(state: ContractState, action: ContractAction): ContractState {
  switch (action.type) {
    case 'SET_CONTRACT':
      return {
        ...state,
        original: action.payload,
        current: action.payload,
        lifecycleState: 'structured',
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'SELECT_CLAUSE':
      return {
        ...state,
        selectedClauseId: action.payload,
      };
    case 'APPLY_CHANGE': {
      const change = action.payload;
      if (!state.current) return state;

      const updatedClauses = state.current.clauses.map((clause) => {
        if (clause.id === change.clauseId) {
          return {
            ...clause,
            text: change.suggestedText,
          };
        }
        return clause;
      });

      const existingChangeIndex = state.changes.findIndex(
        (c) => c.id === change.id,
      );

      let updatedChanges: ClauseChange[];
      if (existingChangeIndex >= 0) {
        updatedChanges = state.changes.map((c, i) =>
          i === existingChangeIndex ? { ...c, status: 'accepted' as const } : c,
        );
      } else {
        updatedChanges = [...state.changes, { ...change, status: 'accepted' }];
      }

      return {
        ...state,
        current: {
          ...state.current,
          clauses: updatedClauses,
        },
        changes: updatedChanges,
      };
    }
    case 'REJECT_CHANGE': {
      const updatedChanges = state.changes.map((c) =>
        c.id === action.payload && c.status === 'pending'
          ? { ...c, status: 'rejected' as const }
          : c,
      );
      return {
        ...state,
        changes: updatedChanges,
      };
    }
    case 'PROPOSE_CHANGE':
      return {
        ...state,
        changes: [...state.changes, action.payload],
      };
    case 'ADD_CLAUSE_NOTE':
      return {
        ...state,
        notes: [...state.notes, action.payload],
      };
    case 'REMOVE_CLAUSE_NOTE':
      return {
        ...state,
        notes: state.notes.filter((n) => n.id !== action.payload),
      };
    case 'SET_LIFECYCLE_STATE':
      return {
        ...state,
        lifecycleState: action.payload,
      };
    case 'ADD_THREAD':
      return {
        ...state,
        threads: [...state.threads, action.payload],
      };
    case 'ADD_THREAD_MESSAGE': {
      const { threadId, message } = action.payload;
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === threadId
            ? { ...t, messages: [...t.messages, message] }
            : t,
        ),
      };
    }
    case 'RESOLVE_THREAD':
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.payload ? { ...t, resolved: true } : t,
        ),
      };
    case 'SET_VARIABLE': {
      const existing = state.variables.findIndex((v) => v.id === action.payload.id);
      const updatedVariables = existing >= 0
        ? state.variables.map((v, i) => (i === existing ? action.payload : v))
        : [...state.variables, action.payload];
      return {
        ...state,
        variables: updatedVariables,
      };
    }
    case 'ADD_AUDIT_ENTRY':
      return {
        ...state,
        auditLog: [...state.auditLog, action.payload],
      };
    case 'SET_FEEDBACK_MODE':
      return {
        ...state,
        feedbackMode: action.payload,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}