import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useBalance } from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';

interface BalanceCardProps {
  currency?: string;
  className?: string;
}

type Period = 'all' | '3m' | '1y';

export function BalanceCard({ 
  currency = 'EUR',
  className 
}: BalanceCardProps) {
  const [period, setPeriod] = useState<Period>('all');
  
  // Calculate dates based on period
  const getDateRange = (period: Period): { startDate?: string; endDate?: string } => {
    if (period === 'all') return {};
    
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now);
    
    if (period === '3m') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate,
    };
  };
  
  const { startDate, endDate } = getDateRange(period);
  const { data: balance, isLoading } = useBalance(startDate, endDate);
  
  const totalInCents = balance?.totalInCents ?? 0;
  const incomeInCents = balance?.incomeInCents ?? 0;
  const expensesInCents = balance?.expensesInCents ?? 0;
  const isPositive = totalInCents >= 0;
  
  return (
    <Card className={cn(
      "overflow-hidden border-0 shadow-card bg-linear-to-br from-primary to-primary/90",
      className
    )}>
      <CardContent className="p-6 text-primary-foreground">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">Total Balance</span>
          </div>
          
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="bg-white/10 border-0">
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-white data-[state=active]:text-primary text-xs px-3"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="1y"
                className="data-[state=active]:bg-white data-[state=active]:text-primary text-xs px-3"
              >
                1Y
              </TabsTrigger>
              <TabsTrigger 
                value="3m"
                className="data-[state=active]:bg-white data-[state=active]:text-primary text-xs px-3"
              >
                3M
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-48 mb-6 bg-white/20" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 bg-white/10" />
              <Skeleton className="h-20 bg-white/10" />
            </div>
          </>
        ) : (
          <>
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
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-xs">
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
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-xs">
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
