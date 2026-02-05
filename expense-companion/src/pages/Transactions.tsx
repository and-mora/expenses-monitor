import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { TransactionTimeline } from '@/components/dashboard/TransactionTimeline';
import { AddPaymentDialog } from '@/components/dashboard/AddPaymentDialog';
import { EditPaymentDialog } from '@/components/dashboard/EditPaymentDialog';
import { 
  usePayments,
  useInfinitePayments,
  useWallets, 
  useCreatePayment, 
  useDeletePayment,
  useCategories
} from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter, Plus, Loader2 } from 'lucide-react';
import type { Payment } from '@/types/api';

const PAGE_SIZE = 50;
const LAYOUT_STORAGE_KEY = 'transactions-layout';
type TransactionsLayout = 'list' | 'timeline';

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [layout] = useState<TransactionsLayout>(() => {
    if (typeof window === 'undefined') return 'timeline';
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY) as TransactionsLayout | null;
    return stored === 'list' || stored === 'timeline' ? stored : 'timeline';
  });
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Ref for infinite scroll sentinel
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Build filters object for API
  const filters = useMemo(() => {
    const apiFilters: {
      category?: string;
      wallet?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {};
    
    if (selectedCategory !== 'all') {
      apiFilters.category = selectedCategory;
    }
    if (selectedWallet !== 'all') {
      apiFilters.wallet = selectedWallet;
    }
    if (searchQuery) {
      apiFilters.search = searchQuery;
    }
    if (dateFrom) {
      apiFilters.dateFrom = dateFrom;
    }
    if (dateTo) {
      apiFilters.dateTo = dateTo;
    }
    
    return Object.keys(apiFilters).length > 0 ? apiFilters : undefined;
  }, [searchQuery, selectedCategory, selectedWallet, dateFrom, dateTo]);

  // Use different queries based on layout
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments(
    currentPage, 
    PAGE_SIZE, 
    layout === 'list' ? filters : undefined
  );
  
  const {
    data: infiniteData,
    isLoading: infiniteLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePayments(PAGE_SIZE, layout === 'timeline' ? filters : undefined);
  
  const { data: wallets = [], isLoading: walletsLoading } = useWallets();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  const createPayment = useCreatePayment();
  const deletePayment = useDeletePayment();

  // Flatten infinite query data for timeline
  const timelinePayments = useMemo(() => {
    if (!infiniteData?.pages) return [];
    return infiniteData.pages.flatMap(page => page.content);
  }, [infiniteData]);

  const payments = layout === 'timeline' ? timelinePayments : (paymentsData?.content || []);
  const currentPageNumber = paymentsData?.page || 0;

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || layout !== 'timeline') return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver, layout]);

  const handleCreatePayment = async (data: Parameters<typeof createPayment.mutate>[0]) => {
    try {
      await createPayment.mutateAsync(data);
      toast.success('Transaction added successfully');
    } catch (error) {
      toast.error('Failed to add transaction');
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      await deletePayment.mutateAsync(id);
      toast.success('Transaction deleted');
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedWallet('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(0);
    setFilterSheetOpen(false);
  };

  // Count active filters (excluding search)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedWallet !== 'all') count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [selectedCategory, selectedWallet, dateFrom, dateTo]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedWallet !== 'all' || dateFrom || dateTo;
  const isLoading = (layout === 'timeline' ? infiniteLoading : paymentsLoading) || walletsLoading || categoriesLoading;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header className="border-b bg-card/80 backdrop-blur-xs sticky top-0 z-50" />
      
      <main className="container px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8 max-w-7xl">
        {/* Page Header - Desktop Only */}
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!walletsLoading && wallets.length > 0 && (
              <AddPaymentDialog 
                wallets={wallets} 
                onSubmit={handleCreatePayment}
                isLoading={createPayment.isPending}
              />
            )}
          </div>
        </div>

        {/* Mobile Header - Compact */}
        <div className="md:hidden mb-4">
          <h1 className="text-xl font-bold tracking-tight">Transactions</h1>
        </div>

        {/* Filters Section */}
        <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
          {/* Mobile: Search Bar + Filter Button */}
          <div className="flex gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(0);
                  }}
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
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => {
                        setSelectedCategory(value);
                        setCurrentPage(0);
                      }}
                    >
                      <SelectTrigger id="category-filter" aria-label="Category filter">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Wallet Filter */}
                  <div className="space-y-2">
                    <label htmlFor="wallet-filter" className="text-sm font-medium">Wallet</label>
                    <Select
                      value={selectedWallet}
                      onValueChange={(value) => {
                        setSelectedWallet(value);
                        setCurrentPage(0);
                      }}
                    >
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
                    <label className="text-sm font-medium">From Date</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setCurrentPage(0);
                      }}
                    />
                  </div>

                  {/* Date To Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Date</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setCurrentPage(0);
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(0);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Desktop: Filter Controls */}
          <div className="hidden md:flex flex-col sm:flex-row gap-3">
            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setCurrentPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Wallet Filter */}
            <Select
              value={selectedWallet}
              onValueChange={(value) => {
                setSelectedWallet(value);
                setCurrentPage(0);
              }}
            >
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
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full sm:w-[180px]"
            />

            {/* Date To Filter */}
            <Input
              type="date"
              placeholder="To date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full sm:w-[180px]"
            />

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="sm:ml-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results Count */}
          <div className="text-xs md:text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : layout === 'timeline' ? (
              <>
                {payments.length} transaction{payments.length !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Showing </span>
                {payments.length} transaction{payments.length !== 1 ? 's' : ''}
                <span className="hidden sm:inline"> on page {currentPageNumber + 1}</span>
              </>
            )}
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        {!walletsLoading && wallets.length > 0 && (
          <div className="md:hidden fixed bottom-20 right-4 z-40">
            <AddPaymentDialog 
              wallets={wallets} 
              onSubmit={handleCreatePayment}
              isLoading={createPayment.isPending}
              trigger={
                <Button 
                  size="icon" 
                  className="h-14 w-14 rounded-full shadow-lg [&_svg]:size-6"
                  aria-label="Add transaction"
                >
                  <Plus />
                </Button>
              }
            />
          </div>
        )}

        {/* Transactions List */}
        {isLoading ? (
          <Skeleton className="h-[600px] rounded-xl" />
        ) : layout === 'timeline' ? (
          <>
            <TransactionTimeline
              payments={payments}
              onDelete={handleDeletePayment}
              onEdit={setEditingPayment}
              isDeleting={deletePayment.isPending}
            />
            {/* Infinite scroll sentinel and loader */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
              {!hasNextPage && payments.length > 0 && (
                <p className="text-sm text-muted-foreground">No more transactions</p>
              )}
            </div>
          </>
        ) : (
          <TransactionList
            payments={payments}
            onDelete={handleDeletePayment}
            onEdit={true}
            isDeleting={deletePayment.isPending}
            className="max-w-none"
            variant="detailed"
            title={null}
          />
        )}

        {/* Pagination Controls */}
        {!isLoading && layout === 'list' && payments.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => currentPage > 0 && handlePageChange(currentPage - 1)}
                    className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {/* Show page numbers */}
                {(() => {
                  // Calculate total possible pages based on current page and data
                  // We know there's at least currentPage + 1 pages, and potentially more if we have PAGE_SIZE items
                  const knownPages = currentPage + 1 + (payments.length === PAGE_SIZE ? 1 : 0);
                  
                  // Show up to 5 page numbers centered around current page
                  const maxPagesToShow = 5;
                  const totalPages = Math.max(knownPages, currentPage + 1);
                  const pagesToShow = Math.min(maxPagesToShow, totalPages);
                  
                  // Center the current page in the visible range
                  let startPage = Math.max(0, currentPage - Math.floor(pagesToShow / 2));
                  // Adjust if we're at the end
                  startPage = Math.min(startPage, Math.max(0, totalPages - pagesToShow));
                  
                  return [...Array(pagesToShow)].map((_, i) => {
                    const pageNum = startPage + i;
                    // Include currentPage in key to avoid collisions during page transitions
                    return (
                      <PaginationItem key={`pagination-current${currentPage}-page${pageNum}`}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pageNum === currentPage}
                          className="cursor-pointer"
                          aria-label={`Go to page ${pageNum + 1}`}
                          aria-current={pageNum === currentPage ? 'page' : undefined}
                          role="button"
                        >
                          {pageNum + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  });
                })()}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => payments.length === PAGE_SIZE && handlePageChange(currentPage + 1)}
                    className={payments.length < PAGE_SIZE ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <EditPaymentDialog
          key={editingPayment?.id}
          payment={editingPayment}
          open={!!editingPayment}
          onOpenChange={(open) => !open && setEditingPayment(null)}
          onSave={() => setEditingPayment(null)}
        />

        {/* Empty State */}
        {!isLoading && payments.length === 0 && hasActiveFilters && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}

        {!isLoading && payments.length === 0 && !hasActiveFilters && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No transactions yet</p>
            <p className="text-sm mt-1">Add your first transaction to get started</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Transactions;
