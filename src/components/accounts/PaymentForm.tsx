import { useState } from 'react';
import { useAccountStore } from '@/store/useAccountStore';
import { useActions } from '@/hooks/useActions';
import { Button, Field } from '@/components/ui/ds';
import { formatCurrency, todayISO } from '@/lib/utils';

interface Props {
  defaultAccountId?: string;
  defaultAmount?: number;
  onClose: () => void;
}

export function PaymentForm({ defaultAccountId, defaultAmount, onClose }: Props) {
  const accounts = useAccountStore((s) => s.accounts);
  const actions = useActions();

  const [accountId, setAccountId] = useState(defaultAccountId ?? (accounts[0]?.id ?? ''));
  const [amount, setAmount] = useState(defaultAmount != null ? defaultAmount.toFixed(2) : '');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const QUICK_AMOUNTS = selectedAccount
    ? [
        { label: 'Minimum', value: selectedAccount.minimumDue },
        { label: `Min +$50`, value: selectedAccount.minimumDue + 50 },
        { label: `Min +$100`, value: selectedAccount.minimumDue + 100 },
        { label: 'Pay Off', value: selectedAccount.totalDue },
      ]
    : [];

  const numericAmount = parseFloat(amount);
  const balanceAfter = selectedAccount && numericAmount > 0
    ? Math.max(0, selectedAccount.totalDue - numericAmount)
    : null;

  function validate() {
    const errs: Record<string, string> = {};
    if (!accountId) errs.accountId = 'Select an account';
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount';
    if (!date) errs.date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    actions.recordPayment(accountId, parseFloat(amount), date, note.trim());
    onClose();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Account" error={errors.accountId}>
        <select
          className="ds-select"
          value={accountId}
          onChange={(e) => { setAccountId(e.target.value); setAmount(''); }}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Amount" error={errors.amount}>
        <div className="input-prefix">
          <span>$</span>
          <input
            className="ds-input"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
        {QUICK_AMOUNTS.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q.label}
                onClick={() => setAmount(q.value.toFixed(2))}
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: amount === q.value.toFixed(2) ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                  background: amount === q.value.toFixed(2) ? 'var(--ink)' : 'var(--surface)',
                  color: amount === q.value.toFixed(2) ? '#fff' : 'var(--ink-2)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}
      </Field>

      {/* Balance after preview */}
      {balanceAfter !== null && selectedAccount && (
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
        }}>
          <span style={{ color: 'var(--ink-3)' }}>Balance after payment</span>
          <span style={{ fontWeight: 700, color: balanceAfter === 0 ? 'var(--positive)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
            {balanceAfter === 0 ? '🎉 Paid off!' : formatCurrency(balanceAfter)}
          </span>
        </div>
      )}

      <Field label="Date" error={errors.date}>
        <input
          className="ds-input"
          type="date"
          max={todayISO()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>

      <Field label="Note">
        <input
          className="ds-input"
          placeholder="Optional note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Record Payment</Button>
      </div>
    </div>
  );
}
