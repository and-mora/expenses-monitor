import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { AddPaymentDialog } from '@/components/dashboard/AddPaymentDialog';
import { 
  usePayments, 
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Search, X } from 'lucide-react';
import type { Payment } from '@/types/api';

const PAGE_SIZE = 50;

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);

  const { data: paymentsData, isLoading: paymentsLoading } = usePayments(currentPage, PAGE_SIZE);
  const { data: wallets = [], isLoading: walletsLoading } = useWallets();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  const createPayment = useCreatePayment();
  const deletePayment = useDeletePayment();

  const payments = paymentsData?.content || [];
  const currentPageNumber = paymentsData?.page || 0;

  // Filter payments based on search and filters
  const filteredPayments = useMemo(() => {
    return payments.filter((payment: Payment) => {
      // Search filter (merchant name or description)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        payment.merchantName.toLowerCase().includes(searchLower) ||
        payment.description?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = 
        selectedCategory === 'all' || 
        payment.category === selectedCategory;

      // Wallet filter
      const matchesWallet = 
        selectedWallet === 'all' || 
        payment.wallet === selectedWallet;

      return matchesSearch && matchesCategory && matchesWallet;
    });
  }, [payments, searchQuery, selectedCategory, selectedWallet]);

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
    setCurrentPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedWallet !== 'all';
  const isLoading = paymentsLoading || walletsLoading || categoriesLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header className="border-b bg-card/80 backdrop-blur-xs sticky top-0 z-50" />
      
      <main className="container px-4 py-6 md:px-6 md:py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your transactions
            </p>
          </div>
          {!walletsLoading && wallets.length > 0 && (
            <AddPaymentDialog 
              wallets={wallets} 
              onSubmit={handleCreatePayment}
              isLoading={createPayment.isPending}
            />
          )}
        </div>

        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by merchant or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
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
              onValueChange={setSelectedWallet}
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
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <>
                Showing {filteredPayments.length} transaction
                {filteredPayments.length !== 1 ? 's' : ''} on page {currentPageNumber + 1}
              </>
            )}
          </div>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <Skeleton className="h-[600px] rounded-xl" />
        ) : (
          <TransactionList
            payments={filteredPayments}
            onDelete={handleDeletePayment}
            isDeleting={deletePayment.isPending}
            className="max-w-none"
          />
        )}

        {/* Pagination Controls */}
        {!isLoading && payments.length > 0 && (
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
                  // Show up to 5 page numbers centered around current page
                  const maxPagesToShow = 5;
                  const startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
                  const pagesToShow = maxPagesToShow;
                  
                  return [...Array(pagesToShow)].map((_, i) => {
                    const pageNum = startPage + i;
                    return (
                      <PaginationItem key={`page-${pageNum}`}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pageNum === currentPage}
                          className="cursor-pointer"
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

        {/* Empty State */}
        {!isLoading && filteredPayments.length === 0 && payments.length > 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}

        {!isLoading && payments.length === 0 && (
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

