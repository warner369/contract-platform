import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractProvider } from '@/components/providers/ContractProvider';
import ClauseNotes from '@/components/ClauseNotes';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <ContractProvider>{children}</ContractProvider>;
}

describe('ClauseNotes', () => {
  it('renders add note textarea and button', () => {
    render(<ClauseNotes clauseId="clause-1" />, { wrapper });
    expect(screen.getByPlaceholderText('Add a note...')).toBeDefined();
    const addButton = screen.getByRole('button', { name: 'Add note' });
    expect(addButton).toBeDisabled();
  });

  it('enables add button when content is entered', async () => {
    const user = userEvent.setup();
    render(<ClauseNotes clauseId="clause-1" />, { wrapper });
    const textarea = screen.getByPlaceholderText('Add a note...');
    await user.type(textarea, 'My new note');
    const addButton = screen.getByRole('button', { name: 'Add note' });
    expect(addButton).not.toBeDisabled();
  });

  it('adds an internal note and displays it', async () => {
    const user = userEvent.setup();
    render(<ClauseNotes clauseId="clause-1" />, { wrapper });
    const textarea = screen.getByPlaceholderText('Add a note...');
    await user.type(textarea, 'Important internal note');
    await user.click(screen.getByRole('button', { name: 'Add note' }));
    expect(screen.getByText('Important internal note')).toBeDefined();
    const badges = screen.getAllByText('Internal');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('adds an external note when Shareable is selected', async () => {
    const user = userEvent.setup();
    render(<ClauseNotes clauseId="clause-1" />, { wrapper });
    const buttons = screen.getAllByRole('button');
    const shareableButton = buttons.find(b => b.textContent?.includes('Shareable'));
    if (shareableButton) await user.click(shareableButton);
    const textarea = screen.getByPlaceholderText('Add a note...');
    await user.type(textarea, 'External note');
    await user.click(screen.getByRole('button', { name: 'Add note' }));
    expect(screen.getByText('External note')).toBeDefined();
    const badges = screen.getAllByText('Shareable');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('clears textarea after adding a note', async () => {
    const user = userEvent.setup();
    render(<ClauseNotes clauseId="clause-1" />, { wrapper });
    const textarea = screen.getByPlaceholderText('Add a note...');
    await user.type(textarea, 'Test note');
    await user.click(screen.getByRole('button', { name: 'Add note' }));
    expect(textarea).toHaveValue('');
  });

  it('deletes a note when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<ClauseNotes clauseId="clause-1" />, { wrapper });
    const textarea = screen.getByPlaceholderText('Add a note...');
    await user.type(textarea, 'Note to delete');
    await user.click(screen.getByRole('button', { name: 'Add note' }));
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete note' });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(deleteButtons[0]);
    expect(screen.queryByText('Note to delete')).toBeNull();
  });
});