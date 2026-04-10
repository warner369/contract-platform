import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ContractProvider, useContract } from '@/components/providers/ContractProvider';
import ComparisonView from '@/components/ComparisonView';
import { sampleContract, sampleChange } from '../mocks/contract-data';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <ContractProvider>{children}</ContractProvider>;
}

function SetupAndRender({ contract, applyChanges }: { contract: typeof sampleContract; applyChanges?: boolean }) {
  const { setContract, applyChange } = useContract();
  useEffect(() => {
    setContract(contract);
  }, [contract, setContract]);
  useEffect(() => {
    if (applyChanges) {
      applyChange(sampleChange);
    }
  }, [applyChanges, applyChange]);
  return <ComparisonView />;
}

describe('ComparisonView', () => {
  it('shows "No contract loaded" message when state is empty', () => {
    render(<ComparisonView />, { wrapper });
    expect(screen.getByText(/No contract loaded/)).toBeDefined();
  });

  it('shows "All changes" and "Pending only" filter buttons when contract is loaded', async () => {
    render(<SetupAndRender contract={sampleContract} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('All changes')).toBeDefined();
    });
    expect(screen.getByText('Pending only')).toBeDefined();
  });

  it('shows empty state when no changes exist', async () => {
    render(<SetupAndRender contract={sampleContract} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/No changes have been made yet/)).toBeDefined();
    });
  });

  it('shows change counts in summary when changes exist', async () => {
    render(<SetupAndRender contract={sampleContract} applyChanges />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/accepted/)).toBeDefined();
    });
  });
});