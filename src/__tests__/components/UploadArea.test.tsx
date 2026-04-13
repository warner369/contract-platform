import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadArea from '@/components/UploadArea';

describe('UploadArea', () => {
  it('renders Upload File and Paste Text tabs', () => {
    render(<UploadArea />);
    expect(screen.getByText('Upload File')).toBeDefined();
    expect(screen.getByText('Paste Text')).toBeDefined();
  });

  it('renders analyse button as disabled initially', () => {
    render(<UploadArea />);
    const button = screen.getByRole('button', { name: 'Analyse Contract' });
    expect(button).toBeDisabled();
  });

  it('switches to paste mode and shows textarea', async () => {
    const user = userEvent.setup();
    render(<UploadArea />);
    await user.click(screen.getByText('Paste Text'));
    expect(screen.getByPlaceholderText('Paste your contract text here...')).toBeDefined();
  });

  it('shows "Add more text to continue" when paste text is short', async () => {
    const user = userEvent.setup();
    render(<UploadArea />);
    await user.click(screen.getByText('Paste Text'));
    const textarea = screen.getByPlaceholderText('Paste your contract text here...');
    await user.type(textarea, 'Short text');
    expect(screen.getByText('Add more text to continue')).toBeDefined();
  });

  it('enables submit when paste text is long enough', async () => {
    const user = userEvent.setup();
    render(<UploadArea />);
    await user.click(screen.getByText('Paste Text'));
    const textarea = screen.getByPlaceholderText('Paste your contract text here...');
    const longText = 'A '.repeat(60);
    await user.type(textarea, longText);
    const button = screen.getByRole('button', { name: 'Analyse Contract' });
    expect(button).not.toBeDisabled();
  });

  it('calls onUpload with text when submitting pasted text', async () => {
    const onUpload = vi.fn();
    const user = userEvent.setup();
    render(<UploadArea onUpload={onUpload} />);
    await user.click(screen.getByText('Paste Text'));
    const textarea = screen.getByPlaceholderText('Paste your contract text here...');
    const longText = 'Contract text that is definitely longer than fifty characters total';
    await user.type(textarea, longText);
    await user.click(screen.getByRole('button', { name: 'Analyse Contract' }));
    expect(onUpload).toHaveBeenCalledWith(null, longText, 'balanced');
  });

  it('shows drag and drop text in file mode', () => {
    render(<UploadArea />);
    expect(screen.getByText('Drag and drop your contract here')).toBeDefined();
  });

  it('shows word count in paste mode', async () => {
    const user = userEvent.setup();
    render(<UploadArea />);
    await user.click(screen.getByText('Paste Text'));
    const textarea = screen.getByPlaceholderText('Paste your contract text here...');
    await user.type(textarea, 'Hello world test');
    expect(screen.getByText('3 words')).toBeDefined();
  });
});