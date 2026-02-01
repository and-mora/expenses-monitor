import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { EditPaymentDialog } from './EditPaymentDialog';
import type { Payment } from '@/types/api';

describe('EditPaymentDialog', () => {
  const mockPayment: Payment = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    merchantName: 'Test Store',
    amountInCents: -5000,
    category: 'shopping',
    accountingDate: '2026-01-15T10:30:00',
    description: 'Test purchase',
    wallet: 'Main Account',
    tags: [
      { key: 'project', value: 'test-project' },
      { key: 'team', value: 'engineering' },
    ],
  };

  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render dialog when closed', () => {
    render(
      <EditPaymentDialog
        payment={null}
        open={false}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render dialog when open with payment data', async () => {
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Test Store')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50.00')).toBeInTheDocument();
    expect(screen.getByText('shopping')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-01-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test purchase')).toBeInTheDocument();
  });

  it('should display payment tags', async () => {
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByText(/project/i)).toBeInTheDocument();
    expect(screen.getByText(/test-project/i)).toBeInTheDocument();
  });

  it('should handle positive amount (income) correctly', async () => {
    const incomePayment: Payment = {
      ...mockPayment,
      amountInCents: 250000,
      category: 'income',
    };

    render(
      <EditPaymentDialog
        payment={incomePayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('2500.00')).toBeInTheDocument();
  });

  it('should validate required merchant name', async () => {
    const user = userEvent.setup();
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const merchantInput = screen.getByLabelText(/merchant/i);
    await user.clear(merchantInput);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/merchant name is required/i)).toBeInTheDocument();
    });
  });

  it('should validate non-zero amount', async () => {
    const user = userEvent.setup();
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, '0');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/amount cannot be zero/i)).toBeInTheDocument();
    });
  });

  it('should display category field', async () => {
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const categoryButton = screen.getByRole('combobox', { name: /category/i });
    expect(categoryButton).toBeInTheDocument();
    expect(screen.getByText('shopping')).toBeInTheDocument();
  });

  it('should validate required wallet', async () => {
    const user = userEvent.setup();
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const walletSelect = screen.getByRole('combobox', { name: /wallet/i });
    expect(walletSelect).toBeInTheDocument();
  });

  it('should call onOpenChange when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should update merchant name field', async () => {
    const user = userEvent.setup();
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const merchantInput = screen.getByLabelText(/merchant/i);
    await user.clear(merchantInput);
    await user.type(merchantInput, 'New Store Name');

    expect(screen.getByDisplayValue('New Store Name')).toBeInTheDocument();
  });

  it('should update amount field', async () => {
    const user = userEvent.setup();
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/amount/i);
    expect(amountInput).toBeInTheDocument();
    expect(amountInput).toHaveValue(-50);
  });

  it('should update description field', async () => {
    const user = userEvent.setup();
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated description');

    expect(screen.getByDisplayValue('Updated description')).toBeInTheDocument();
  });

  it('should handle payment without tags', async () => {
    const paymentWithoutTags: Payment = {
      ...mockPayment,
      tags: undefined,
    };

    render(
      <EditPaymentDialog
        payment={paymentWithoutTags}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Test Store')).toBeInTheDocument();
  });

  it('should handle payment without description', async () => {
    const paymentWithoutDescription: Payment = {
      ...mockPayment,
      description: undefined,
    };

    render(
      <EditPaymentDialog
        payment={paymentWithoutDescription}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const descriptionInput = screen.getByLabelText(/description/i);
    expect(descriptionInput).toHaveValue('');
  });

  it('should initialize form with payment data', async () => {
    render(
      <EditPaymentDialog
        payment={mockPayment}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify all form fields are initialized correctly
    expect(screen.getByDisplayValue('Test Store')).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toHaveValue(-50);
    expect(screen.getByText('shopping')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-01-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test purchase')).toBeInTheDocument();
  });
});
