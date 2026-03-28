import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link2, Loader2 } from 'lucide-react';
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

const connectionSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  connectionLabel: z.string().max(120, 'Connection label is too long').optional().or(z.literal('')),
  accountId: z.string().max(120, 'Account ID is too long').optional().or(z.literal('')),
  redirectUri: z.string().url('Redirect URI must be a valid URL'),
});

export type BankConnectionFormValues = z.infer<typeof connectionSchema>;

interface BankConnectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BankConnectionFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

const defaultRedirectUri = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return `${window.location.origin}/banking`;
};

export function BankConnectionSheet({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: BankConnectionSheetProps) {
  const defaultValues = useMemo<BankConnectionFormValues>(
    () => ({
      provider: 'mock',
      connectionLabel: '',
      accountId: '',
      redirectUri: defaultRedirectUri(),
    }),
    [],
  );

  const form = useForm<BankConnectionFormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = async (values: BankConnectionFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
    form.reset(defaultValues);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Connect a bank</SheetTitle>
          <SheetDescription>
            Start a PSD2 bank connection and receive an authorization link from the backend.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mock">Mock provider</SelectItem>
                      <SelectItem value="nordigen">Nordigen</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="connectionLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection label</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Household Checking" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional provider account identifier" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="redirectUri"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redirect URI</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://app.example.com/banking" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  The backend returns an authorization URL. No raw tokens are exposed in the UI.
                </p>
              </div>
            </div>

            <SheetFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create connection
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
