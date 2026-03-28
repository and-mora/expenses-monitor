import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { BankConnectionSheet } from './BankConnectionSheet';

describe('BankConnectionSheet', () => {
  const onSubmit = vi.fn();
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the connection form when open', () => {
    render(
      <BankConnectionSheet
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText('Connect a bank')).toBeInTheDocument();
    expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('Connection label')).toBeInTheDocument();
    expect(screen.getByLabelText('Redirect URI')).toBeInTheDocument();
  });

  it('shows inline validation errors for an invalid redirect URI', async () => {
    const user = userEvent.setup();

    render(
      <BankConnectionSheet
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    const redirectUriInput = screen.getByLabelText('Redirect URI');
    await user.clear(redirectUriInput);
    await user.type(redirectUriInput, 'not-a-url');
    await user.click(screen.getByRole('button', { name: /create connection/i }));

    expect(await screen.findByText('Redirect URI must be a valid URL')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the form and closes on success', async () => {
    const user = userEvent.setup();
    onSubmit.mockResolvedValueOnce(undefined);

    render(
      <BankConnectionSheet
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: /create connection/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'mock',
        }),
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
