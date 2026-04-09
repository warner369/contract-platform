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
import { withAudit } from '@/lib/audit';

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
    withAudit(dispatch, { type: 'APPLY_CHANGE', payload: change }, `Accepted change on clause ${change.clauseId}`);
  }, []);

  const rejectChange = useCallback((changeId: string) => {
    withAudit(dispatch, { type: 'REJECT_CHANGE', payload: changeId }, `Rejected change ${changeId}`);
  }, []);

  const proposeChange = useCallback((change: ClauseChange) => {
    withAudit(dispatch, { type: 'PROPOSE_CHANGE', payload: change }, `Proposed change on clause ${change.clauseId}`);
  }, []);

  const addClauseNote = useCallback((note: ClauseNote) => {
    withAudit(dispatch, { type: 'ADD_CLAUSE_NOTE', payload: note }, `Added ${note.visibility} note on clause ${note.clauseId}`);
  }, []);

  const removeClauseNote = useCallback((noteId: string) => {
    withAudit(dispatch, { type: 'REMOVE_CLAUSE_NOTE', payload: noteId }, `Removed note ${noteId}`);
  }, []);

  const setLifecycleState = useCallback((lifecycleState: ContractLifecycleState) => {
    withAudit(dispatch, { type: 'SET_LIFECYCLE_STATE', payload: lifecycleState }, `Lifecycle changed to ${lifecycleState}`);
  }, []);

  const addThread = useCallback((thread: ConversationThread) => {
    withAudit(dispatch, { type: 'ADD_THREAD', payload: thread }, `Started discussion on clause ${thread.clauseId}`);
  }, []);

  const addThreadMessage = useCallback((threadId: string, message: ThreadMessage) => {
    withAudit(dispatch, { type: 'ADD_THREAD_MESSAGE', payload: { threadId, message } }, `Replied in thread ${threadId}`);
  }, []);

  const resolveThread = useCallback((threadId: string) => {
    withAudit(dispatch, { type: 'RESOLVE_THREAD', payload: threadId }, `Resolved thread ${threadId}`);
  }, []);

  const setVariable = useCallback((variable: ContractVariable) => {
    withAudit(dispatch, { type: 'SET_VARIABLE', payload: variable }, `Set variable "${variable.name}" to "${variable.value}"`);
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