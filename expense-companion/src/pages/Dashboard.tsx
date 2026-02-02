import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { AddPaymentDialog } from '@/components/dashboard/AddPaymentDialog';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { WalletList } from '@/components/dashboard/WalletList';
import { 
  useRecentPayments, 
  useWallets, 
  useCreatePayment, 
  useDeletePayment,
  useCreateWallet,
  useDeleteWallet 
} from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { data: payments = [], isLoading: paymentsLoading } = useRecentPayments();
  const { data: wallets = [], isLoading: walletsLoading } = useWallets();
  
  const createPayment = useCreatePayment();
  const deletePayment = useDeletePayment();
  const createWallet = useCreateWallet();
  const deleteWallet = useDeleteWallet();

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

  const handleCreateWallet = async (data: Parameters<typeof createWallet.mutate>[0]) => {
    try {
      await createWallet.mutateAsync(data);
      toast.success('Wallet created successfully');
    } catch (error) {
      toast.error('Failed to create wallet');
    }
  };

  const handleDeleteWallet = async (id: string) => {
    try {
      await deleteWallet.mutateAsync(id);
      toast.success('Wallet deleted');
    } catch (error) {
      toast.error('Failed to delete wallet');
    }
  };

  const isLoading = paymentsLoading || walletsLoading;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header className="border-b bg-card/80 backdrop-blur-xs sticky top-0 z-50" />
      
      <main className="container px-4 py-6 pb-20 md:px-6 md:py-8 md:pb-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your income and expenses</p>
          </div>
          {!walletsLoading && wallets.length > 0 && (
            <AddPaymentDialog 
              wallets={wallets} 
              onSubmit={handleCreatePayment}
              isLoading={createPayment.isPending}
            />
          )}
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Balance & Wallets */}
          <div className="space-y-6">
            {isLoading ? (
              <>
                <Skeleton className="h-[200px] rounded-xl" />
                <Skeleton className="h-[280px] rounded-xl" />
              </>
            ) : (
              <>
                <BalanceCard currency="EUR" />
                <WalletList
                  wallets={wallets}
                  onCreateWallet={handleCreateWallet}
                  onDeleteWallet={handleDeleteWallet}
                  isCreating={createWallet.isPending}
                  isDeleting={deleteWallet.isPending}
                />
              </>
            )}
          </div>

          {/* Middle Column - Transactions */}
          <div className="lg:col-span-1">
            {isLoading ? (
              <Skeleton className="h-[500px] rounded-xl" />
            ) : (
              <TransactionList
                payments={payments}
                onDelete={handleDeletePayment}
                isDeleting={deletePayment.isPending}
                variant="compact"
                title="Recent Transactions"
              />
            )}
          </div>

          {/* Right Column - Charts */}
          <div className="space-y-6">
            {isLoading ? (
              <Skeleton className="h-[300px] rounded-xl" />
            ) : (
              <SpendingChart payments={payments} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
