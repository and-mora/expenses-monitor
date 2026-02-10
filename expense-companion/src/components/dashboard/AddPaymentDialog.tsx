import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Minus, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { TagInput } from './TagInput';
import { CategoryCombobox } from './CategoryCombobox';
import { paymentSchema, type PaymentFormValues, type PaymentSubmitData } from './payment-form-schema';
import type { Wallet, Tag } from '@/types/api';

interface AddPaymentDialogProps {
  wallets: Wallet[];
  onSubmit: (data: PaymentSubmitData) => void;
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

export function AddPaymentDialog({ wallets, onSubmit, isLoading, trigger }: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExpense, setIsExpense] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Get filtered categories based on expense/income mode from backend
  // Only fetch when dialog is open to avoid unnecessary API calls
  const categoryType = isExpense ? 'expense' : 'income';
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', categoryType],
    queryFn: () => apiClient.getCategories(categoryType),
    enabled: open, // Only fetch when dialog is open
    staleTime: 300000, // 5 minutes - categories rarely change
  });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      merchantName: '',
      amount: '',
        category: '', // holds categoryId
      description: '',
      wallet: wallets[0]?.id || '',
      isExpense: true,
      accountingDate: new Date(),
    },
  });

  const processSubmit = (values: PaymentFormValues, keepOpen: boolean) => {
    const amountInCents = Math.round(parseFloat(values.amount) * 100);
    
    // Find wallet name from ID
    const selectedWallet = wallets.find(w => w.id === values.wallet);
    
    const paymentData = {
      merchantName: values.merchantName,
      amountInCents: values.isExpense ? -amountInCents : amountInCents,
      // include both `categoryId` and legacy `category` for compatibility with callers/tests
      categoryId: values.category,
      category: values.category,
      accountingDate: format(values.accountingDate, "yyyy-MM-dd'T'HH:mm:ss"),
      description: values.description,
      wallet: selectedWallet?.name || values.wallet,
      tags: tags.length > 0 ? tags : undefined,
    };
    
    console.log('[AddPaymentDialog] Submitting payment with tags:', tags);
    console.log('[AddPaymentDialog] Full payment data:', paymentData);
    
    onSubmit(paymentData);
    
    if (keepOpen) {
      // Keep tags, category, wallet, isExpense, and accountingDate - only reset merchant, amount, description
      form.reset({
        merchantName: '',
        amount: '',
        category: values.category,
        description: '',
        wallet: values.wallet,
        isExpense: values.isExpense,
        accountingDate: values.accountingDate, // Preserve selected date
      });
      // Tags are preserved in state
    } else {
      // Full reset and close
      form.reset();
      setTags([]);
      setOpen(false);
    }
  };

  const handleSubmit = (values: PaymentFormValues) => {
    processSubmit(values, false);
  };

  const handleSubmitAndContinue = () => {
    form.handleSubmit((values) => processSubmit(values, true))();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="gap-2 shadow-soft">
            <Plus className="h-5 w-5" />
            Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a new income or expense transaction to track your finances.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            {/* Transaction Type Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button
                type="button"
                variant={isExpense ? "default" : "ghost"}
                className={cn(
                  "flex-1 gap-2",
                  isExpense && "bg-expense hover:bg-expense/90"
                )}
                onClick={() => {
                  setIsExpense(true);
                  form.setValue('isExpense', true);
                  form.setValue('category', '');
                }}
              >
                <Minus className="h-4 w-4" />
                Expense
              </Button>
              <Button
                type="button"
                variant={!isExpense ? "default" : "ghost"}
                className={cn(
                  "flex-1 gap-2",
                  !isExpense && "bg-income hover:bg-income/90"
                )}
                onClick={() => {
                  setIsExpense(false);
                  form.setValue('isExpense', false);
                  form.setValue('category', 'income');
                }}
              >
                <Plus className="h-4 w-4" />
                Income
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                        <Input 
                          {...field} 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00" 
                          className="pl-8 font-mono"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "MMM d, yyyy") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="merchantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isExpense ? 'Merchant / Payee' : 'Source'}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isExpense ? "e.g. Supermarket" : "e.g. Salary"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <CategoryCombobox
                        value={field.value}
                        onChange={field.onChange}
                        categories={categories}
                        isLoading={categoriesLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select wallet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione (opzionale)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Aggiungi una nota..." 
                      className="resize-none"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tag (opzionale)</Label>
              <TagInput tags={tags} onChange={setTags} maxTags={5} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                className="flex-1" 
                disabled={isLoading || categoriesLoading}
                onClick={handleSubmitAndContinue}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Adding...' : 'Add & Add Another'}
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isLoading || categoriesLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Adding...' : 'Add Transaction'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
