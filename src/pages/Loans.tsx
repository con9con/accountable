import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Car, User } from 'lucide-react';
import { useAccountStore } from '@/store/useAccountStore';
import { AccountCard } from '@/components/accounts/AccountCard';
import { AccountForm } from '@/components/accounts/AccountForm';
import { formatCurrency, isDueSoon, isPastDue } from '@/lib/utils';
import type { AccountType, Account } from '@/types';

type SortKey = 'balance' | 'name' | 'apr';
type FilterKey = 'all' | 'due_soon' | 'past_due';

const SORT_LABELS: Record<SortKey, string> = { balance: 'Balance', name: 'Name', apr: 'APR' };
const FILTER_LABELS: Record<FilterKey, string> = { all: 'All', due_soon: 'Due Soon', past_due: 'Past Due' };

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

interface LoanSectionProps {
  type: AccountType;
  label: string;
  icon: React.ElementType;
  color: string;
  accentClass: string;
}

function LoanSection({ type, label, icon: Icon, color, accentClass }: LoanSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('balance');
  const [filter, setFilter] = useState<FilterKey>('all');

  const allAccounts = useAccountStore((s) => s.accounts);
  const allOfType = allAccounts.filter((a) => a.type === type);
  const accounts = useMemo(
    () => applySort(applyFilter(allOfType, filter), sort),
    [allOfType, filter, sort]
  );

  const total = allOfType.reduce((s, a) => s + a.totalDue, 0);
  const minTotal = allOfType.reduce((s, a) => s + a.minimumDue, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {allOfType.length} account{allOfType.length !== 1 ? 's' : ''}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add {label}
        </Button>
      </div>

      {allOfType.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className={`col-span-1 border-t-4 ${accentClass}`}>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className={`text-xl font-bold ${color}`}>{formatCurrency(total)}</p>
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
                <p className="text-sm text-muted-foreground">Accounts</p>
                <p className="text-xl font-bold">{allOfType.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sort / Filter */}
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

      {allOfType.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-4">
            <div className={`rounded-full p-5 ${type === 'car_loan' ? 'bg-green-50' : 'bg-purple-50'}`}>
              <Icon className={`h-10 w-10 ${type === 'car_loan' ? 'text-green-400' : 'text-purple-400'}`} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">No {label.toLowerCase()} accounts yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {type === 'car_loan'
                  ? 'Track your vehicle financing — balance, monthly payment, and interest rate.'
                  : 'Keep tabs on personal loans so you always know what you owe and when.'}
              </p>
            </div>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add {label}
            </Button>
          </CardContent>
        </Card>
      ) : accounts.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No accounts match this filter.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      <AccountForm open={addOpen} onOpenChange={setAddOpen} defaultType={type} />
    </div>
  );
}

export function Loans() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
        <p className="text-muted-foreground mt-1">Car and personal loan accounts</p>
      </div>

      <Tabs defaultValue="car">
        <TabsList>
          <TabsTrigger value="car">Car Loans</TabsTrigger>
          <TabsTrigger value="personal">Personal Loans</TabsTrigger>
        </TabsList>
        <TabsContent value="car" className="mt-4">
          <LoanSection
            type="car_loan"
            label="Car Loan"
            icon={Car}
            color="text-green-600"
            accentClass="border-t-green-400"
          />
        </TabsContent>
        <TabsContent value="personal" className="mt-4">
          <LoanSection
            type="personal_loan"
            label="Personal Loan"
            icon={User}
            color="text-purple-600"
            accentClass="border-t-purple-400"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
