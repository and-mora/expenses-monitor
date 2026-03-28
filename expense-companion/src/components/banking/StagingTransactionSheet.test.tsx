import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { StagingTransactionSheet } from './StagingTransactionSheet';
import type { CategoryItem, StagingTransaction } from '@/types/api';

const transaction: StagingTransaction = {
  id: 'stg-1',
  connectionId: 'conn-1',
  provider: 'mock',
  bankTransactionId: 'bank-tx-1',
  amountInCents: -1299,
  currency: 'EUR',
  bookingDate: '2026-03-25',
  valueDate: '2026-03-25',
  creditorName: 'Streaming Service',
  debtorName: 'Test User',
  remittanceInfo: 'Monthly subscription',
  suggestedCategory: 'entertainment',
  suggestedMerchant: 'Streaming Service',
  status: 'pending',
  createdAt: '2026-03-25T10:00:00Z',
  updatedAt: '2026-03-25T10:00:00Z',
};

const categories: CategoryItem[] = [
  'food',
  'transport',
  { id: 'entertainment', name: 'entertainment' },
];

describe('StagingTransactionSheet', () => {
  const onSubmit = vi.fn();
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders transaction details when open', () => {
    render(
      <StagingTransactionSheet
        open
        transaction={transaction}
        categories={categories}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText('Edit staging transaction')).toBeInTheDocument();
    expect(screen.getByText('Streaming Service')).toBeInTheDocument();
    expect(screen.getByText('Monthly subscription')).toBeInTheDocument();
  });

  it('updates the staging row and closes on success', async () => {
    const user = userEvent.setup();
    onSubmit.mockResolvedValueOnce(undefined);

    render(
      <StagingTransactionSheet
        open
        transaction={transaction}
        categories={categories}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestedMerchant: 'Streaming Service',
          status: 'pending',
        }),
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
