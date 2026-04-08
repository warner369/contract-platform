'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  ParsedContract,
  ClauseChange,
  ContractState,
  Clause,
} from '@/types/contract';

const initialState: ContractState = {
  original: null,
  current: null,
  changes: [],
  selectedClauseId: null,
  isLoading: false,
  error: null,
};

type Action =
  | { type: 'SET_CONTRACT'; payload: ParsedContract }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SELECT_CLAUSE'; payload: string | null }
  | { type: 'APPLY_CHANGE'; payload: ClauseChange }
  | { type: 'REJECT_CHANGE'; payload: string }
  | { type: 'RESET' };

function contractReducer(state: ContractState, action: Action): ContractState {
  switch (action.type) {
    case 'SET_CONTRACT':
      return {
        ...state,
        original: action.payload,
        current: action.payload,
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

      // Find existing pending change and mark as accepted
      const existingChangeIndex = state.changes.findIndex(
        (c) => c.clauseId === change.clauseId && c.status === 'pending',
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
        c.clauseId === action.payload && c.status === 'pending'
          ? { ...c, status: 'rejected' as const }
          : c,
      );
      return {
        ...state,
        changes: updatedChanges,
      };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface ContractContextValue {
  state: ContractState;
  setContract: (contract: ParsedContract) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  selectClause: (clauseId: string | null) => void;
  applyChange: (change: ClauseChange) => void;
  rejectChange: (clauseId: string) => void;
  reset: () => void;
  getClauseById: (clauseId: string) => Clause | undefined;
  getChangesForClause: (clauseId: string) => ClauseChange[];
}

const ContractContext = createContext<ContractContextValue | null>(null);

export function ContractProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(contractReducer, initialState);

  const setContract = useCallback((contract: ParsedContract) => {
    dispatch({ type: 'SET_CONTRACT', payload: contract });
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const selectClause = useCallback((clauseId: string | null) => {
    dispatch({ type: 'SELECT_CLAUSE', payload: clauseId });
  }, []);

  const applyChange = useCallback((change: ClauseChange) => {
    dispatch({ type: 'APPLY_CHANGE', payload: change });
  }, []);

  const rejectChange = useCallback((clauseId: string) => {
    dispatch({ type: 'REJECT_CHANGE', payload: clauseId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const getClauseById = useCallback(
    (clauseId: string): Clause | undefined =>
      state.current?.clauses.find((c) => c.id === clauseId),
    [state.current],
  );

  const getChangesForClause = useCallback(
    (clauseId: string): ClauseChange[] =>
      state.changes.filter((c) => c.clauseId === clauseId),
    [state.changes],
  );

  const value: ContractContextValue = {
    state,
    setContract,
    setLoading,
    setError,
    selectClause,
    applyChange,
    rejectChange,
    reset,
    getClauseById,
    getChangesForClause,
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
}

export function useContract(): ContractContextValue {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
}