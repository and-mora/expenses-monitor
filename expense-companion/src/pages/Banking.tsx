import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  CheckSquare2,
  Clock3,
  Filter,
  Link2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Upload,
  Wallet,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { TransactionPagination } from '@/components/transactions/TransactionPagination';
import { BankConnectionSheet, type BankConnectionFormValues } from '@/components/banking/BankConnectionSheet';
import {
  StagingTransactionSheet,
  type StagingTransactionFormValues,
} from '@/components/banking/StagingTransactionSheet';
import {
  useBankConnections,
  useCategories,
  useConnectBankConnection,
  useImportStagingTransactions,
  useStagingTransactions,
  useSyncBankConnection,
  useUpdateStagingTransaction,
} from '@/hooks/use-api';
import type { BankingConnectionSummary, BankingConnectResponse, StagingTransaction, StagingTransactionStatus } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;
const statusOptions: Array<StagingTransactionStatus | 'all'> = ['all', 'pending', 'reviewed', 'imported', 'rejected'];

function connectionStatusVariant(status: BankingConnectionSummary['status']) {
  switch (status) {
    case 'connected':
      return 'default';
    case 'syncing':
      return 'secondary';
    case 'error':
      return 'destructive';
    case 'pending':
      return 'outline';
    case 'disconnected':
      return 'outline';
    default:
      return 'outline';
  }
}

