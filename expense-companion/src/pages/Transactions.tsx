import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { TransactionTimeline } from '@/components/dashboard/TransactionTimeline';
import { AddPaymentDialog } from '@/components/dashboard/AddPaymentDialog';
import { EditPaymentDialog } from '@/components/dashboard/EditPaymentDialog';
import { TransactionFilters, TransactionPagination } from '@/components/transactions';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { 
  usePayments,
  useInfinitePayments,
  useWallets, 
  useCreatePayment, 
  useDeletePayment,
  useCategories
} from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import type { Payment } from '@/types/api';

const PAGE_SIZE = 50;
const LAYOUT_STORAGE_KEY = 'transactions-layout';
type TransactionsLayout = 'list' | 'timeline';

const Transactions = () => {
  const [layout] = useState<TransactionsLayout>(() => {
    if (typeof window === 'undefined') return 'timeline';
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY) as TransactionsLayout | null;
    return stored === 'list' || stored === 'timeline' ? stored : 'timeline';
  });
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Use extracted filters hook
  const {
    searchQuery,
    selectedCategory,
    selectedWallet,
    dateFrom,
    dateTo,
    currentPage,
    setSearchQuery,
    setSelectedCategory,
    setSelectedWallet,
    setDateFrom,
    setDateTo,
    clearFilters,
    handlePageChange,
    filters,
    activeFiltersCount,
    hasActiveFilters,
  } = useTransactionFilters();

  // Ref for infinite scroll sentinel
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
        <div className="mb-4 md:mb-6">
          <TransactionFilters
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedWallet={selectedWallet}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onWalletChange={setSelectedWallet}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onClearFilters={clearFilters}
            categories={categories}
            wallets={wallets}
            activeFiltersCount={activeFiltersCount}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Results Count */}
          <div className="text-xs md:text-sm text-muted-foreground mt-3 md:mt-4">
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
          <TransactionPagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            itemsCount={payments.length}
            onPageChange={handlePageChange}
          />
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
