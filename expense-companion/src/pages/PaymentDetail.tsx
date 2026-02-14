import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentTags } from '@/components/dashboard/PaymentTags';
import { EditPaymentDialog } from '@/components/dashboard/EditPaymentDialog';
import { useDeletePayment } from '@/hooks/use-api';
import { queryKeys } from '@/hooks/use-api';
import { capitalize, formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Trash2,
  Edit2,
  Wallet,
  Calendar,
  Tag,
  FileText,
  ShoppingBag,
  Utensils,
  Car,
  Film,
  Zap,
  Heart,
  TrendingUp,
  CircleDot,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { ElementType } from 'react';
import type { Payment } from '@/types/api';

const categoryIcons: Record<string, ElementType> = {
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  entertainment: Film,
  utilities: Zap,
  health: Heart,
  income: TrendingUp,
  other: CircleDot,
};

const PaymentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const deletePayment = useDeletePayment();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const hasRedirected = useRef(false);

  // Get payment from navigation state or from cache
  const payment = useMemo(() => {
    // First, check if passed via navigation state
    const statePayment = (location.state as { payment?: Payment })?.payment;
    if (statePayment) {
      return statePayment;
    }

    // If not in state, try to find in cache
    if (id) {
      const cachedData = queryClient.getQueriesData<{ content: Payment[] }>({
        queryKey: queryKeys.payments,
      });
      
      for (const [, data] of cachedData) {
        if (data?.content) {
          const found = data.content.find((p: Payment) => p.id === id);
          if (found) {
            return found;
          }
        }
      }
    }

    return null;
  }, [id, location.state, queryClient]);

  // Handle redirect when payment is not found
  useEffect(() => {
    if (!payment && !hasRedirected.current) {
      hasRedirected.current = true;
      toast.error('Payment not found');
      navigate('/transactions', { replace: true });
    }
  }, [payment, navigate]);

  const handleDelete = async () => {
    if (!payment) return;
    
    try {
      await deletePayment.mutateAsync(payment.id);
      toast.success('Transaction deleted');
      navigate('/transactions', { replace: true });
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const handleBack = () => {
    // Use browser history if available, otherwise go to transactions
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/transactions');
    }
  };

  if (!payment) {
    // Show loading skeleton while redirecting
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 px-4 pt-6 pb-24">
          <div className="max-w-lg mx-auto space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const dynamicIcon = payment.categoryIcon
    ? (LucideIcons as unknown as Record<string, React.ComponentType<unknown>>)[payment.categoryIcon]
    : undefined;
  const Icon = (dynamicIcon as ElementType) || categoryIcons[payment.category.toLowerCase()] || categoryIcons.other;
  const hasTags = payment.tags && payment.tags.length > 0;
  const hasDescription = payment.description && payment.description.trim().length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 px-4 pt-6 pb-24">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Main info card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Category icon */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-7 w-7 text-muted-foreground" />
                </div>
                
                {/* Merchant and amount */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {payment.merchantName}
                  </h2>
                  <Badge variant="secondary" className="mt-1">
                    {capitalize(payment.category)}
                  </Badge>
                </div>
              </div>

              {/* Amount */}
              <div className="mt-6 text-center">
                <p
                  className={cn(
                    'text-3xl font-bold font-mono tabular-nums',
                    payment.amountInCents > 0 ? 'text-income' : 'text-expense'
                  )}
                >
                  {formatCurrency(payment.amountInCents, 'EUR', true)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Details card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">
                    {formatDate(payment.accountingDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Wallet */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Wallet</p>
                  <p className="text-sm font-medium">{payment.wallet}</p>
                </div>
              </div>

              {/* Description */}
              {hasDescription && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm font-medium">{payment.description}</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {hasTags && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Tags</p>
                    <PaymentTags tags={payment.tags!} maxVisible={999} variant="full" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction ID */}
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {payment.id}
              </p>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={handleDelete}
              disabled={deletePayment.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <EditPaymentDialog
        payment={payment}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={() => {
          // Navigate back after successful edit since we can't get the updated payment
          navigate('/transactions', { replace: true });
        }}
      />
    </div>
  );
};

export default PaymentDetail;
