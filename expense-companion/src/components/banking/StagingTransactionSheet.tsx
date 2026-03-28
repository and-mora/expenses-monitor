import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FilePenLine, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { CategoryItem, StagingTransaction, StagingTransactionStatus } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';

const statusValues: StagingTransactionStatus[] = ['pending', 'reviewed', 'imported', 'rejected'];

const stagingSchema = z.object({
  suggestedMerchant: z.string().max(255, 'Merchant name is too long').optional().or(z.literal('')),
  suggestedCategory: z.string().max(120, 'Category is too long').optional().or(z.literal('')),
  status: z.enum(statusValues),
});

export type StagingTransactionFormValues = z.infer<typeof stagingSchema>;

interface StagingTransactionSheetProps {
  transaction: StagingTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: StagingTransactionFormValues) => Promise<void>;
  categories: CategoryItem[];
  isSubmitting?: boolean;
}

export function StagingTransactionSheet({
  transaction,
  open,
  onOpenChange,
  onSubmit,
  categories,
  isSubmitting = false,
}: StagingTransactionSheetProps) {
  const defaultValues = useMemo<StagingTransactionFormValues>(
    () => ({
      suggestedMerchant: transaction?.suggestedMerchant ?? '',
      suggestedCategory: transaction?.suggestedCategory ?? '',
      status: transaction?.status ?? 'pending',
    }),
    [transaction],
  );

  const form = useForm<StagingTransactionFormValues>({
    resolver: zodResolver(stagingSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = async (values: StagingTransactionFormValues) => {
    await onSubmit({
      ...values,
      suggestedCategory: values.suggestedCategory === 'none' ? '' : values.suggestedCategory,
    });
    onOpenChange(false);
    form.reset(defaultValues);
  };

  const categoryOptions = categories.map((category) =>
    typeof category === 'string'
      ? { value: category, label: category.charAt(0).toUpperCase() + category.slice(1) }
      : { value: category.id, label: category.name },
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Edit staging transaction</SheetTitle>
          <SheetDescription>
            Update the merchant, category, and review status before importing.
          </SheetDescription>
        </SheetHeader>

        {transaction ? (
          <div className="mt-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{transaction.creditorName || transaction.remittanceInfo || 'Bank transaction'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(transaction.bookingDate)} • {transaction.provider}
                </p>
              </div>
              <Badge variant={transaction.status === 'imported' ? 'secondary' : 'outline'}>
                {transaction.status}
              </Badge>
            </div>
            <p
              className={`mt-3 text-lg font-semibold font-mono tabular-nums ${
                transaction.amountInCents >= 0 ? 'text-income' : 'text-expense'
              }`}
            >
              {formatCurrency(transaction.amountInCents, transaction.currency, true)}
            </p>
            {transaction.remittanceInfo && (
              <p className="mt-2 text-sm text-muted-foreground">{transaction.remittanceInfo}</p>
            )}
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="suggestedMerchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suggested merchant</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Supermarket" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="suggestedCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suggested category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Review status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusValues.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium leading-none">Notes</p>
              <Textarea
                readOnly
                value={transaction?.suggestedMerchant ? `Suggested merchant: ${transaction.suggestedMerchant}` : 'Use the form fields above to update this row.'}
                className="min-h-[96px] text-sm text-muted-foreground"
              />
            </div>

            <SheetFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
