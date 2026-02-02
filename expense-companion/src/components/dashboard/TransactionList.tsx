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
  Edit2,
  Wallet,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatRelativeDate, formatDate, capitalize } from '@/lib/formatters';
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
  variant?: 'compact' | 'detailed'; // New: compact for Dashboard, detailed for Transactions page
  title?: string | null; // Optional title, null to hide header
}

export function TransactionList({ 
  payments, 
  onDelete, 
  onEdit = false,
  isDeleting,
  className,
  variant = 'compact',
  title = 'Recent Transactions'
}: TransactionListProps) {
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const toggleExpand = (paymentId: string) => {
    setExpandedPaymentId(expandedPaymentId === paymentId ? null : paymentId);
  };

  // Calculate height: compact uses fixed height, detailed uses adaptive height
  const scrollAreaHeight = variant === 'compact' 
    ? 'h-[400px]' 
    : 'h-[calc(100vh-280px)] min-h-[500px]';
  
  return (
    <Card className={cn("border shadow-card", className)}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn("px-3", title ? "py-0" : "py-3")}>
        <ScrollArea className={scrollAreaHeight}>
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
                  variant={variant}
                  isExpanded={expandedPaymentId === payment.id}
                  onToggleExpand={() => toggleExpand(payment.id)}
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
  variant?: 'compact' | 'detailed';
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  style?: React.CSSProperties;
}

function TransactionItem({ 
  payment, 
  onDelete, 
  onEdit, 
  isDeleting, 
  variant = 'compact',
  isExpanded = false,
  onToggleExpand,
  style 
}: TransactionItemProps) {
  const category = payment.category.toLowerCase();
  const Icon = categoryIcons[category] || categoryIcons.other;
  const colorClass = categoryColors[category] || categoryColors.other;
  const isIncome = payment.amountInCents > 0;
  const hasTags = payment.tags && payment.tags.length > 0;
  const hasDescription = payment.description && payment.description.trim().length > 0;
  const isDetailed = variant === 'detailed';
  const canExpand = isDetailed && (hasDescription || hasTags || payment.id);
  
  return (
    <div className="animate-slide-up" style={style}>
      <div 
        className={cn(
          "group flex items-center gap-4 p-3 rounded-lg transition-colors",
          canExpand ? "cursor-pointer hover:bg-muted/70" : "hover:bg-muted/50"
        )}
        onClick={canExpand ? onToggleExpand : undefined}
      >
        <div className={cn("p-2.5 rounded-xl", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{payment.merchantName}</p>
            {hasTags && !isExpanded && (
              <PaymentTags tags={payment.tags!} maxVisible={3} />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {capitalize(payment.category)} • {formatRelativeDate(payment.accountingDate)}
          </p>
          {isDetailed && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                {payment.wallet}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(payment.accountingDate, 'yyyy-MM-dd')}
              </span>
            </div>
          )}
        </div>
        
        <div className="text-right flex items-center gap-1">
          <span className={cn(
            "font-semibold font-mono tabular-nums",
            isIncome ? "text-income" : "text-expense"
          )}>
            {formatCurrency(payment.amountInCents, 'EUR', true)}
          </span>
          
          {canExpand && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(payment);
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                onDelete(payment.id);
              }}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Section */}
      {isExpanded && isDetailed && (
        <div className="px-3 pb-3 pt-0 space-y-3 animate-slide-down">
          <div className="ml-14 mr-3 pt-3 space-y-2 border-t">
            {hasDescription && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Description</p>
                  <p className="text-sm">{payment.description}</p>
                </div>
              </div>
            )}
            
            {hasTags && (
              <div className="flex items-start gap-2">
                <div className="h-4 w-4" /> {/* Spacer for alignment */}
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tags</p>
                  <PaymentTags tags={payment.tags!} maxVisible={999} variant="full" />
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <div className="h-4 w-4" /> {/* Spacer for alignment */}
              <div className="flex-1">
                <p className="font-medium mb-0.5">Transaction ID</p>
                <p className="font-mono text-[10px] break-all">{payment.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
