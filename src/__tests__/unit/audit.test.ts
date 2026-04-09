import { describe, it, expect, vi } from 'vitest';
import { withAudit } from '@/lib/audit';
import type { ContractAction, ClauseChange } from '@/types/contract';

describe('withAudit', () => {
  it('dispatches the original action and an ADD_AUDIT_ENTRY', () => {
    const dispatch = vi.fn();
    const change: ClauseChange = {
      id: 'change-1',
      clauseId: 'clause-1',
      type: 'modify',
      originalText: 'old',
      suggestedText: 'new',
      rationale: 'test',
      status: 'pending',
    };
    const action: ContractAction = { type: 'APPLY_CHANGE', payload: change };

    withAudit(dispatch, action, 'Accepted change on clause clause-1');

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenNthCalledWith(1, action);
    expect(dispatch).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'ADD_AUDIT_ENTRY',
      payload: expect.objectContaining({
        action: 'APPLY_CHANGE',
        clauseId: 'clause-1',
        detail: 'Accepted change on clause clause-1',
      }),
    }));
  });

  it('generates an id and timestamp for each audit entry', () => {
    const dispatch = vi.fn();
    const action: ContractAction = { type: 'SET_LIFECYCLE_STATE', payload: 'agreed' };
    const before = Date.now();

    withAudit(dispatch, action, 'Lifecycle changed to agreed');

    const after = Date.now();
    const auditEntry = dispatch.mock.calls[1][0].payload;
    expect(auditEntry.id).toBeTruthy();
    expect(new Date(auditEntry.timestamp).getTime()).toBeGreaterThanOrEqual(before);
    expect(new Date(auditEntry.timestamp).getTime()).toBeLessThanOrEqual(after);
  });

  it('extracts clauseId from PROPOSE_CHANGE actions', () => {
    const dispatch = vi.fn();
    const change: ClauseChange = {
      id: 'change-2',
      clauseId: 'clause-5',
      type: 'modify',
      originalText: 'may',
      suggestedText: 'shall',
      rationale: 'strengthen obligation',
      status: 'pending',
    };

    withAudit(dispatch, { type: 'PROPOSE_CHANGE', payload: change }, 'Proposed change');

    const auditEntry = dispatch.mock.calls[1][0].payload;
    expect(auditEntry.clauseId).toBe('clause-5');
  });

  it('handles actions without a clauseId', () => {
    const dispatch = vi.fn();

    withAudit(dispatch, { type: 'REJECT_CHANGE', payload: 'change-3' }, 'Rejected change');

    const auditEntry = dispatch.mock.calls[1][0].payload;
    expect(auditEntry.clauseId).toBeUndefined();
  });
});