import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractProvider, useContract } from '@/components/providers/ContractProvider';
import LifecycleBadge from '@/components/LifecycleBadge';
import { sampleContract } from '../mocks/contract-data';
import type { ReactNode, ContractLifecycleState } from 'react';
import { useEffect } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <ContractProvider>{children}</ContractProvider>;
}

function SetupAndRender({ contract, lifecycle }: { contract: typeof sampleContract; lifecycle?: ContractLifecycleState }) {
  const { setContract, setLifecycleState } = useContract();
  useEffect(() => {
    setContract(contract);
  }, [contract, setContract]);
  useEffect(() => {
    if (lifecycle) {
      setLifecycleState(lifecycle);
    }
  }, [lifecycle, setLifecycleState]);
  return <LifecycleBadge />;
}

describe('LifecycleBadge', () => {
  it('renders "Uploaded" for uploaded state', () => {
    render(<LifecycleBadge />, { wrapper });
    expect(screen.getByText('Uploaded')).toBeDefined();
  });

  it('is disabled when no transitions available (uploaded)', () => {
    render(<LifecycleBadge />, { wrapper });
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows Structured badge after contract is loaded', async () => {
    render(<SetupAndRender contract={sampleContract} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Structured')).toBeDefined();
    });
  });

  it('shows dropdown with valid transitions after clicking Structured badge', async () => {
    const user = userEvent.setup();
    render(<SetupAndRender contract={sampleContract} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Structured')).toBeDefined();
    });
    await user.click(screen.getByText('Structured'));
    expect(screen.getByText('Internal Review')).toBeDefined();
  });

  it('transitions to next state when dropdown option is clicked', async () => {
    const user = userEvent.setup();
    const ResultChecker = () => {
      const { state } = useContract();
      return <span data-testid="lifecycle">{state.lifecycleState}</span>;
    };
    render(
      <ContractProvider>
        <SetupAndRender contract={sampleContract} />
        <ResultChecker />
      </ContractProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Structured')).toBeDefined();
    });
    await user.click(screen.getByText('Structured'));
    await user.click(screen.getByText('Internal Review'));
    expect(screen.getByTestId('lifecycle').textContent).toBe('internal_review');
  });

  it('shows no transitions for finalised state', async () => {
    render(<SetupAndRender contract={sampleContract} lifecycle="finalised" />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Finalised')).toBeDefined();
    });
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});