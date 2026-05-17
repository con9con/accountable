import { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAccountStore } from '@/store/useAccountStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Payment } from '@/types';

interface PaymentHistoryProps {
  accountId?: string;
  limit?: number;
}

interface EditState {
  payment: Payment;
  amount: string;
  date: string;
  note: string;
}

export function PaymentHistory({ accountId, limit }: PaymentHistoryProps) {
  const allPayments = useAccountStore((s) => s.payments);
  const accounts = useAccountStore((s) => s.accounts);
  const deletePayment = useAccountStore((s) => s.deletePayment);
  const updatePayment = useAccountStore((s) => s.updatePayment);

  const [editState, setEditState] = useState<EditState | null>(null);

  const payments = [...allPayments]
    .filter((p) => !accountId || p.accountId === accountId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  if (payments.length === 0) {
    return <p className="text-muted-foreground text-sm py-4 text-center">No payments recorded yet.</p>;
  }

  const openEdit = (p: Payment) => {
    setEditState({ payment: p, amount: String(p.amount), date: p.date, note: p.note ?? '' });
  };

  const handleSaveEdit = () => {
    if (!editState) return;
    const amount = Number(editState.amount);
    if (!amount || amount <= 0) return;
    updatePayment(editState.payment.id, {
      amount,
      date: editState.date,
      note: editState.note,
    });
    toast.success('Payment updated');
    setEditState(null);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {!accountId && <TableHead>Account</TableHead>}
            <TableHead>Amount</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => {
            const account = accounts.find((a) => a.id === p.accountId);
            return (
              <TableRow key={p.id}>
                <TableCell>{formatDate(p.date)}</TableCell>
                {!accountId && <TableCell>{account?.name ?? '—'}</TableCell>}
                <TableCell className="font-medium text-green-600">{formatCurrency(p.amount)}</TableCell>
                <TableCell className="text-muted-foreground">{p.note || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        deletePayment(p.id);
                        toast.success('Payment removed');
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!editState} onOpenChange={(o) => !o && setEditState(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          {editState && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editState.amount}
                    onChange={(e) => setEditState((s) => s && { ...s, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editState.date}
                    onChange={(e) => setEditState((s) => s && { ...s, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Input
                  placeholder="e.g. Monthly payment"
                  value={editState.note}
                  onChange={(e) => setEditState((s) => s && { ...s, note: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditState(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
