import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import type { Wallet, CategoryItem } from '@/types/api';

export interface TransactionFiltersProps {
  // Filter state
  readonly searchQuery: string;
  readonly selectedCategory: string;
  readonly selectedWallet: string;
  readonly dateFrom: string;
  readonly dateTo: string;
  // Actions
  readonly onSearchChange: (query: string) => void;
  readonly onCategoryChange: (category: string) => void;
  readonly onWalletChange: (wallet: string) => void;
  readonly onDateFromChange: (date: string) => void;
  readonly onDateToChange: (date: string) => void;
  readonly onClearFilters: () => void;
  // Data
  readonly categories: CategoryItem[];
  readonly wallets: Wallet[];
  // Computed
  readonly activeFiltersCount: number;
  readonly hasActiveFilters: boolean;
}

export function TransactionFilters({
  searchQuery,
  selectedCategory,
  selectedWallet,
  dateFrom,
  dateTo,
  onSearchChange,
  onCategoryChange,
  onWalletChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  categories,
  wallets,
  activeFiltersCount,
  hasActiveFilters,
}: TransactionFiltersProps) {
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const handleClearFilters = () => {
    onClearFilters();
    setFilterSheetOpen(false);
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Mobile: Search Bar + Filter Button */}
      <div className="flex gap-2 md:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Filter Sheet Trigger */}
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="default" className="relative" aria-label="Filter transactions">
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Transactions</SheetTitle>
              <SheetDescription>
                Apply filters to refine your transaction list
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <label htmlFor="category-filter" className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger id="category-filter" aria-label="Category filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => {
                      const id = typeof category === 'string' ? category : category.id;
                      const name = typeof category === 'string' ? category : category.name;
                      const display = name ? (name.charAt(0).toUpperCase() + name.slice(1)) : id;
                      return (
                        <SelectItem key={id} value={id}>
                          {display}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Wallet Filter */}
              <div className="space-y-2">
                <label htmlFor="wallet-filter" className="text-sm font-medium">Wallet</label>
                <Select value={selectedWallet} onValueChange={onWalletChange}>
                  <SelectTrigger id="wallet-filter" aria-label="Wallet filter">
                    <SelectValue placeholder="All Wallets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wallets</SelectItem>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.name}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div className="space-y-2">
                <label htmlFor="date-from-filter" className="text-sm font-medium">From Date</label>
                <Input
                  id="date-from-filter"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                />
              </div>

              {/* Date To Filter */}
              <div className="space-y-2">
                <label htmlFor="date-to-filter" className="text-sm font-medium">To Date</label>
                <Input
                  id="date-to-filter"
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1"
                  disabled={!hasActiveFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button
                  onClick={() => setFilterSheetOpen(false)}
                  className="flex-1"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Full Search Bar */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by merchant or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Desktop: Filter Controls */}
      <div className="hidden md:flex flex-col sm:flex-row gap-3">
        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => {
              const id = typeof category === 'string' ? category : category.id;
              const name = typeof category === 'string' ? category : category.name;
              const display = name ? (name.charAt(0).toUpperCase() + name.slice(1)) : id;
              return (
                <SelectItem key={id} value={id}>
                  {display}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Wallet Filter */}
        <Select value={selectedWallet} onValueChange={onWalletChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Wallets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wallets</SelectItem>
            {wallets.map((wallet) => (
              <SelectItem key={wallet.id} value={wallet.name}>
                {wallet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From Filter */}
        <Input
          type="date"
          placeholder="From date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-full sm:w-[180px]"
        />

        {/* Date To Filter */}
        <Input
          type="date"
          placeholder="To date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-full sm:w-[180px]"
        />

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="sm:ml-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
