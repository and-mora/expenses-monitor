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
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { ElementType, CSSProperties } from 'react';
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDate, capitalize } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { PaymentTags } from './PaymentTags';
import { EditPaymentDialog } from './EditPaymentDialog';
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
  const dynamicIcon = payment.categoryIcon
    ? (LucideIcons as unknown as Record<string, React.ComponentType<unknown>>)[payment.categoryIcon]
    : undefined;
  const Icon = (dynamicIcon as ElementType) || categoryIcons[category] || categoryIcons.other;
  const colorClass = categoryColors[category] || categoryColors.other;
  const isIncome = payment.amountInCents > 0;
  const hasTags = payment.tags && payment.tags.length > 0;
  const hasDescription = payment.description && payment.description.trim().length > 0;
  const isDetailed = variant === 'detailed';
  const canExpand = isDetailed && (hasDescription || hasTags || payment.id);
  
  // Swipe gesture state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeThreshold = 100; // Minimum distance to trigger action reveal
  const maxSwipeOffset = 192; // Maximum swipe distance

  const handleToggleExpand = () => {
    setSwipeOffset(0);
    onToggleExpand?.();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onEdit && !onDelete) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || (!onEdit && !onDelete)) return;

    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const diffX = touchStartX.current - touchCurrentX;
    const diffY = Math.abs(touchStartY.current - touchCurrentY);

    // Only swipe horizontally if horizontal movement > vertical movement
    if (Math.abs(diffX) > diffY) {
      e.preventDefault(); // Prevent scroll when swiping
      const newOffset = Math.max(0, Math.min(maxSwipeOffset, diffX));
      setSwipeOffset(newOffset);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    // Snap to revealed or hidden state
    if (swipeOffset > swipeThreshold / 2) {
      setSwipeOffset(maxSwipeOffset);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleAction = (action: () => void) => {
    action();
    setSwipeOffset(0); // Reset swipe after action
  };

  const isSwipeRevealed = swipeOffset >= swipeThreshold;
  
  return (
    <div className="animate-slide-up relative overflow-hidden" style={style}>
      <div className="relative">
        {/* Swipe Action Buttons (hidden behind card, revealed on swipe) */}
        {(onEdit || onDelete) && (
          <div className="absolute right-0 top-0 bottom-0 w-[192px] flex items-center justify-center gap-3 bg-muted/40">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full bg-primary/15 text-primary hover:text-primary hover:bg-primary/25"
                onClick={() => handleAction(() => onEdit(payment))}
                disabled={isDeleting}
              >
                <Edit2 className="h-5 w-5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full bg-destructive/15 text-destructive hover:text-destructive hover:bg-destructive/25"
                onClick={() => handleAction(() => onDelete(payment.id))}
                disabled={isDeleting}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Main Card Content */}
        <div 
          ref={containerRef}
          className={cn(
            "group relative z-10 flex items-center gap-4 rounded-lg bg-card p-3",
            canExpand && !isSwipeRevealed ? "cursor-pointer hover:bg-muted/70" : "hover:bg-muted/50",
            isSwiping ? "transition-none" : "duration-200"
          )}
          style={{
            transform: `translateX(-${swipeOffset}px)`,
            transition: isSwiping ? 'none' : 'transform 200ms ease-out',
            willChange: 'transform',
          }}
          onClick={() => {
            if (isSwipeRevealed) {
              setSwipeOffset(0);
              return;
            }
            if (canExpand) {
              handleToggleExpand();
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
        <div className={cn("p-2.5 rounded-xl", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{payment.merchantName}</p>
          <p className="text-sm text-muted-foreground truncate md:hidden">
            {formatDate(payment.accountingDate)}
          </p>
          <p className="text-sm text-muted-foreground truncate hidden md:block">
            {capitalize(payment.category)} • {formatDate(payment.accountingDate)}
          </p>
        </div>
        
        <div className="text-right flex items-center gap-1 shrink-0 ml-auto">
          <span className={cn(
            "font-semibold font-mono tabular-nums whitespace-nowrap min-w-[90px]",
            isIncome ? "text-income" : "text-expense"
          )}>
            {formatCurrency(payment.amountInCents, 'EUR', true)}
          </span>
          
          {canExpand && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label={isExpanded ? 'Collapse transaction' : 'Expand transaction'}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand();
              }}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          
          {/* Desktop hover buttons - hidden on mobile */}
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden md:inline-flex opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
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
              className="h-8 w-8 hidden md:inline-flex opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
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
      </div>

      {/* Expanded Section */}
      {isExpanded && isDetailed && (
        <div className="px-3 pb-3 pt-0 space-y-3 animate-slide-down">
          <div className="ml-14 mr-3 pt-3 space-y-2 border-t">
            <div className="flex items-start gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Wallet</p>
                <p className="text-sm">{payment.wallet}</p>
              </div>
            </div>

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
