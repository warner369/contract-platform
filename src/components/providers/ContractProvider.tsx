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
  ClauseNote,
  ConversationThread,
  ThreadMessage,
  ContractVariable,
  AuditEntry,
  ContractLifecycleState,
  Clause,
} from '@/types/contract';
import { contractReducer, initialState } from '@/lib/reducer';

interface ContractContextValue {
  state: ContractState;
  setContract: (contract: ParsedContract) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  selectClause: (clauseId: string | null) => void;
  applyChange: (change: ClauseChange) => void;
  rejectChange: (changeId: string) => void;
  proposeChange: (change: ClauseChange) => void;
  addClauseNote: (note: ClauseNote) => void;
  removeClauseNote: (noteId: string) => void;
  setLifecycleState: (state: ContractLifecycleState) => void;
  addThread: (thread: ConversationThread) => void;
  addThreadMessage: (threadId: string, message: ThreadMessage) => void;
  resolveThread: (threadId: string) => void;
  setVariable: (variable: ContractVariable) => void;
  addAuditEntry: (entry: AuditEntry) => void;
  reset: () => void;
  getClauseById: (clauseId: string) => Clause | undefined;
  getChangesForClause: (clauseId: string) => ClauseChange[];
  getNotesForClause: (clauseId: string) => ClauseNote[];
  getThreadsForClause: (clauseId: string) => ConversationThread[];
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

  const rejectChange = useCallback((changeId: string) => {
    dispatch({ type: 'REJECT_CHANGE', payload: changeId });
  }, []);

  const proposeChange = useCallback((change: ClauseChange) => {
    dispatch({ type: 'PROPOSE_CHANGE', payload: change });
  }, []);

  const addClauseNote = useCallback((note: ClauseNote) => {
    dispatch({ type: 'ADD_CLAUSE_NOTE', payload: note });
  }, []);

  const removeClauseNote = useCallback((noteId: string) => {
    dispatch({ type: 'REMOVE_CLAUSE_NOTE', payload: noteId });
  }, []);

  const setLifecycleState = useCallback((lifecycleState: ContractLifecycleState) => {
    dispatch({ type: 'SET_LIFECYCLE_STATE', payload: lifecycleState });
  }, []);

  const addThread = useCallback((thread: ConversationThread) => {
    dispatch({ type: 'ADD_THREAD', payload: thread });
  }, []);

  const addThreadMessage = useCallback((threadId: string, message: ThreadMessage) => {
    dispatch({ type: 'ADD_THREAD_MESSAGE', payload: { threadId, message } });
  }, []);

  const resolveThread = useCallback((threadId: string) => {
    dispatch({ type: 'RESOLVE_THREAD', payload: threadId });
  }, []);

  const setVariable = useCallback((variable: ContractVariable) => {
    dispatch({ type: 'SET_VARIABLE', payload: variable });
  }, []);

  const addAuditEntry = useCallback((entry: AuditEntry) => {
    dispatch({ type: 'ADD_AUDIT_ENTRY', payload: entry });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const getClauseById = (clauseId: string): Clause | undefined =>
    state.current?.clauses.find((c) => c.id === clauseId);

  const getChangesForClause = (clauseId: string): ClauseChange[] =>
    state.changes.filter((c) => c.clauseId === clauseId);

  const getNotesForClause = (clauseId: string): ClauseNote[] =>
    state.notes.filter((n) => n.clauseId === clauseId);

  const getThreadsForClause = (clauseId: string): ConversationThread[] =>
    state.threads.filter((t) => t.clauseId === clauseId);

  const value: ContractContextValue = {
    state,
    setContract,
    setLoading,
    setError,
    selectClause,
    applyChange,
    rejectChange,
    proposeChange,
    addClauseNote,
    removeClauseNote,
    setLifecycleState,
    addThread,
    addThreadMessage,
    resolveThread,
    setVariable,
    addAuditEntry,
    reset,
    getClauseById,
    getChangesForClause,
    getNotesForClause,
    getThreadsForClause,
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