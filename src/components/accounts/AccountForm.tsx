import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { accountSchema, type AccountFormValues } from '@/lib/validators';
import { useAccountStore } from '@/store/useAccountStore';
import type { Account } from '@/types';
import { ACCOUNT_TYPE_LABELS } from '@/types';
import { toast } from 'sonner';

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  defaultType?: Account['type'];
}

export function AccountForm({ open, onOpenChange, account, defaultType }: AccountFormProps) {
  const addAccount = useAccountStore((s) => s.addAccount);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const isEdit = !!account;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      type: defaultType ?? 'credit_card',
      name: '',
      totalDue: 0,
      minimumDue: 0,
      interestRate: 0,
      dueDate: '',
      originalBalance: undefined,
      notes: '',
    },
  });

  useEffect(() => {
    if (account) {
      reset({
        type: account.type,
        name: account.name,
        totalDue: account.totalDue,
        minimumDue: account.minimumDue,
        interestRate: account.interestRate,
        dueDate: account.dueDate ?? '',
        originalBalance: account.originalBalance ?? account.totalDue,
        notes: account.notes ?? '',
      });
    } else {
      reset({
        type: defaultType ?? 'credit_card',
        name: '',
        totalDue: 0,
        minimumDue: 0,
        interestRate: 0,
        dueDate: '',
        originalBalance: undefined,
        notes: '',
      });
    }
  }, [account, defaultType, open, reset]);

  const onSubmit = (values: AccountFormValues) => {
    if (isEdit) {
      updateAccount(account.id, values);
      toast.success(`${values.name} updated`);
    } else {
      addAccount(values);
      toast.success(`${values.name} added`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Account Type</Label>
            <Select
              value={watch('type')}
              onValueChange={(v) => setValue('type', v as AccountFormValues['type'])}
            >
              <SelectTrigger>
                <SelectValue>{ACCOUNT_TYPE_LABELS[watch('type')]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="car_loan">Car Loan</SelectItem>
                <SelectItem value="personal_loan">Personal Loan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Account Name</Label>
            <Input {...register('name')} placeholder="e.g. Chase Sapphire" />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Current Balance ($)</Label>
              <Input type="number" step="0.01" {...register('totalDue')} />
              {errors.totalDue && <p className="text-destructive text-xs">{errors.totalDue.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>
                Original Balance ($)
                <span className="text-muted-foreground text-xs ml-1">(optional)</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Defaults to current balance"
                {...register('originalBalance')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Minimum Due ($)</Label>
              <Input type="number" step="0.01" {...register('minimumDue')} />
              {errors.minimumDue && <p className="text-destructive text-xs">{errors.minimumDue.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Interest Rate (APR %)</Label>
              <Input type="number" step="0.01" {...register('interestRate')} />
              {errors.interestRate && <p className="text-destructive text-xs">{errors.interestRate.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Due Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input type="date" {...register('dueDate')} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input placeholder="e.g. Home improvement loan" {...register('notes')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit(onSubmit as any)}>
              {isEdit ? 'Save Changes' : 'Add Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
