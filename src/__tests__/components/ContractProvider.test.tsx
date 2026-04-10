import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ContractProvider, useContract } from '@/components/providers/ContractProvider';
import { sampleContract, sampleChange, sampleNote, sampleThread, sampleVariable } from '../mocks/contract-data';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <ContractProvider>{children}</ContractProvider>;
}

function useTestHook() {
  return useContract();
}

describe('ContractProvider', () => {
  it('starts with empty initial state', () => {
    const { result } = renderHook(useTestHook, { wrapper });
    expect(result.current.state.original).toBeNull();
    expect(result.current.state.current).toBeNull();
    expect(result.current.state.changes).toEqual([]);
    expect(result.current.state.lifecycleState).toBe('uploaded');
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  describe('setContract', () => {
    it('populates original and current, sets lifecycle to structured', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      expect(result.current.state.original).toEqual(sampleContract);
      expect(result.current.state.current).toEqual(sampleContract);
      expect(result.current.state.lifecycleState).toBe('structured');
    });
  });

  describe('applyChange', () => {
    it('updates clause text and adds audit entry', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      act(() => {
        result.current.applyChange(sampleChange);
      });
      expect(result.current.state.current?.clauses[0].text).toBe(sampleChange.suggestedText);
      expect(result.current.state.changes).toHaveLength(1);
      expect(result.current.state.changes[0].status).toBe('accepted');
      expect(result.current.state.auditLog).toHaveLength(1);
      expect(result.current.state.auditLog[0].action).toBe('APPLY_CHANGE');
      expect(result.current.state.auditLog[0].clauseId).toBe(sampleChange.clauseId);
    });
  });

  describe('rejectChange', () => {
    it('marks the change as rejected and adds audit entry', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      act(() => {
        result.current.proposeChange(sampleChange);
      });
      const changeId = result.current.state.changes[0].id;
      act(() => {
        result.current.rejectChange(changeId);
      });
      expect(result.current.state.changes[0].status).toBe('rejected');
      expect(result.current.state.auditLog.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('proposeChange', () => {
    it('adds a pending change and audit entry', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      act(() => {
        result.current.proposeChange(sampleChange);
      });
      expect(result.current.state.changes).toHaveLength(1);
      expect(result.current.state.changes[0].status).toBe('pending');
      expect(result.current.state.auditLog).toHaveLength(1);
    });
  });

  describe('addClauseNote', () => {
    it('adds a note and audit entry', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      act(() => {
        result.current.addClauseNote(sampleNote);
      });
      expect(result.current.state.notes).toHaveLength(1);
      expect(result.current.state.notes[0].content).toBe('Check with legal whether the definition is too broad.');
      expect(result.current.state.auditLog).toHaveLength(1);
      expect(result.current.state.auditLog[0].action).toBe('ADD_CLAUSE_NOTE');
    });
  });

  describe('removeClauseNote', () => {
    it('removes a note and adds audit entry', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
        result.current.addClauseNote(sampleNote);
      });
      const initialAuditCount = result.current.state.auditLog.length;
      act(() => {
        result.current.removeClauseNote(sampleNote.id);
      });
      expect(result.current.state.notes).toHaveLength(0);
      expect(result.current.state.auditLog.length).toBe(initialAuditCount + 1);
    });
  });

  describe('setLifecycleState', () => {
    it('updates lifecycle state and adds audit entry', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      act(() => {
        result.current.setLifecycleState('internal_review');
      });
      expect(result.current.state.lifecycleState).toBe('internal_review');
      expect(result.current.state.auditLog).toHaveLength(1);
      expect(result.current.state.auditLog[0].detail).toContain('internal_review');
    });
  });

  describe('addThread', () => {
    it('adds a thread and audit entry', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      act(() => {
        result.current.addThread(sampleThread);
      });
      expect(result.current.state.threads).toHaveLength(1);
      expect(result.current.state.threads[0].clauseId).toBe('clause-1');
      expect(result.current.state.auditLog).toHaveLength(1);
    });
  });

  describe('addThreadMessage', () => {
    it('adds a message to a thread and audit entry', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
        result.current.addThread(sampleThread);
      });
      act(() => {
        result.current.addThreadMessage('thread-1', {
          id: 'msg-2',
          author: 'You',
          content: 'I agree',
          createdAt: new Date().toISOString(),
        });
      });
      expect(result.current.state.threads[0].messages).toHaveLength(2);
      expect(result.current.state.threads[0].messages[1].content).toBe('I agree');
    });
  });

  describe('resolveThread', () => {
    it('marks a thread as resolved', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
        result.current.addThread(sampleThread);
      });
      act(() => {
        result.current.resolveThread('thread-1');
      });
      expect(result.current.state.threads[0].resolved).toBe(true);
    });
  });

  describe('setVariable', () => {
    it('adds a variable and audit entry', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      act(() => {
        result.current.setVariable(sampleVariable);
      });
      expect(result.current.state.variables).toHaveLength(1);
      expect(result.current.state.variables[0].name).toBe('Payment Terms (days)');
      expect(result.current.state.auditLog).toHaveLength(1);
    });

    it('updates an existing variable by id', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
        result.current.setVariable(sampleVariable);
      });
      act(() => {
        result.current.setVariable({ ...sampleVariable, value: '45' });
      });
      expect(result.current.state.variables).toHaveLength(1);
      expect(result.current.state.variables[0].value).toBe('45');
    });
  });

  describe('selectors', () => {
    it('getClauseById returns the matching clause', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      const clause = result.current.getClauseById('clause-1');
      expect(clause?.title).toBe('Definitions');
    });

    it('getClauseById returns undefined for unknown id', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      expect(result.current.getClauseById('nonexistent')).toBeUndefined();
    });

    it('getChangesForClause returns changes for the clause', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
        result.current.proposeChange(sampleChange);
      });
      const changes = result.current.getChangesForClause('clause-1');
      expect(changes).toHaveLength(1);
      expect(changes[0].clauseId).toBe('clause-1');
    });

    it('getNotesForClause returns notes for the clause', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
        result.current.addClauseNote(sampleNote);
      });
      const notes = result.current.getNotesForClause('clause-1');
      expect(notes).toHaveLength(1);
    });

    it('getThreadsForClause returns threads for the clause', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
        result.current.addThread(sampleThread);
      });
      const threads = result.current.getThreadsForClause('clause-1');
      expect(threads).toHaveLength(1);
    });
  });

  describe('reset', () => {
    it('returns to initial state', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
        result.current.setLifecycleState('internal_review');
        result.current.addClauseNote(sampleNote);
      });
      act(() => {
        result.current.reset();
      });
      expect(result.current.state.original).toBeNull();
      expect(result.current.state.current).toBeNull();
      expect(result.current.state.changes).toEqual([]);
      expect(result.current.state.notes).toEqual([]);
      expect(result.current.state.lifecycleState).toBe('uploaded');
    });
  });

  describe('caches', () => {
    it('analysisCache round-trips correctly', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      act(() => {
        result.current.setContract(sampleContract);
      });
      const analysis = { explanation: 'Test', risks: [], opportunities: [], relatedClauses: [], recommendations: [] };
      act(() => {
        result.current.setAnalysisCache('clause-1', analysis);
      });
      expect(result.current.getAnalysisCache('clause-1')).toEqual(analysis);
      expect(result.current.getAnalysisCache('clause-999')).toBeUndefined();
    });

    it('suggestionCache round-trips correctly', () => {
      const { result } = renderHook(useTestHook, { wrapper });
      const response = { suggestions: [], alternatives: [], negotiationTips: [] };
      act(() => {
        result.current.setSuggestionCache('test-key', response);
      });
      expect(result.current.getSuggestionCache('test-key')).toEqual(response);
      expect(result.current.getSuggestionCache('nonexistent')).toBeUndefined();
    });
  });
});