import { useMemo, useRef, useState } from 'react';
import type { ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { capitalize, formatCurrency, formatDate } from '@/lib/formatters';
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
  ChevronRight,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
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

interface TransactionTimelineProps {
  payments: Payment[];
  onDelete?: (id: string) => void;
  onEdit?: (payment: Payment) => void;
  isDeleting?: boolean;
  className?: string;
}

export function TransactionTimeline({
  payments,
  onDelete,
  onEdit,
  isDeleting,
  className,
}: TransactionTimelineProps) {
  const groupedPayments = useMemo(() => {
    const groups = new Map<string, { date: string; items: Payment[]; totalInCents: number }>();

    payments.forEach((payment) => {
      const dateKey = payment.accountingDate.split('T')[0];
      const existing = groups.get(dateKey);
      if (existing) {
        existing.items.push(payment);
        existing.totalInCents += payment.amountInCents;
      } else {
        groups.set(dateKey, {
          date: dateKey,
          items: [payment],
          totalInCents: payment.amountInCents,
        });
      }
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => b.accountingDate.localeCompare(a.accountingDate)),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [payments]);

  return (
    <div className={cn('space-y-6', className)}>
      {groupedPayments.map((group) => (
        <section key={group.date} className="space-y-3">
          <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {formatDate(group.date, 'MMM d, yyyy')}
              </h3>
              <Badge variant="secondary" className="font-mono">
                {formatCurrency(group.totalInCents, 'EUR', true)}
              </Badge>
            </div>
          </div>

          <Card className="border shadow-card overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y">
                {group.items.map((item) => (
                  <TimelineItem
                    key={item.id}
                    payment={item}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}

interface TimelineItemProps {
  payment: Payment;
  onDelete?: (id: string) => void;
  onEdit?: (payment: Payment) => void;
  isDeleting?: boolean;
}

function TimelineItem({
  payment,
  onDelete,
  onEdit,
  isDeleting,
}: TimelineItemProps) {
  const navigate = useNavigate();
  const dynamicIcon = payment.categoryIcon
    ? (LucideIcons as unknown as Record<string, React.ComponentType<unknown>>)[payment.categoryIcon]
    : undefined;
  const Icon = (dynamicIcon as ElementType) || categoryIcons[payment.category.toLowerCase()] || categoryIcons.other;

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionButtonsWidth = 120;
  const swipeThreshold = 60;

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

    // Only allow horizontal swipe if it's more horizontal than vertical
    if (Math.abs(diffX) > diffY) {
      e.preventDefault();
      const newOffset = Math.max(0, Math.min(actionButtonsWidth, diffX));
      setSwipeOffset(newOffset);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeOffset > swipeThreshold) {
      setSwipeOffset(actionButtonsWidth);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleAction = (action: () => void) => {
    action();
    setSwipeOffset(0);
  };

  const handleClick = () => {
    if (swipeOffset > 0) {
      setSwipeOffset(0);
      return;
    }
    navigate(`/transactions/${payment.id}`, { state: { payment } });
  };

  const isSwipeRevealed = swipeOffset > 0;

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Action buttons - positioned behind the main content */}
      {(onEdit || onDelete) && (
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 flex items-center justify-end gap-2 px-3 bg-muted/50",
            "transition-opacity duration-200",
            isSwipeRevealed ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{ width: actionButtonsWidth }}
        >
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-primary/15 text-primary hover:text-primary hover:bg-primary/25"
              onClick={() => handleAction(() => onEdit(payment))}
              disabled={isDeleting}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-destructive/15 text-destructive hover:text-destructive hover:bg-destructive/25"
              onClick={() => handleAction(() => onDelete(payment.id))}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          'relative flex items-center gap-3 py-3 px-4 bg-background cursor-pointer',
          'active:bg-muted/60',
          isSwiping ? 'transition-none' : 'transition-transform duration-200 ease-out'
        )}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Category icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Transaction info */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{payment.merchantName}</p>
          <p className="text-sm text-muted-foreground">
            {capitalize(payment.category)}
          </p>
        </div>

        {/* Amount and chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <p
            className={cn(
              'font-semibold font-mono tabular-nums',
              payment.amountInCents > 0 ? 'text-income' : 'text-expense'
            )}
          >
            {formatCurrency(payment.amountInCents, 'EUR', true)}
          </p>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
