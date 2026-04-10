import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractProvider } from '@/components/providers/ContractProvider';
import ThreadPanel from '@/components/ThreadPanel';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <ContractProvider>{children}</ContractProvider>;
}

describe('ThreadPanel', () => {
  it('renders "Start a discussion" button when no threads', () => {
    render(<ThreadPanel clauseId="clause-1" />, { wrapper });
    expect(screen.getByText('Start a discussion')).toBeDefined();
  });

  it('opens textarea when "Start a discussion" is clicked', async () => {
    const user = userEvent.setup();
    render(<ThreadPanel clauseId="clause-1" />, { wrapper });
    await user.click(screen.getByText('Start a discussion'));
    expect(screen.getByPlaceholderText('Start a discussion...')).toBeDefined();
    expect(screen.getByText('Post')).toBeDefined();
  });

  it('creates a new thread when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ThreadPanel clauseId="clause-1" />, { wrapper });
    await user.click(screen.getByText('Start a discussion'));
    const textarea = screen.getByPlaceholderText('Start a discussion...');
    await user.type(textarea, 'Should we change this clause?');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    expect(screen.getByText('Should we change this clause?')).toBeDefined();
    expect(screen.getByText('You')).toBeDefined();
  });

  it('shows Reply and Resolve buttons on open threads', async () => {
    const user = userEvent.setup();
    render(<ThreadPanel clauseId="clause-1" />, { wrapper });
    await user.click(screen.getByText('Start a discussion'));
    await user.type(screen.getByPlaceholderText('Start a discussion...'), 'Thread content');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    expect(screen.getByText('Reply')).toBeDefined();
    expect(screen.getByText('Resolve')).toBeDefined();
  });

  it('shows reply input when Reply is clicked', async () => {
    const user = userEvent.setup();
    render(<ThreadPanel clauseId="clause-1" />, { wrapper });
    await user.click(screen.getByText('Start a discussion'));
    await user.type(screen.getByPlaceholderText('Start a discussion...'), 'Original message');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    await user.click(screen.getByText('Reply'));
    expect(screen.getByPlaceholderText('Type a reply...')).toBeDefined();
  });

  it('resolves a thread when Resolve is clicked', async () => {
    const user = userEvent.setup();
    render(<ThreadPanel clauseId="clause-1" />, { wrapper });
    await user.click(screen.getByText('Start a discussion'));
    await user.type(screen.getByPlaceholderText('Start a discussion...'), 'To be resolved');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    await user.click(screen.getByText('Resolve'));
    expect(screen.getByText('Resolved')).toBeDefined();
  });

  it('cancels starting a new thread', async () => {
    const user = userEvent.setup();
    render(<ThreadPanel clauseId="clause-1" />, { wrapper });
    await user.click(screen.getByText('Start a discussion'));
    await user.click(screen.getByText('Cancel'));
    expect(screen.getByText('Start a discussion')).toBeDefined();
  });
});