import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, CreditCard, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Wallet } from '@/types/api';

const walletSchema = z.object({
  name: z.string().min(1, 'Wallet name is required').max(50),
});

type WalletFormValues = z.infer<typeof walletSchema>;

const currencies = [
  { value: 'EUR', label: '€ EUR - Euro' },
  { value: 'USD', label: '$ USD - US Dollar' },
  { value: 'GBP', label: '£ GBP - British Pound' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
];

const walletColors = [
  'from-primary to-primary/80',
  'from-chart-2 to-chart-2/80',
  'from-chart-3 to-chart-3/80',
  'from-chart-5 to-chart-5/80',
  'from-chart-6 to-chart-6/80',
];

interface WalletListProps {
  wallets: Wallet[];
  onCreateWallet: (data: WalletFormValues) => void;
  onDeleteWallet: (id: string) => void;
  isCreating?: boolean;
  isDeleting?: boolean;
  className?: string;
}

export function WalletList({ 
  wallets, 
  onCreateWallet, 
  onDeleteWallet,
  isCreating,
  isDeleting,
  className 
}: WalletListProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: '',
    },
  });

  const handleSubmit = (values: WalletFormValues) => {
    onCreateWallet(values);
    form.reset();
    setOpen(false);
  };

  return (
    <Card className={cn("border shadow-card", className)}>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Wallets</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Wallet</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Main Account" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Wallet
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {wallets.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No wallets yet</p>
          </div>
        ) : (
          wallets.map((wallet, index) => (
            <div
              key={wallet.id}
              className={cn(
                "group relative flex items-center gap-3 p-3 rounded-xl text-white animate-slide-up",
                "bg-gradient-to-r",
                walletColors[index % walletColors.length]
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-2 rounded-lg bg-white/20">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{wallet.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white hover:bg-white/20"
                onClick={() => onDeleteWallet(wallet.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
