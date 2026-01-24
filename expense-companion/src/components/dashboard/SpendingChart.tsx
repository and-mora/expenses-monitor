import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, capitalize } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Payment } from '@/types/api';

// Palette di colori per categorie
const categoryColors = [
  '#f97316', '#06b6d4', '#a855f7', '#ec4899', 
  '#10b981', '#eab308', '#f59e0b', '#3b82f6',
  '#8b5cf6', '#14b8a6', '#f43f5e', '#6366f1'
];

const getCategoryColor = (index: number): string => {
  return categoryColors[index % categoryColors.length];
};

interface SpendingChartProps {
  payments: Payment[];
  className?: string;
}

export function SpendingChart({ payments, className }: SpendingChartProps) {
  const categoryData = useMemo(() => {
    const expenses = payments.filter(p => p.amountInCents < 0);
    const byCategory: Record<string, number> = {};
    
    expenses.forEach(payment => {
      const category = payment.category.toLowerCase();
      byCategory[category] = (byCategory[category] || 0) + Math.abs(payment.amountInCents);
    });
    
    const total = Object.values(byCategory).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(byCategory)
      .map(([name, value], index) => ({
        name: capitalize(name),
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
        color: getCategoryColor(index),
      }))
      .sort((a, b) => b.value - a.value);
  }, [payments]);

  if (categoryData.length === 0) {
    return (
      <Card className={cn("border shadow-card", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No expense data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border shadow-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center gap-6">
          <div style={{ width: 160, height: 160, flexShrink: 0 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{ fill: entry.color }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 space-y-2">
            {categoryData.slice(0, 5).map((category, index) => (
              <div 
                key={category.name}
                className="flex items-center gap-3 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div 
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium truncate">{category.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">{category.percentage}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatCurrency(category.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
