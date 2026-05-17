import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccountStore } from '@/store/useAccountStore';
import { todayISO, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAccountId?: string;
}

export function PaymentForm({ open, onOpenChange, defaultAccountId }: PaymentFormProps) {
  const accounts = useAccountStore((s) => s.accounts);
  const addPayment = useAccountStore((s) => s.addPayment);

  const [accountId, setAccountId] = useState(defaultAccountId ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setAccountId(defaultAccountId ?? '');
      setAmount('');
      setDate(todayISO());
      setNote('');
      setErrors({});
    }
  }, [open, defaultAccountId]);

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (!accountId) next.accountId = 'Please select an account';
    if (!amount || Number(amount) <= 0) next.amount = 'Enter an amount greater than 0';
    if (!date) next.date = 'Date is required';

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    const account = accounts.find((a) => a.id === accountId);
    addPayment({ accountId, amount: Number(amount), date, note });
    toast.success(`${formatCurrency(Number(amount))} recorded for ${account?.name ?? 'account'}`);
    onOpenChange(false);
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Account</Label>
            <Select value={accountId} onValueChange={(v) => { if (v) setAccountId(v); setErrors((e) => ({ ...e, accountId: '' })); }}>
              <SelectTrigger className={errors.accountId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select account...">
                  {selectedAccount?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && <p className="text-destructive text-xs">{errors.accountId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors((err) => ({ ...err, amount: '' })); }}
                className={errors.amount ? 'border-destructive' : ''}
              />
              {errors.amount && <p className="text-destructive text-xs">{errors.amount}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {errors.date && <p className="text-destructive text-xs">{errors.date}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Input
              placeholder="e.g. Monthly payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Record Payment</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
