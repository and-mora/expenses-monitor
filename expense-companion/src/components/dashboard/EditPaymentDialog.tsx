import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { Payment, PaymentUpdate, Tag } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from './TagInput';
import { Loader2 } from 'lucide-react';

interface EditPaymentDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function EditPaymentDialog({
  payment,
  open,
  onOpenChange,
  onSave,
}: EditPaymentDialogProps) {
  const queryClient = useQueryClient();

  // Form state - initialize from `payment` prop. The dialog is keyed by
  // `payment?.id` so the component remounts when editing a different payment,
  // allowing us to initialize state via initializers instead of calling
  // setState synchronously inside an effect (avoids eslint rule).
  const [merchantName, setMerchantName] = useState(() => payment?.merchantName || '');
  const [amountInCents, setAmountInCents] = useState(() => payment?.amountInCents || 0);
  const [category, setCategory] = useState(() => payment?.categoryId || '');
  const [accountingDate, setAccountingDate] = useState(() =>
    payment?.accountingDate ? payment.accountingDate.split('T')[0] : ''
  );
  const [description, setDescription] = useState(() => payment?.description || '');
  const [wallet, setWallet] = useState(() => payment?.wallet || '');
  const [tags, setTags] = useState<Tag[]>(() => payment?.tags || []);

  // Fetch categories and wallets
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiClient.getWallets(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payment: PaymentUpdate }) =>
      apiClient.updatePayment(data.id, data.payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      toast.success('Transaction updated successfully');
      onSave();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update transaction: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!merchantName.trim()) {
      toast.error('Merchant name is required');
      return;
    }

    if (amountInCents === 0) {
      toast.error('Amount cannot be zero');
      return;
    }

    if (!category) {
      toast.error('Category is required');
      return;
    }

    if (!wallet) {
      toast.error('Wallet is required');
      return;
    }

    if (!accountingDate) {
      toast.error('Date is required');
      return;
    }

    // Optional: Warn about future dates (non-blocking)
    const selectedDate = new Date(accountingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      toast.info('You are using a future date');
    }

    const paymentUpdate: PaymentUpdate = {
      merchantName: merchantName.trim(),
      amountInCents,
      categoryId: category,
      accountingDate: accountingDate + 'T00:00:00', // Backend expects NaiveDateTime
      description: description.trim() || undefined,
      wallet,
      tags: tags.length > 0 ? tags : undefined,
    };

    if (payment) {
      updateMutation.mutate({ id: payment.id, payment: paymentUpdate });
    }
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value);
    if (!isNaN(amount)) {
      setAmountInCents(Math.round(amount * 100));
    }
  };

  const displayAmount = (amountInCents / 100).toFixed(2);

  return (
    // Key the sheet by payment id so the dialog remounts when a different
    // payment is edited. This allows initializers above to pick up new values
    // without setting state inside an effect.
    <Sheet key={payment?.id ?? 'new'} open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Edit Transaction</SheetTitle>
          <SheetDescription>
            Make changes to your transaction. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="merchantName">Merchant Name *</Label>
            <Input
              id="merchantName"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g., Supermarket"
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={displayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-muted-foreground">
              Positive = income, Negative = expense. Current sign:{' '}
              {amountInCents >= 0 ? 'Income ✓' : 'Expense ✗'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => {
                  const id = typeof cat === 'string' ? cat : cat.id;
                  const label =
                    typeof cat === 'string'
                      ? cat.charAt(0).toUpperCase() + cat.slice(1)
                      : cat.name;

                  return (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet *</Label>
            <Select value={wallet} onValueChange={setWallet} required>
              <SelectTrigger id="wallet">
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((w) => (
                  <SelectItem key={w.id} value={w.name}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountingDate">Date *</Label>
            <Input
              id="accountingDate"
              type="date"
              value={accountingDate}
              onChange={(e) => setAccountingDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
