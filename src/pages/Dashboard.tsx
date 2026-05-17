import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, DollarSign, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccountStore } from '@/store/useAccountStore';
import { AccountForm } from '@/components/accounts/AccountForm';
import { PaymentForm } from '@/components/accounts/PaymentForm';
import { PaymentHistory } from '@/components/accounts/PaymentHistory';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ACCOUNT_TYPE_LABELS } from '@/types';
import type { Account } from '@/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { addMonths, format } from 'date-fns';

const typeBadgeColors: Record<string, string> = {
  credit_card: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  car_loan: 'bg-green-100 text-green-700 hover:bg-green-100',
  personal_loan: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
};

// --- Payoff Calculator ---
interface MonthlyRow {
  month: number;
  label: string;
  remaining: number;
  interest: number;
  principal: number;
}

interface PayoffResult {
  months: number;
  totalInterest: number;
  order: string[];
  feasible: boolean;
  breakdown: MonthlyRow[];
}

function calculatePayoff(
  accounts: Account[],
  extraMonthly: number,
  strategy: 'snowball' | 'avalanche'
): PayoffResult {
  if (accounts.length === 0) {
    return { months: 0, totalInterest: 0, order: [], feasible: true, breakdown: [] };
  }

  let remaining = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    balance: a.totalDue,
    rate: a.interestRate / 100 / 12,
    min: a.minimumDue,
  }));

  const sorted = [...remaining].sort((a, b) =>
    strategy === 'snowball' ? a.balance - b.balance : b.rate - a.rate
  );

  let months = 0;
  let totalInterest = 0;
  const maxMonths = 600;
  const breakdown: MonthlyRow[] = [];
  const startDate = new Date();

  while (remaining.some((a) => a.balance > 0) && months < maxMonths) {
    months++;
    let freed = 0;
    let monthInterest = 0;
    const prevTotal = remaining.reduce((s, a) => s + a.balance, 0);

    remaining = remaining.map((a) => {
      if (a.balance <= 0) return a;
      const interest = a.balance * a.rate;
      monthInterest += interest;
      totalInterest += interest;
      a.balance += interest;
      return a;
    });

    remaining = remaining.map((a) => {
      if (a.balance <= 0) { freed += a.min; return a; }
      const payment = Math.min(a.min, a.balance);
      a.balance -= payment;
      if (a.balance <= 0) { freed += a.min - payment; a.balance = 0; }
      return a;
    });

    let extra = extraMonthly + freed;
    for (const target of sorted) {
      const acc = remaining.find((a) => a.id === target.id);
      if (!acc || acc.balance <= 0) continue;
      const payment = Math.min(extra, acc.balance);
      acc.balance -= payment;
      extra -= payment;
      if (extra <= 0) break;
    }

    const newTotal = remaining.reduce((s, a) => s + a.balance, 0);
    const principalPaid = prevTotal + monthInterest - newTotal;

    if (months <= 24 || newTotal <= 0) {
      const date = addMonths(startDate, months);
      breakdown.push({
        month: months,
        label: format(date, 'MMM yyyy'),
        remaining: Math.max(0, newTotal),
        interest: monthInterest,
        principal: principalPaid,
      });
    }
  }

  return {
    months,
    totalInterest,
    order: sorted.map((a) => a.name),
    feasible: months < maxMonths,
    breakdown,
  };
}

