import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  Film, 
  Zap, 
  Heart, 
  TrendingUp,
  CircleDot,
  Trash2,
  Edit2
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatRelativeDate, capitalize } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { PaymentTags } from './PaymentTags';
import { EditPaymentDialog } from './EditPaymentDialog';
import type { Payment } from '@/types/api';

const categoryIcons: Record<string, React.ElementType> = {
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  entertainment: Film,
  utilities: Zap,
  health: Heart,
  income: TrendingUp,
  other: CircleDot,
};

const categoryColors: Record<string, string> = {
  food: 'bg-category-food/10 text-category-food',
  transport: 'bg-category-transport/10 text-category-transport',
  shopping: 'bg-category-shopping/10 text-category-shopping',
  entertainment: 'bg-category-entertainment/10 text-category-entertainment',
  utilities: 'bg-category-utilities/10 text-category-utilities',
  health: 'bg-category-health/10 text-category-health',
  income: 'bg-category-income/10 text-category-income',
  other: 'bg-category-other/10 text-category-other',
};

interface TransactionListProps {
  payments: Payment[];
  onDelete?: (id: string) => void;
  onEdit?: boolean; // Enable edit functionality
  isDeleting?: boolean;
  className?: string;
}

export function TransactionList({ 
  payments, 
  onDelete, 
  onEdit = false,
  isDeleting,
  className 
}: TransactionListProps) {
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  
  return (
    <Card className={cn("border shadow-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-0">
        <ScrollArea className="h-[400px]">
          <div className="pb-6 space-y-1">
            {payments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CircleDot className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No transactions yet</p>
                <p className="text-sm">Add your first expense or income</p>
              </div>
            ) : (
              payments.map((payment, index) => (
                <TransactionItem 
                  key={payment.id} 
                  payment={payment} 
                  onDelete={onDelete}
                  onEdit={onEdit ? setEditingPayment : undefined}
                  isDeleting={isDeleting}
                  style={{ animationDelay: `${index * 30}ms` }}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {onEdit && (
        <EditPaymentDialog
          key={editingPayment?.id}
          payment={editingPayment}
          open={!!editingPayment}
          onOpenChange={(open) => !open && setEditingPayment(null)}
          onSave={() => setEditingPayment(null)}
        />
      )}
    </Card>
  );
}

interface TransactionItemProps {
  payment: Payment;
  onDelete?: (id: string) => void;
  onEdit?: (payment: Payment) => void;
  isDeleting?: boolean;
  style?: React.CSSProperties;
}

function TransactionItem({ payment, onDelete, onEdit, isDeleting, style }: TransactionItemProps) {
  const category = payment.category.toLowerCase();
  const Icon = categoryIcons[category] || categoryIcons.other;
  const colorClass = categoryColors[category] || categoryColors.other;
  const isIncome = payment.amountInCents > 0;
  const hasTags = payment.tags && payment.tags.length > 0;
  
  return (
    <div 
      className="group flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors animate-slide-up"
      style={style}
    >
      <div className={cn("p-2.5 rounded-xl", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{payment.merchantName}</p>
          {hasTags && (
            <PaymentTags tags={payment.tags!} maxVisible={3} />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {capitalize(payment.category)} • {formatRelativeDate(payment.accountingDate)}
        </p>
      </div>
      
      <div className="text-right flex items-center gap-1">
        <span className={cn(
          "font-semibold font-mono tabular-nums",
          isIncome ? "text-income" : "text-expense"
        )}>
          {formatCurrency(payment.amountInCents, 'EUR', true)}
        </span>
        
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
            onClick={() => onEdit(payment)}
            disabled={isDeleting}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(payment.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
