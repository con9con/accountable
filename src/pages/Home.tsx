import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useAccountStore } from '@/store/useAccountStore';
import { formatCurrency, formatDate, isPastDue } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';
import { DebtByCategory } from '@/components/charts/DebtByCategory';
import { DebtByAccount } from '@/components/charts/DebtByAccount';
import { BalanceHistory } from '@/components/charts/BalanceHistory';
import { toast } from 'sonner';
import { PaymentHistory } from '@/components/accounts/PaymentHistory';
import { AccountForm } from '@/components/accounts/AccountForm';
import { PaymentForm } from '@/components/accounts/PaymentForm';
import type { Account } from '@/types';
import { ACCOUNT_TYPE_LABELS } from '@/types';

const summaryCardStyles = [
  { label: 'Total Debt', accent: 'border-t-red-400', valueClass: 'text-red-600' },
  { label: 'Monthly Minimum', accent: 'border-t-amber-400', valueClass: '' },
  { label: 'Average APR', accent: 'border-t-orange-400', valueClass: '' },
  { label: 'Total Accounts', accent: 'border-t-indigo-400', valueClass: '' },
];

export function Home() {
  const [addOpen, setAddOpen] = useState(false);
  const [payAccountId, setPayAccountId] = useState<string | undefined>();
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const accounts = useAccountStore((s) => s.accounts);
  const getTotalDebt = useAccountStore((s) => s.getTotalDebt);
  const getTotalMinimum = useAccountStore((s) => s.getTotalMinimum);
  const loadDemo = useAccountStore((s) => s.loadDemo);
  const clearAll = useAccountStore((s) => s.clearAll);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const totalDebt = getTotalDebt();
  const totalMinimum = getTotalMinimum();

  const creditCards = accounts.filter((a) => a.type === 'credit_card');
  const carLoans = accounts.filter((a) => a.type === 'car_loan');
  const personalLoans = accounts.filter((a) => a.type === 'personal_loan');

  const ccTotal = creditCards.reduce((s, a) => s + a.totalDue, 0);
  const carTotal = carLoans.reduce((s, a) => s + a.totalDue, 0);
  const plTotal = personalLoans.reduce((s, a) => s + a.totalDue, 0);

  const avgAPR =
    accounts.length > 0
      ? accounts.reduce((s, a) => s + a.interestRate, 0) / accounts.length
      : 0;

  const upcomingAccounts = accounts
    .filter((a) => {
      if (!a.dueDate) return false;
      const days = differenceInDays(parseISO(a.dueDate), new Date());
      return days <= 14;
    })
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

  const summaryValues = [
    formatCurrency(totalDebt),
    formatCurrency(totalMinimum),
    `${avgAPR.toFixed(2)}%`,
    accounts.length.toString(),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Your complete debt snapshot</p>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 ? (
            <Button variant="outline" onClick={() => { loadDemo(); toast.success('Demo data loaded'); }}>
              Load Demo Data
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setClearConfirmOpen(true)}>
              Clear All Data
            </Button>
          )}
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Account
          </Button>
        </div>
      </div>

      {/* Upcoming due */}
      {accounts.length > 0 && (
        <div>
          {upcomingAccounts.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Due in the Next 14 Days</h2>
                <Badge variant="secondary">{upcomingAccounts.length}</Badge>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {upcomingAccounts.map((account) => {
                  const daysLeft = differenceInDays(parseISO(account.dueDate!), new Date());
                  const past = isPastDue(account.dueDate);
                  const urgent = daysLeft <= 3 && !past;
                  return (
                    <UpcomingCard
                      key={account.id}
                      account={account}
                      daysLeft={daysLeft}
                      past={past}
                      urgent={urgent}
                      onPay={() => setPayAccountId(account.id)}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border bg-green-50 border-green-200 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">All caught up!</p>
                <p className="text-xs text-green-700">No accounts due in the next 14 days. Keep it up.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCardStyles.map(({ label, accent, valueClass }, i) => (
            <Card key={label} className={`border-t-4 ${accent}`}>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{summaryValues[i]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {accounts.length > 0 && (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Debt by Category</CardTitle>
                <p className="text-xs text-muted-foreground">Balance split across account types</p>
              </CardHeader>
              <CardContent>
                <DebtByCategory creditCards={ccTotal} carLoans={carTotal} personal={plTotal} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Debt by Account</CardTitle>
                <p className="text-xs text-muted-foreground">Current balance per account, high to low</p>
              </CardHeader>
              <CardContent>
                <DebtByAccount accounts={accounts} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Debt Over Time</CardTitle>
              <p className="text-xs text-muted-foreground">Balance history across all accounts</p>
            </CardHeader>
            <CardContent>
              <BalanceHistory accounts={accounts} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Recent payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentHistory limit={5} />
        </CardContent>
      </Card>

      <AccountForm open={addOpen} onOpenChange={setAddOpen} />
      <PaymentForm
        open={!!payAccountId}
        onOpenChange={(o) => !o && setPayAccountId(undefined)}
        defaultAccountId={payAccountId}
      />

      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
            <DialogDescription>
              This will permanently delete all accounts and payment history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setClearConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearAll();
                toast.success('All data cleared');
                setClearConfirmOpen(false);
              }}
            >
              Clear Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface UpcomingCardProps {
  account: Account;
  daysLeft: number;
  past: boolean;
  urgent: boolean;
  onPay: () => void;
}

function UpcomingCard({ account, daysLeft, past, urgent, onPay }: UpcomingCardProps) {
  const typeColors: Record<string, string> = {
    credit_card: 'border-t-blue-500',
    car_loan: 'border-t-green-500',
    personal_loan: 'border-t-purple-500',
  };

  const daysLabel = past
    ? `${Math.abs(daysLeft)}d overdue`
    : daysLeft === 0
    ? 'Due today'
    : `${daysLeft}d left`;

  return (
    <Card className={`shrink-0 w-52 border-t-4 ${typeColors[account.type]}`}>
      <CardContent className="pt-4 pb-3 space-y-3">
        <div>
          <p className="font-semibold text-sm truncate">{account.name}</p>
          <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[account.type]}</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Min Due</p>
            <p className="font-bold">{formatCurrency(account.minimumDue)}</p>
          </div>
          <Badge
            className={
              past
                ? 'bg-red-100 text-red-700 hover:bg-red-100'
                : urgent
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            }
          >
            {past || urgent ? <AlertCircle className="h-3 w-3 mr-1" /> : null}
            {daysLabel}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Due {formatDate(account.dueDate!)}</p>
        <Button size="sm" className="w-full" onClick={onPay}>
          Pay Now
        </Button>
      </CardContent>
    </Card>
  );
}