function PayoffCalculator() {
  const accounts = useAccountStore((s) => s.accounts);
  const [extra, setExtra] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState<'snowball' | 'avalanche' | null>(null);

  const snowball = useMemo(() => calculatePayoff(accounts, extra, 'snowball'), [accounts, extra]);
  const avalanche = useMemo(() => calculatePayoff(accounts, extra, 'avalanche'), [accounts, extra]);

  const formatMonths = (m: number) => {
    if (!m) return '—';
    const y = Math.floor(m / 12);
    const mo = m % 12;
    return [y > 0 && `${y}y`, mo > 0 && `${mo}mo`].filter(Boolean).join(' ');
  };

  if (accounts.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6 text-center">
        Add accounts to use the payoff calculator.
      </p>
    );
  }

  const strategies = [
    { key: 'snowball' as const, label: 'Snowball', subtitle: 'Lowest balance first', result: snowball, color: 'border-green-500' },
    { key: 'avalanche' as const, label: 'Avalanche', subtitle: 'Highest APR first', result: avalanche, color: 'border-blue-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Extra monthly payment ($)</label>
        <input
          type="number"
          min="0"
          step="10"
          value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          className="w-28 border rounded-md px-3 py-1.5 text-sm bg-background"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {strategies.map(({ key, label, subtitle, result, color }) => (
          <Card key={key} className={`border-l-4 ${color}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{label}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payoff time</span>
                <span className="font-semibold">
                  {result.feasible === false ? '50+ years' : formatMonths(result.months)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total interest</span>
                <span className="font-semibold text-red-500">{formatCurrency(result.totalInterest)}</span>
              </div>
              <div className="pt-1">
                <p className="text-xs text-muted-foreground mb-1">Payoff order:</p>
                <p className="text-xs">{result.order?.join(' → ') || '—'}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-1 text-xs h-7"
                onClick={() => setShowBreakdown(showBreakdown === key ? null : key)}
              >
                {showBreakdown === key ? (
                  <><ChevronUp className="h-3.5 w-3.5 mr-1" /> Hide breakdown</>
                ) : (
                  <><ChevronDown className="h-3.5 w-3.5 mr-1" /> Month-by-month</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {showBreakdown && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm capitalize">{showBreakdown} — Month-by-Month</CardTitle>
            <p className="text-xs text-muted-foreground">First 24 months</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(showBreakdown === 'snowball' ? snowball : avalanche).breakdown.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="text-xs">{row.label}</TableCell>
                      <TableCell className="text-right font-medium text-xs">
                        {formatCurrency(row.remaining)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-red-500">
                        {formatCurrency(row.interest)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-green-600">
                        {formatCurrency(row.principal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Main Dashboard ---
export function Dashboard() {
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  const accounts = useAccountStore((s) => s.accounts);
  const payments = useAccountStore((s) => s.payments);
  const deleteAcc = useAccountStore((s) => s.deleteAccount);

  const handleDelete = () => {
    if (!deleteAccount) return;
    deleteAcc(deleteAccount.id);
    toast.success(`${deleteAccount.name} deleted`);
    setDeleteAccount(null);
  };

  const handleExport = () => {
    const accountRows = accounts.map((a) => ({
      Type: ACCOUNT_TYPE_LABELS[a.type],
      Name: a.name,
      Balance: a.totalDue,
      OriginalBalance: a.originalBalance ?? a.totalDue,
      MinimumDue: a.minimumDue,
      APR: a.interestRate,
      DueDate: a.dueDate ?? '',
      Notes: a.notes ?? '',
    }));
    const paymentRows = payments.map((p) => {
      const acc = accounts.find((a) => a.id === p.accountId);
      return { Date: p.date, Account: acc?.name ?? '', Amount: p.amount, Note: p.note ?? '' };
    });

    const csv1 = Papa.unparse(accountRows);
    const csv2 = Papa.unparse(paymentRows);
    const blob = new Blob([`ACCOUNTS\n${csv1}\n\nPAYMENTS\n${csv2}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accountable-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage all accounts and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => setPayOpen(true)}>
            <DollarSign className="h-4 w-4 mr-1" /> Record Payment
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Account
          </Button>
        </div>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Accounts ({accounts.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="payoff">Payoff Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {accounts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No accounts yet.</p>
                  <Button className="mt-3" onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Your First Account
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Min Due</TableHead>
                      <TableHead className="text-right">APR</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={typeBadgeColors[a.type]}>
                            {ACCOUNT_TYPE_LABELS[a.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(a.totalDue)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(a.minimumDue)}</TableCell>
                        <TableCell className="text-right">{a.interestRate}%</TableCell>
                        <TableCell>{a.dueDate ? formatDate(a.dueDate) : '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setPayOpen(true)}
                              title="Record payment"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditAccount(a)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteAccount(a)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <PaymentHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payoff" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Debt Payoff Calculator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare snowball and avalanche strategies. Enter any extra monthly amount to see how much faster you'd pay off your debt.
              </p>
            </CardHeader>
            <CardContent>
              <PayoffCalculator />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AccountForm open={addOpen} onOpenChange={setAddOpen} />
      <AccountForm
        open={!!editAccount}
        onOpenChange={(o) => !o && setEditAccount(null)}
        account={editAccount ?? undefined}
      />
      <PaymentForm open={payOpen} onOpenChange={setPayOpen} />

      <Dialog open={!!deleteAccount} onOpenChange={(o) => !o && setDeleteAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Delete <strong>{deleteAccount?.name}</strong>? All associated payments will also be removed.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteAccount(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
