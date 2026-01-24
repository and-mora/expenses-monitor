import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Minus, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { TagInput } from './TagInput';
import type { Wallet, Tag } from '@/types/api';

const paymentSchema = z.object({
  merchantName: z.string().min(1, 'Merchant name is required').max(100),
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
  accountingDate: z.date({ required_error: 'Date is required' }),
  description: z.string().max(500).optional(),
  wallet: z.string().min(1, 'Wallet is required'),
  isExpense: z.boolean(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface AddPaymentDialogProps {
  wallets: Wallet[];
  onSubmit: (data: {
    merchantName: string;
    amountInCents: number;
    category: string;
    accountingDate: string;
    description?: string;
    wallet: string;
    tags?: Tag[];
  }) => void;
  isLoading?: boolean;
}

export function AddPaymentDialog({ wallets, onSubmit, isLoading }: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExpense, setIsExpense] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Get filtered categories based on expense/income mode from backend
  const categoryType = isExpense ? 'expense' : 'income';
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', categoryType],
    queryFn: () => apiClient.getCategories(categoryType),
  });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      merchantName: '',
      amount: '',
      category: '',
      description: '',
      wallet: wallets[0]?.id || '',
      isExpense: true,
      accountingDate: new Date(),
    },
  });

  const handleSubmit = (values: PaymentFormValues) => {
    const amountInCents = Math.round(parseFloat(values.amount) * 100);
    
    // Find wallet name from ID
    const selectedWallet = wallets.find(w => w.id === values.wallet);
    
    const paymentData = {
      merchantName: values.merchantName,
      amountInCents: values.isExpense ? -amountInCents : amountInCents,
      category: values.category,
      accountingDate: format(values.accountingDate, "yyyy-MM-dd'T'HH:mm:ss"),
      description: values.description,
      wallet: selectedWallet?.name || values.wallet,
      tags: tags.length > 0 ? tags : undefined,
    };
    
    console.log('[AddPaymentDialog] Submitting payment with tags:', tags);
    console.log('[AddPaymentDialog] Full payment data:', paymentData);
    
    onSubmit(paymentData);
    
    form.reset();
    setTags([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-soft">
          <Plus className="h-5 w-5" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
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
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    {categoriesLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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

            <Button type="submit" className="w-full" disabled={isLoading || categoriesLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
