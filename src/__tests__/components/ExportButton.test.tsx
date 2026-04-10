import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractProvider, useContract } from '@/components/providers/ContractProvider';
import { sampleContract, sampleChange } from '../mocks/contract-data';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

vi.mock('@/lib/export', () => ({
  exportContractToDocx: vi.fn().mockResolvedValue(new Blob(['fake'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })),
}));

import ExportButton from '@/components/ExportButton';

function wrapper({ children }: { children: ReactNode }) {
  return <ContractProvider>{children}</ContractProvider>;
}

function SetupAndRender({ contract, applyChanges = false }: { contract: typeof sampleContract; applyChanges?: boolean }) {
  const { setContract, applyChange } = useContract();
  useEffect(() => {
    setContract(contract);
  }, [contract, setContract]);
  useEffect(() => {
    if (applyChanges) {
      applyChange(sampleChange);
    }
  }, [applyChanges, applyChange]);
  return <ExportButton />;
}

describe('ExportButton', () => {
  it('renders "Download DOCX" button', () => {
    render(<ExportButton />, { wrapper });
    expect(screen.getByText('Download DOCX')).toBeDefined();
  });

  it('is disabled when no contract is loaded', () => {
    render(<ExportButton />, { wrapper });
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when no tracked changes exist', async () => {
    render(<SetupAndRender contract={sampleContract} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  it('is enabled when accepted changes exist', async () => {
    render(<SetupAndRender contract={sampleContract} applyChanges />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  it('shows disclaimer on hover', async () => {
    const user = userEvent.setup();
    render(<SetupAndRender contract={sampleContract} applyChanges />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
    await user.hover(screen.getByRole('button'));
    expect(screen.getByText(/This document will NOT match your original formatting/)).toBeDefined();
  });
});