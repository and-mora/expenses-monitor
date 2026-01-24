import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  totalInCents: number;
  currency?: string;
  incomeInCents: number;
  expensesInCents: number;
  className?: string;
}

export function BalanceCard({ 
  totalInCents, 
  currency = 'EUR',
  incomeInCents,
  expensesInCents,
  className 
}: BalanceCardProps) {
  const isPositive = totalInCents >= 0;
  
  return (
    <Card className={cn(
      "overflow-hidden border-0 shadow-card bg-gradient-to-br from-primary to-primary/90",
      className
    )}>
      <CardContent className="p-6 text-primary-foreground">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">Total Balance</span>
        </div>
        
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-4xl font-bold font-mono tracking-tight">
            {formatCurrency(totalInCents, currency)}
          </span>
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-income" />
          ) : (
            <TrendingDown className="h-5 w-5 text-expense" />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
            <div className="p-2 rounded-full bg-income/20">
              <ArrowUpRight className="h-4 w-4 text-income" />
            </div>
            <div>
              <p className="text-xs opacity-70">Income</p>
              <p className="font-semibold font-mono text-income">
                {formatCurrency(incomeInCents, currency)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
            <div className="p-2 rounded-full bg-expense/20">
              <ArrowDownRight className="h-4 w-4 text-expense" />
            </div>
            <div>
              <p className="text-xs opacity-70">Expenses</p>
              <p className="font-semibold font-mono text-expense">
                {formatCurrency(Math.abs(expensesInCents), currency)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
