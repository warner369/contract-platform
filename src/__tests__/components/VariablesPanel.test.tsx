import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractProvider } from '@/components/providers/ContractProvider';
import VariablesPanel from '@/components/VariablesPanel';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <ContractProvider>{children}</ContractProvider>;
}

describe('VariablesPanel', () => {
  it('renders "No variables for this clause" when no variables exist', () => {
    render(<VariablesPanel clauseId="clause-1" />, { wrapper });
    expect(screen.getByText('No variables for this clause.')).toBeDefined();
  });

  it('renders "Add variable" button', () => {
    render(<VariablesPanel clauseId="clause-1" />, { wrapper });
    expect(screen.getByText('Add variable')).toBeDefined();
  });

  it('shows add variable form when "Add variable" is clicked', async () => {
    const user = userEvent.setup();
    render(<VariablesPanel clauseId="clause-1" />, { wrapper });
    await user.click(screen.getByText('Add variable'));
    expect(screen.getByPlaceholderText('Variable name')).toBeDefined();
    expect(screen.getByPlaceholderText('Value')).toBeDefined();
  });

  it('adds a variable when form is submitted', async () => {
    const user = userEvent.setup();
    render(<VariablesPanel clauseId="clause-1" />, { wrapper });
    await user.click(screen.getByText('Add variable'));
    await user.type(screen.getByPlaceholderText('Variable name'), 'Payment Days');
    await user.type(screen.getByPlaceholderText('Value'), '30');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText('Payment Days')).toBeDefined();
    expect(screen.getByText('30')).toBeDefined();
  });

  it('disables Add button when variable name is empty', async () => {
    const user = userEvent.setup();
    render(<VariablesPanel clauseId="clause-1" />, { wrapper });
    await user.click(screen.getByText('Add variable'));
    const addButton = screen.getByRole('button', { name: 'Add' });
    expect(addButton).toBeDisabled();
  });

  it('cancels adding a variable', async () => {
    const user = userEvent.setup();
    render(<VariablesPanel clauseId="clause-1" />, { wrapper });
    await user.click(screen.getByText('Add variable'));
    await user.click(screen.getByText('Cancel'));
    expect(screen.getByText('Add variable')).toBeDefined();
  });
});