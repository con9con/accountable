import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, DollarSign, AlertCircle } from 'lucide-react';
import type { Account } from '@/types';
import { ACCOUNT_TYPE_LABELS } from '@/types';
import { formatCurrency, isDueSoon, isPastDue, formatDate } from '@/lib/utils';
import { AccountForm } from './AccountForm';
import { PaymentForm } from './PaymentForm';
import { useAccountStore } from '@/store/useAccountStore';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const typeColors: Record<string, string> = {
  credit_card: 'border-l-blue-500',
  car_loan: 'border-l-green-500',
  personal_loan: 'border-l-purple-500',
};

const typeBadgeColors: Record<string, string> = {
  credit_card: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  car_loan: 'bg-green-100 text-green-700 hover:bg-green-100',
  personal_loan: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
};

const progressBarColors: Record<string, string> = {
  credit_card: 'bg-blue-500',
  car_loan: 'bg-green-500',
  personal_loan: 'bg-purple-500',
};

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteAccount = useAccountStore((s) => s.deleteAccount);

  const dueSoon = isDueSoon(account.dueDate);
  const pastDue = isPastDue(account.dueDate);

  const originalBalance = account.originalBalance ?? account.totalDue;
  const paidOff = originalBalance > 0
    ? Math.min(100, Math.max(0, ((originalBalance - account.totalDue) / originalBalance) * 100))
    : 0;

  const handleDelete = () => {
    deleteAccount(account.id);
    setDeleteOpen(false);
    toast.success(`${account.name} deleted`);
  };

  return (
    <>
      <Card className={`border-l-4 ${typeColors[account.type]}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{account.name}</CardTitle>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="secondary" className={typeBadgeColors[account.type]}>
                  {ACCOUNT_TYPE_LABELS[account.type]}
                </Badge>
                {pastDue && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Past Due
                  </Badge>
                )}
                {dueSoon && !pastDue && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                    Due Soon
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Balance</p>
              <p className="font-semibold text-foreground">{formatCurrency(account.totalDue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Min Due</p>
              <p className="font-semibold">{formatCurrency(account.minimumDue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">APR</p>
              <p className="font-semibold">{account.interestRate}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{paidOff.toFixed(0)}% paid off</span>
              <span>{formatCurrency(originalBalance - account.totalDue)} paid</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressBarColors[account.type]}`}
                style={{ width: `${paidOff}%` }}
              />
            </div>
          </div>

          {account.dueDate && (
            <p className="text-xs text-muted-foreground">
              Due: {formatDate(account.dueDate)}
            </p>
          )}
          {account.notes && (
            <p className="text-xs text-muted-foreground italic truncate">{account.notes}</p>
          )}
          <Button size="sm" className="w-full" onClick={() => setPayOpen(true)}>
            <DollarSign className="h-3.5 w-3.5 mr-1" />
            Make Payment
          </Button>
        </CardContent>
      </Card>

      <AccountForm open={editOpen} onOpenChange={setEditOpen} account={account} />
      <PaymentForm open={payOpen} onOpenChange={setPayOpen} defaultAccountId={account.id} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{account.name}</strong>? This will also remove all
              associated payment history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
