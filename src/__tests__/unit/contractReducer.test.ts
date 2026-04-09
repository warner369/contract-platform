import { describe, it, expect } from 'vitest';
import { contractReducer, initialState } from '@/lib/reducer';
import type { ParsedContract, ClauseChange, ContractState, ClauseNote, ConversationThread, ContractVariable, AuditEntry } from '@/types/contract';

const sampleContract: ParsedContract = {
  title: 'Test Contract',
  summary: 'A test contract',
  parties: ['Party A', 'Party B'],
  clauses: [
    {
      id: 'clause-1',
      number: '1',
      title: 'Definitions',
      text: 'Original text for clause 1',
      category: 'definitions',
      references: [],
      riskLevel: 'low',
      riskNotes: '',
    },
    {
      id: 'clause-2',
      number: '2',
      title: 'Payment',
      text: 'Payment is due within 30 days',
      category: 'payment',
      references: ['clause-1'],
      riskLevel: 'medium',
      riskNotes: 'Short payment window',
    },
  ],
};

const stateWithContract: ContractState = {
  ...initialState,
  original: sampleContract,
  current: sampleContract,
  lifecycleState: 'structured',
};

describe('contractReducer', () => {
  describe('SET_CONTRACT', () => {
    it('sets original and current, sets lifecycle to structured, clears loading and error', () => {
      const state = contractReducer(initialState, {
        type: 'SET_CONTRACT',
        payload: sampleContract,
      });
      expect(state.original).toEqual(sampleContract);
      expect(state.current).toEqual(sampleContract);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lifecycleState).toBe('structured');
    });

    it('replaces existing contract data', () => {
      const first = contractReducer(initialState, {
        type: 'SET_CONTRACT',
        payload: sampleContract,
      });
      const second: ParsedContract = {
        ...sampleContract,
        title: 'Updated Contract',
      };
      const state = contractReducer(first, {
        type: 'SET_CONTRACT',
        payload: second,
      });
      expect(state.original?.title).toBe('Updated Contract');
      expect(state.current?.title).toBe('Updated Contract');
    });
  });

  describe('SET_LOADING', () => {
    it('sets loading to true', () => {
      const state = contractReducer(initialState, {
        type: 'SET_LOADING',
        payload: true,
      });
      expect(state.isLoading).toBe(true);
    });

    it('sets loading to false', () => {
      const loading: ContractState = { ...initialState, isLoading: true };
      const state = contractReducer(loading, {
        type: 'SET_LOADING',
        payload: false,
      });
      expect(state.isLoading).toBe(false);
    });
  });

  describe('SET_ERROR', () => {
    it('sets error and clears loading', () => {
      const loading: ContractState = { ...initialState, isLoading: true };
      const state = contractReducer(loading, {
        type: 'SET_ERROR',
        payload: 'Something went wrong',
      });
      expect(state.error).toBe('Something went wrong');
      expect(state.isLoading).toBe(false);
    });

    it('clears error with null', () => {
      const withError: ContractState = {
        ...initialState,
        error: 'Previous error',
      };
      const state = contractReducer(withError, {
        type: 'SET_ERROR',
        payload: null,
      });
      expect(state.error).toBeNull();
    });
  });

  describe('SELECT_CLAUSE', () => {
    it('selects a clause by id', () => {
      const state = contractReducer(stateWithContract, {
        type: 'SELECT_CLAUSE',
        payload: 'clause-1',
      });
      expect(state.selectedClauseId).toBe('clause-1');
    });

    it('deselects with null', () => {
      const selected: ContractState = {
        ...stateWithContract,
        selectedClauseId: 'clause-1',
      };
      const state = contractReducer(selected, {
        type: 'SELECT_CLAUSE',
        payload: null,
      });
      expect(state.selectedClauseId).toBeNull();
    });
  });

  describe('APPLY_CHANGE', () => {
    const pendingChange: ClauseChange = {
      id: 'change-1',
      clauseId: 'clause-1',
      type: 'modify',
      originalText: 'Original text for clause 1',
      suggestedText: 'Modified text for clause 1',
      rationale: 'Updated terms',
      status: 'pending',
    };

    it('updates clause text and marks change as accepted when no existing change', () => {
      const state = contractReducer(stateWithContract, {
        type: 'APPLY_CHANGE',
        payload: pendingChange,
      });
      expect(state.current?.clauses[0].text).toBe('Modified text for clause 1');
      expect(state.changes).toHaveLength(1);
      expect(state.changes[0].status).toBe('accepted');
      expect(state.original?.clauses[0].text).toBe('Original text for clause 1');
    });

    it('upgrades existing pending change to accepted when applying same change', () => {
      const withPending: ContractState = {
        ...stateWithContract,
        changes: [{ ...pendingChange }],
      };
      const state = contractReducer(withPending, {
        type: 'APPLY_CHANGE',
        payload: pendingChange,
      });
      expect(state.changes).toHaveLength(1);
      expect(state.changes[0].status).toBe('accepted');
    });

    it('leaves other clauses untouched', () => {
      const state = contractReducer(stateWithContract, {
        type: 'APPLY_CHANGE',
        payload: pendingChange,
      });
      expect(state.current?.clauses[1].text).toBe('Payment is due within 30 days');
    });

    it('returns state unchanged when current contract is null', () => {
      const state = contractReducer(initialState, {
        type: 'APPLY_CHANGE',
        payload: pendingChange,
      });
      expect(state.current).toBeNull();
      expect(state.changes).toEqual([]);
    });
  });

  describe('REJECT_CHANGE', () => {
    const pendingChange: ClauseChange = {
      id: 'change-1',
      clauseId: 'clause-1',
      type: 'modify',
      originalText: 'Original text for clause 1',
      suggestedText: 'Modified text for clause 1',
      rationale: 'Updated terms',
      status: 'pending',
    };

    it('marks a pending change as rejected by id', () => {
      const withPending: ContractState = {
        ...stateWithContract,
        changes: [{ ...pendingChange }],
      };
      const state = contractReducer(withPending, {
        type: 'REJECT_CHANGE',
        payload: 'change-1',
      });
      expect(state.changes).toHaveLength(1);
      expect(state.changes[0].status).toBe('rejected');
    });

    it('does not modify clause text when rejecting', () => {
      const withPending: ContractState = {
        ...stateWithContract,
        changes: [{ ...pendingChange }],
      };
      const state = contractReducer(withPending, {
        type: 'REJECT_CHANGE',
        payload: 'change-1',
      });
      expect(state.current?.clauses[0].text).toBe('Original text for clause 1');
    });

    it('does not reject already-accepted changes', () => {
      const withAccepted: ContractState = {
        ...stateWithContract,
        changes: [{ ...pendingChange, status: 'accepted' }],
      };
      const state = contractReducer(withAccepted, {
        type: 'REJECT_CHANGE',
        payload: 'change-1',
      });
      expect(state.changes[0].status).toBe('accepted');
    });

    it('does not reject already-rejected changes', () => {
      const withRejected: ContractState = {
        ...stateWithContract,
        changes: [{ ...pendingChange, status: 'rejected' }],
      };
      const state = contractReducer(withRejected, {
        type: 'REJECT_CHANGE',
        payload: 'change-1',
      });
      expect(state.changes[0].status).toBe('rejected');
    });

    it('only rejects matching change id, not other changes', () => {
      const otherPending: ClauseChange = {
        ...pendingChange,
        id: 'change-2',
        clauseId: 'clause-2',
      };
      const withPending: ContractState = {
        ...stateWithContract,
        changes: [{ ...pendingChange }, { ...otherPending }],
      };
      const state = contractReducer(withPending, {
        type: 'REJECT_CHANGE',
        payload: 'change-1',
      });
      expect(state.changes[0].status).toBe('rejected');
      expect(state.changes[1].status).toBe('pending');
    });
  });

  describe('PROPOSE_CHANGE', () => {
    it('adds a pending change without modifying clause text', () => {
      const change: ClauseChange = {
        id: 'change-3',
        clauseId: 'clause-1',
        type: 'modify',
        originalText: 'Original text for clause 1',
        suggestedText: 'New proposed text',
        rationale: 'Better terms',
        status: 'pending',
      };
      const state = contractReducer(stateWithContract, {
        type: 'PROPOSE_CHANGE',
        payload: change,
      });
      expect(state.changes).toHaveLength(1);
      expect(state.changes[0].status).toBe('pending');
      expect(state.current?.clauses[0].text).toBe('Original text for clause 1');
    });
  });

  describe('ADD_CLAUSE_NOTE', () => {
    it('adds a note to the notes list', () => {
      const note: ClauseNote = {
        id: 'note-1',
        clauseId: 'clause-1',
        content: 'This clause needs review',
        visibility: 'internal',
        createdAt: '2026-04-09T00:00:00Z',
      };
      const state = contractReducer(stateWithContract, {
        type: 'ADD_CLAUSE_NOTE',
        payload: note,
      });
      expect(state.notes).toHaveLength(1);
      expect(state.notes[0]).toEqual(note);
    });
  });

  describe('REMOVE_CLAUSE_NOTE', () => {
    it('removes a note by id', () => {
      const note: ClauseNote = {
        id: 'note-1',
        clauseId: 'clause-1',
        content: 'Remove me',
        visibility: 'internal',
        createdAt: '2026-04-09T00:00:00Z',
      };
      const withNote: ContractState = {
        ...stateWithContract,
        notes: [note],
      };
      const state = contractReducer(withNote, {
        type: 'REMOVE_CLAUSE_NOTE',
        payload: 'note-1',
      });
      expect(state.notes).toHaveLength(0);
    });
  });

  describe('SET_LIFECYCLE_STATE', () => {
    it('updates lifecycle state', () => {
      const state = contractReducer(stateWithContract, {
        type: 'SET_LIFECYCLE_STATE',
        payload: 'internal_review',
      });
      expect(state.lifecycleState).toBe('internal_review');
    });
  });

  describe('ADD_THREAD', () => {
    it('adds a conversation thread', () => {
      const thread: ConversationThread = {
        id: 'thread-1',
        clauseId: 'clause-1',
        messages: [],
        resolved: false,
        createdAt: '2026-04-09T00:00:00Z',
      };
      const state = contractReducer(stateWithContract, {
        type: 'ADD_THREAD',
        payload: thread,
      });
      expect(state.threads).toHaveLength(1);
      expect(state.threads[0].id).toBe('thread-1');
    });
  });

  describe('ADD_THREAD_MESSAGE', () => {
    it('appends a message to an existing thread', () => {
      const thread: ConversationThread = {
        id: 'thread-1',
        clauseId: 'clause-1',
        messages: [],
        resolved: false,
        createdAt: '2026-04-09T00:00:00Z',
      };
      const withThread: ContractState = {
        ...stateWithContract,
        threads: [thread],
      };
      const state = contractReducer(withThread, {
        type: 'ADD_THREAD_MESSAGE',
        payload: {
          threadId: 'thread-1',
          message: {
            id: 'msg-1',
            author: 'User',
            content: 'Can we change this?',
            createdAt: '2026-04-09T01:00:00Z',
          },
        },
      });
      expect(state.threads[0].messages).toHaveLength(1);
      expect(state.threads[0].messages[0].content).toBe('Can we change this?');
    });
  });

  describe('RESOLVE_THREAD', () => {
    it('marks a thread as resolved', () => {
      const thread: ConversationThread = {
        id: 'thread-1',
        clauseId: 'clause-1',
        messages: [],
        resolved: false,
        createdAt: '2026-04-09T00:00:00Z',
      };
      const withThread: ContractState = {
        ...stateWithContract,
        threads: [thread],
      };
      const state = contractReducer(withThread, {
        type: 'RESOLVE_THREAD',
        payload: 'thread-1',
      });
      expect(state.threads[0].resolved).toBe(true);
    });
  });

  describe('SET_VARIABLE', () => {
    it('adds a new variable', () => {
      const variable: ContractVariable = {
        id: 'var-1',
        name: 'Payment Terms (days)',
        value: '30',
        affectedClauseIds: ['clause-2'],
      };
      const state = contractReducer(stateWithContract, {
        type: 'SET_VARIABLE',
        payload: variable,
      });
      expect(state.variables).toHaveLength(1);
      expect(state.variables[0].value).toBe('30');
    });

    it('updates an existing variable by id', () => {
      const variable: ContractVariable = {
        id: 'var-1',
        name: 'Payment Terms (days)',
        value: '30',
        affectedClauseIds: ['clause-2'],
      };
      const withVar: ContractState = {
        ...stateWithContract,
        variables: [variable],
      };
      const updated: ContractVariable = {
        ...variable,
        value: '45',
      };
      const state = contractReducer(withVar, {
        type: 'SET_VARIABLE',
        payload: updated,
      });
      expect(state.variables).toHaveLength(1);
      expect(state.variables[0].value).toBe('45');
    });
  });

  describe('ADD_AUDIT_ENTRY', () => {
    it('appends an audit entry', () => {
      const entry: AuditEntry = {
        id: 'audit-1',
        action: 'APPLY_CHANGE',
        clauseId: 'clause-1',
        detail: 'Accepted proposed change to payment terms',
        timestamp: '2026-04-09T01:00:00Z',
      };
      const state = contractReducer(stateWithContract, {
        type: 'ADD_AUDIT_ENTRY',
        payload: entry,
      });
      expect(state.auditLog).toHaveLength(1);
      expect(state.auditLog[0].action).toBe('APPLY_CHANGE');
    });
  });

  describe('RESET', () => {
    it('returns initial state with all new fields cleared', () => {
      const modified: ContractState = {
        ...stateWithContract,
        selectedClauseId: 'clause-1',
        changes: [{ id: 'change-1', clauseId: 'clause-1', type: 'modify', originalText: 'a', suggestedText: 'b', rationale: 'test', status: 'accepted' }],
        notes: [{ id: 'n1', clauseId: 'c1', content: 'note', visibility: 'internal', createdAt: '' }],
        threads: [{ id: 't1', clauseId: 'c1', messages: [], resolved: false, createdAt: '' }],
        variables: [{ id: 'v1', name: 'Test', value: '1', affectedClauseIds: [] }],
        auditLog: [{ id: 'a1', action: 'test', detail: '', timestamp: '' }],
        lifecycleState: 'agreed',
      };
      const state = contractReducer(modified, { type: 'RESET' });
      expect(state.original).toBeNull();
      expect(state.current).toBeNull();
      expect(state.changes).toEqual([]);
      expect(state.notes).toEqual([]);
      expect(state.threads).toEqual([]);
      expect(state.variables).toEqual([]);
      expect(state.auditLog).toEqual([]);
      expect(state.lifecycleState).toBe('uploaded');
      expect(state.selectedClauseId).toBeNull();
    });
  });
});