import { describe, it, expect } from 'vitest';
import { exportContractToDocx } from '@/lib/export';
import { sampleContract, sampleChange, stateWithContract } from '../mocks/contract-data';
import type { ContractState, ClauseChange } from '@/types/contract';

describe('exportContractToDocx', () => {
  it('throws when state has no original contract', async () => {
    const state: ContractState = {
      ...stateWithContract,
      original: null,
    };
    await expect(exportContractToDocx(state)).rejects.toThrow('No contract data available');
  });

  it('throws when state has no current contract', async () => {
    const state: ContractState = {
      ...stateWithContract,
      current: null,
    };
    await expect(exportContractToDocx(state)).rejects.toThrow('No contract data available');
  });

  it('returns a Blob for a contract with no changes', async () => {
    const blob = await exportContractToDocx(stateWithContract);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('includes accepted changes as tracked changes', async () => {
    const acceptedChange: ClauseChange = {
      ...sampleChange,
      status: 'accepted',
    };
    const state: ContractState = {
      ...stateWithContract,
      changes: [acceptedChange],
    };
    const blob = await exportContractToDocx(state);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('includes pending changes as tracked changes', async () => {
    const pendingChange: ClauseChange = {
      ...sampleChange,
      status: 'pending',
    };
    const state: ContractState = {
      ...stateWithContract,
      changes: [pendingChange],
    };
    const blob = await exportContractToDocx(state);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('excludes rejected changes from tracked changes', async () => {
    const rejectedChange: ClauseChange = {
      ...sampleChange,
      status: 'rejected',
    };
    const state: ContractState = {
      ...stateWithContract,
      changes: [rejectedChange],
    };
    const blob = await exportContractToDocx(state);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('handles add-type changes for clauses not in original', async () => {
    const addChange: ClauseChange = {
      id: 'change-add',
      clauseId: 'clause-new',
      type: 'add',
      originalText: '',
      suggestedText: 'New clause text added by the user.',
      rationale: 'Additional clause needed',
      status: 'accepted',
    };
    const state: ContractState = {
      ...stateWithContract,
      changes: [addChange],
    };
    const blob = await exportContractToDocx(state);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('handles remove-type changes', async () => {
    const removeChange: ClauseChange = {
      id: 'change-remove',
      clauseId: 'clause-1',
      type: 'remove',
      originalText: sampleContract.clauses[0].text,
      suggestedText: '',
      rationale: 'Removing this clause',
      status: 'accepted',
    };
    const state: ContractState = {
      ...stateWithContract,
      changes: [removeChange],
    };
    const blob = await exportContractToDocx(state);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('handles multiple changes across different clauses', async () => {
    const changes: ClauseChange[] = [
      {
        id: 'change-1',
        clauseId: 'clause-1',
        type: 'modify',
        originalText: sampleContract.clauses[0].text,
        suggestedText: 'Modified definitions text',
        rationale: 'Updated definitions',
        status: 'accepted',
      },
      {
        id: 'change-2',
        clauseId: 'clause-2',
        type: 'modify',
        originalText: sampleContract.clauses[1].text,
        suggestedText: 'Modified payment text',
        rationale: 'Updated payment terms',
        status: 'pending',
      },
      {
        id: 'change-3',
        clauseId: 'clause-3',
        type: 'modify',
        originalText: sampleContract.clauses[2].text,
        suggestedText: 'Modified liability text',
        rationale: 'Updated liability',
        status: 'rejected',
      },
    ];
    const state: ContractState = {
      ...stateWithContract,
      changes,
    };
    const blob = await exportContractToDocx(state);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('handles contract with no parties', async () => {
    const state: ContractState = {
      ...stateWithContract,
      original: { ...sampleContract, parties: [] },
      current: { ...sampleContract, parties: [] },
    };
    const blob = await exportContractToDocx(state);
    expect(blob).toBeInstanceOf(Blob);
  });
});