function connectionStatusLabel(status: BankingConnectionSummary['status'] | null | undefined) {
  if (!status) {
    return 'Unknown';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function stagingStatusVariant(status: StagingTransactionStatus) {
  switch (status) {
    case 'imported':
      return 'default';
    case 'reviewed':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    case 'pending':
    default:
      return 'outline';
  }
}

const Banking = () => {
  const [connectSheetOpen, setConnectSheetOpen] = useState(false);
  const [selectedAuthorization, setSelectedAuthorization] = useState<BankingConnectResponse | null>(null);
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(null);
  const [stagingFilters, setStagingFilters] = useState({
    status: 'pending' as StagingTransactionStatus | 'all',
    connectionId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [stagingPage, setStagingPage] = useState(0);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<StagingTransaction | null>(null);
  const [editingTransactionSheetOpen, setEditingTransactionSheetOpen] = useState(false);

  const { data: connections = [], isLoading: connectionsLoading } = useBankConnections();
  const { data: categories = [] } = useCategories();
  const { data: stagingTransactionsResponse, isLoading: stagingLoading } = useStagingTransactions({
    page: stagingPage,
    size: PAGE_SIZE,
    ...stagingFilters,
  });

  const connectMutation = useConnectBankConnection();
  const syncMutation = useSyncBankConnection();
  const updateMutation = useUpdateStagingTransaction();
  const importMutation = useImportStagingTransactions();

  const stagingTransactions = stagingTransactionsResponse?.content ?? [];
  const connectionFilterOptions = useMemo(() => connections.map((connection) => ({
    value: connection.connectionId,
    label: `${connection.connectionLabel || connection.accountLabel || connection.connectionId} (${connection.provider})`,
  })), [connections]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) =>
        typeof category === 'string'
          ? { value: category, label: category.charAt(0).toUpperCase() + category.slice(1) }
          : { value: category.id, label: category.name },
      ),
    [categories],
  );

  useEffect(() => {
    setStagingPage(0);
  }, [stagingFilters.status, stagingFilters.connectionId, stagingFilters.dateFrom, stagingFilters.dateTo]);

  useEffect(() => {
    setSelectedTransactionIds([]);
  }, [stagingPage, stagingFilters.status, stagingFilters.connectionId, stagingFilters.dateFrom, stagingFilters.dateTo]);

  const handleConnect = async (values: BankConnectionFormValues) => {
    try {
      const result = await connectMutation.mutateAsync({
        provider: values.provider,
        accountId: values.accountId.trim() || undefined,
        connectionLabel: values.connectionLabel.trim() || undefined,
        redirectUri: values.redirectUri,
      });
      setSelectedAuthorization(result);
      toast.success('Bank connection created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create bank connection');
      throw error;
    }
  };

  const handleSync = async (connectionId: string) => {
    setSyncingConnectionId(connectionId);
    try {
      const result = await syncMutation.mutateAsync(connectionId);
      toast.success(`Sync complete: ${result.createdCount} new, ${result.updatedCount} updated, ${result.duplicateCount} duplicates`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync bank connection');
    } finally {
      setSyncingConnectionId(null);
    }
  };

  const handleEditTransaction = async (values: StagingTransactionFormValues) => {
    if (!editingTransaction) return;

    try {
      await updateMutation.mutateAsync({
        id: editingTransaction.id,
        transaction: {
          suggestedMerchant: values.suggestedMerchant.trim() || undefined,
          suggestedCategory: values.suggestedCategory.trim() || undefined,
          status: values.status,
        },
      });
      toast.success('Staging transaction updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update staging transaction');
      throw error;
    }
  };

  const importableTransactionIds =
    selectedTransactionIds.length > 0
      ? selectedTransactionIds
      : stagingTransactions.filter((transaction) => transaction.status === 'pending').map((transaction) => transaction.id);

  const handleImport = async () => {
    if (importableTransactionIds.length === 0) {
      toast.info('Select at least one staging transaction to import');
      return;
    }

    try {
      const result = await importMutation.mutateAsync({
        transactionIds: importableTransactionIds,
        defaultCategoryId: defaultCategoryId || undefined,
      });

      if (result.importedCount > 0) {
        toast.success(`Imported ${result.importedCount} staging transaction${result.importedCount === 1 ? '' : 's'}`);
      }
      if (result.skippedCount > 0) {
        toast.info(`${result.skippedCount} transaction${result.skippedCount === 1 ? '' : 's'} were skipped`);
      }

      setSelectedTransactionIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import staging transactions');
    }
  };

  const toggleTransactionSelection = (transactionId: string, selected: boolean) => {
    setSelectedTransactionIds((current) => {
      if (selected) {
        return current.includes(transactionId) ? current : [...current, transactionId];
      }
      return current.filter((id) => id !== transactionId);
    });
  };

  const allPageIds = stagingTransactions.map((transaction) => transaction.id);
  const allPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedTransactionIds.includes(id));
  const somePageSelected = allPageIds.some((id) => selectedTransactionIds.includes(id));
  const selectedCount = selectedTransactionIds.length;
  const currentPageImportableCount = stagingTransactions.filter((transaction) => transaction.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <Header className="border-b bg-card/80 backdrop-blur-xs sticky top-0 z-50" />

      <main className="container px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8 max-w-7xl space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              PSD2 / bank integration
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Banking</h1>
            <p className="max-w-2xl text-muted-foreground">
              Connect a bank provider, review staged transactions, and import reviewed entries into payments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => setConnectSheetOpen(true)}>
              <Link2 className="h-4 w-4" />
              Connect bank
            </Button>
          </div>
        </div>

        {selectedAuthorization && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="font-medium">Authorization link ready</p>
                <p className="text-sm text-muted-foreground">
                  Open the provider authorization page to finish connecting {selectedAuthorization.provider}.
                </p>
              </div>
              <Button
                onClick={() => {
                  window.open(selectedAuthorization.authorizationUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                Open authorization
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Connections</h2>
              <p className="text-sm text-muted-foreground">View connected accounts and trigger manual syncs.</p>
            </div>
          </div>

          {connectionsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-[190px] rounded-xl" />
              <Skeleton className="h-[190px] rounded-xl" />
            </div>
          ) : connections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Wallet className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium">No bank connections yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start by connecting a mock provider or your live PSD2 provider.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setConnectSheetOpen(true)}>
                  <Link2 className="h-4 w-4" />
                  Connect bank
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {connections.map((connection) => (
                <Card key={connection.connectionId} className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {connection.connectionLabel || connection.accountLabel || connection.connectionId}
                        </CardTitle>
                        <CardDescription>{connection.provider}</CardDescription>
                      </div>
                      <Badge variant={connectionStatusVariant(connection.status)}>
                        {connectionStatusLabel(connection.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Account</span>
                        <span className="font-medium">{connection.accountLabel || connection.accountId || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Last sync</span>
                        <span className="font-medium">
                          {connection.lastSyncAt ? formatDate(connection.lastSyncAt) : 'Never'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Sync result</span>
                        <span className="font-medium">
                          {connection.lastSyncStatus ? connection.lastSyncStatus : '—'}
                        </span>
                      </div>
                    </div>

                    {connection.accounts?.length ? (
                      <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Accounts
                        </p>
                        <div className="space-y-2">
                          {connection.accounts.map((account) => (
                            <div key={account.accountId} className="flex items-center justify-between gap-3">
                              <span className="truncate">{account.accountLabel}</span>
                              <span className="text-muted-foreground">{account.currency}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleSync(connection.connectionId)}
                        disabled={syncMutation.isPending || syncingConnectionId === connection.connectionId}
                      >
                        {syncMutation.isPending && syncingConnectionId === connection.connectionId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Sync now
                      </Button>
                    </div>

                    {typeof connection.createdCount === 'number' && (
                      <p className="text-xs text-muted-foreground">
                        Last sync added {connection.createdCount} new, updated {connection.updatedCount ?? 0}, duplicated {connection.duplicateCount ?? 0}.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Staging review</h2>
              <p className="text-sm text-muted-foreground">
                Filter, edit, and bulk import staging transactions before they become payments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedTransactionIds(allPageSelected ? [] : allPageIds)}
                disabled={stagingLoading || stagingTransactions.length === 0}
              >
                <CheckSquare2 className="h-4 w-4" />
                {allPageSelected ? 'Clear page selection' : 'Select page'}
              </Button>

              <Button
                onClick={handleImport}
                disabled={importMutation.isPending || (selectedCount === 0 && currentPageImportableCount === 0)}
              >
                {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import {selectedCount > 0 ? 'selected' : 'page'}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>Scope the staging queue by provider, date, or review state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Select
                  value={stagingFilters.connectionId || 'all'}
                  onValueChange={(value) =>
                    setStagingFilters((current) => ({
                      ...current,
                      connectionId: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Connection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All connections</SelectItem>
                    {connectionFilterOptions.map((connection) => (
                      <SelectItem key={connection.value} value={connection.value}>
                        {connection.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={stagingFilters.status}
                  onValueChange={(value) =>
                    setStagingFilters((current) => ({
                      ...current,
                      status: value as StagingTransactionStatus | 'all',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'all' ? 'All statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={stagingFilters.dateFrom}
                  onChange={(event) =>
                    setStagingFilters((current) => ({ ...current, dateFrom: event.target.value }))
                  }
                />

                <Input
                  type="date"
                  value={stagingFilters.dateTo}
                  onChange={(event) =>
                    setStagingFilters((current) => ({ ...current, dateTo: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Select
                  value={defaultCategoryId || 'none'}
                  onValueChange={(value) => setDefaultCategoryId(value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default import category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default category</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                  Selected {selectedCount} item{selectedCount === 1 ? '' : 's'} • importing pending rows from the current page when nothing is selected.
                </div>
              </div>
            </CardContent>
          </Card>

          {stagingLoading ? (
            <Skeleton className="h-[420px] rounded-xl" />
          ) : stagingTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Clock3 className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No staging transactions found</p>
                <p className="text-sm text-muted-foreground">Adjust filters or sync a connected bank account.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {stagingTransactions.map((transaction) => {
                  const checked = selectedTransactionIds.includes(transaction.id);
                  return (
                    <Card key={transaction.id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => toggleTransactionSelection(transaction.id, value === true)}
                              aria-label={`Select transaction ${transaction.id}`}
                              className="mt-1"
                            />
                            <div className="space-y-1">
                              <p className="font-medium">
                                {transaction.creditorName || transaction.suggestedMerchant || 'Bank transaction'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(transaction.bookingDate)} • {transaction.provider}
                              </p>
                            </div>
                          </div>
                          <Badge variant={stagingStatusVariant(transaction.status)}>{transaction.status}</Badge>
                        </div>

                        <p
                          className={cn(
                            'text-lg font-semibold font-mono tabular-nums',
                            transaction.amountInCents >= 0 ? 'text-income' : 'text-expense',
                          )}
                        >
                          {formatCurrency(transaction.amountInCents, transaction.currency, true)}
                        </p>

                        <div className="text-sm text-muted-foreground">
                          <p>Suggested merchant: {transaction.suggestedMerchant || '—'}</p>
                          <p>Suggested category: {categoryOptions.find((option) => option.value === transaction.suggestedCategory)?.label || 'No category'}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setEditingTransaction(transaction);
                              setEditingTransactionSheetOpen(true);
                            }}
                          >
                            <Filter className="h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="hidden overflow-hidden rounded-xl border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                          <Checkbox
                            checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                          onCheckedChange={(value) => setSelectedTransactionIds(value ? allPageIds : [])}
                          aria-label="Select all transactions"
                        />
                      </TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Booking date</TableHead>
                      <TableHead>Suggested category</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stagingTransactions.map((transaction) => {
                      const checked = selectedTransactionIds.includes(transaction.id);
                      const selectedCategory = categoryOptions.find((option) => option.value === transaction.suggestedCategory);

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => toggleTransactionSelection(transaction.id, value === true)}
                              aria-label={`Select transaction ${transaction.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {transaction.creditorName || transaction.suggestedMerchant || 'Bank transaction'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                                {transaction.remittanceInfo || transaction.bankTransactionId}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'font-mono font-semibold tabular-nums',
                                transaction.amountInCents >= 0 ? 'text-income' : 'text-expense',
                              )}
                            >
                              {formatCurrency(transaction.amountInCents, transaction.currency, true)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stagingStatusVariant(transaction.status)}>{transaction.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(transaction.bookingDate)}</TableCell>
                          <TableCell>{selectedCategory?.label || 'No category'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingTransaction(transaction);
                                setEditingTransactionSheetOpen(true);
                              }}
                              aria-label={`Edit ${transaction.id}`}
                            >
                              <Filter className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <p>
                  Page {stagingPage + 1}
                  {stagingTransactionsResponse?.totalPages ? ` of ${stagingTransactionsResponse.totalPages}` : ''} • {stagingTransactions.length} row{stagingTransactions.length === 1 ? '' : 's'}
                </p>
                <p>
                  {selectedCount > 0
                    ? `${selectedCount} selected`
                    : `${currentPageImportableCount} pending row${currentPageImportableCount === 1 ? '' : 's'} ready to import`}
                </p>
              </div>

              <TransactionPagination
                currentPage={stagingPage}
                pageSize={PAGE_SIZE}
                itemsCount={stagingTransactions.length}
                onPageChange={setStagingPage}
              />
            </>
          )}
        </section>
      </main>

      <BankConnectionSheet
        open={connectSheetOpen}
        onOpenChange={setConnectSheetOpen}
        onSubmit={handleConnect}
        isSubmitting={connectMutation.isPending}
      />

      <StagingTransactionSheet
        key={editingTransaction?.id ?? 'staging-transaction-sheet'}
        transaction={editingTransaction}
        open={editingTransactionSheetOpen}
        onOpenChange={(open) => {
          setEditingTransactionSheetOpen(open);
          if (!open) {
            setEditingTransaction(null);
          }
        }}
        onSubmit={handleEditTransaction}
        categories={categories}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
};

export default Banking;
