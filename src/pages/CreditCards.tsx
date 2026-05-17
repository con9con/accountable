import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard } from 'lucide-react';
import { useAccountStore } from '@/store/useAccountStore';
import { AccountCard } from '@/components/accounts/AccountCard';
import { AccountForm } from '@/components/accounts/AccountForm';
import { formatCurrency, isDueSoon, isPastDue } from '@/lib/utils';
import type { Account } from '@/types';

type SortKey = 'balance' | 'name' | 'apr';
type FilterKey = 'all' | 'due_soon' | 'past_due';

const SORT_LABELS: Record<SortKey, string> = {
  balance: 'Balance',
  name: 'Name',
  apr: 'APR',
};

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  due_soon: 'Due Soon',
  past_due: 'Past Due',
};

function applyFilter(accounts: Account[], filter: FilterKey): Account[] {
  if (filter === 'due_soon') return accounts.filter((a) => isDueSoon(a.dueDate));
  if (filter === 'past_due') return accounts.filter((a) => isPastDue(a.dueDate));
  return accounts;
}

function applySort(accounts: Account[], sort: SortKey): Account[] {
  return [...accounts].sort((a, b) => {
    if (sort === 'balance') return b.totalDue - a.totalDue;
    if (sort === 'apr') return b.interestRate - a.interestRate;
    return a.name.localeCompare(b.name);
  });
}

export function CreditCards() {
  const [addOpen, setAddOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('balance');
  const [filter, setFilter] = useState<FilterKey>('all');

  const allAccounts = useAccountStore((s) => s.accounts);
  const accounts = useMemo(
    () => applySort(applyFilter(allAccounts.filter((a) => a.type === 'credit_card'), filter), sort),
    [allAccounts, filter, sort]
  );
  const allCreditCards = allAccounts.filter((a) => a.type === 'credit_card');
  const total = allCreditCards.reduce((s, a) => s + a.totalDue, 0);
  const minTotal = allCreditCards.reduce((s, a) => s + a.minimumDue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Cards</h1>
          <p className="text-muted-foreground mt-1">
            {allCreditCards.length} account{allCreditCards.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Card
        </Button>
      </div>

      {allCreditCards.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="col-span-2 border-t-4 border-t-blue-400">
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">Monthly Minimum</p>
                <p className="text-xl font-bold">{formatCurrency(minTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">Cards</p>
                <p className="text-xl font-bold">{allCreditCards.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sort / Filter controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">Sort:</span>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <Badge
                  key={key}
                  variant={sort === key ? 'default' : 'secondary'}
                  className="cursor-pointer select-none"
                  onClick={() => setSort(key)}
                >
                  {SORT_LABELS[key]}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">Filter:</span>
              {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
                <Badge
                  key={key}
                  variant={filter === key ? 'default' : 'secondary'}
                  className="cursor-pointer select-none"
                  onClick={() => setFilter(key)}
                >
                  {FILTER_LABELS[key]}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {allCreditCards.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="rounded-full bg-blue-50 p-5">
              <CreditCard className="h-10 w-10 text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">No credit cards yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Add your credit cards to track balances, minimum payments, and interest rates all in one place.
              </p>
            </div>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : accounts.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No cards match this filter.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      <AccountForm open={addOpen} onOpenChange={setAddOpen} defaultType="credit_card" />
    </div>
  );
}
