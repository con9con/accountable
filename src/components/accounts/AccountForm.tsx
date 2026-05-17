import { useState } from 'react';
import { useAccountStore } from '@/store/useAccountStore';
import { Icon, Button, Field } from '@/components/ui/ds';
import { ACCOUNT_TYPES } from '@/types';
import type { Account } from '@/types';
import { todayISO } from '@/lib/utils';

interface Props {
  account?: Account;
  onClose: () => void;
}

export function AccountForm({ account, onClose }: Props) {
  const addAccount = useAccountStore((s) => s.addAccount);
  const updateAccount = useAccountStore((s) => s.updateAccount);

  const isEdit = !!account;
  const [step, setStep] = useState<1 | 2>(isEdit ? 2 : 1);
  const [type, setType] = useState<Account['type']>(account?.type ?? 'credit_card');

  const [name, setName] = useState(account?.name ?? '');
  const [issuer, setIssuer] = useState(account?.issuer ?? '');
  const [balance, setBalance] = useState(account?.totalDue?.toString() ?? '');
  const [originalBalance, setOriginalBalance] = useState(account?.originalBalance?.toString() ?? '');
  const [minPayment, setMinPayment] = useState(account?.minimumDue?.toString() ?? '');
  const [apr, setApr] = useState(account?.interestRate?.toString() ?? '');
  const [dueDate, setDueDate] = useState(account?.dueDate ?? '');
  const [notes, setNotes] = useState(account?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    const bal = parseFloat(balance);
    if (isNaN(bal) || bal < 0) errs.balance = 'Enter a valid balance';
    const min = parseFloat(minPayment);
    if (isNaN(min) || min < 0) errs.minPayment = 'Enter a valid minimum payment';
    const rate = parseFloat(apr);
    if (isNaN(rate) || rate < 0 || rate > 100) errs.apr = 'Enter a rate between 0 and 100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const data = {
      type,
      name: name.trim(),
      issuer: issuer.trim() || undefined,
      totalDue: parseFloat(balance),
      minimumDue: parseFloat(minPayment),
      interestRate: parseFloat(apr),
      dueDate: dueDate || undefined,
      originalBalance: originalBalance ? parseFloat(originalBalance) : undefined,
      notes: notes.trim() || undefined,
    };
    if (isEdit && account) {
      updateAccount(account.id, data);
    } else {
      addAccount(data);
    }
    onClose();
  }

  // Step 1: pick account type
  if (step === 1) {
    return (
      <div>
        <p style={{ color: 'var(--ink-3)', fontSize: 13, marginBottom: 18 }}>
          What type of account would you like to add?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => { setType(t.key); setStep(2); }}
              style={{
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface)',
                padding: '16px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.12s, background 0.12s',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <span style={{ color: t.color }}>
                <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={20} />
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: fill details
  const typeMeta = ACCOUNT_TYPES.find((t) => t.key === type)!;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!isEdit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <button
            onClick={() => setStep(1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5 }}
          >
            <Icon name="chevronDown" size={12} style={{ transform: 'rotate(90deg)' }} />
            Back
          </button>
          <span
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600, color: typeMeta.color,
              background: `${typeMeta.color}22`,
              padding: '3px 10px', borderRadius: 999,
            }}
          >
            <Icon name={typeMeta.icon as Parameters<typeof Icon>[0]['name']} size={12} />
            {typeMeta.label}
          </span>
        </div>
      )}

      <Field label="Account Name" error={errors.name}>
        <input
          className="ds-input"
          placeholder={`e.g. ${type === 'credit_card' ? 'Chase Sapphire' : type === 'car_loan' ? '2022 Honda Accord' : 'SoFi Loan'}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </Field>

      <Field label="Issuer / Lender">
        <input
          className="ds-input"
          placeholder={`e.g. ${type === 'credit_card' ? 'Chase' : type === 'car_loan' ? 'Honda Financial' : 'SoFi'}`}
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Current Balance" error={errors.balance}>
          <div className="input-prefix">
            <span>$</span>
            <input
              className="ds-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>
        </Field>
        <Field label="Original Balance">
          <div className="input-prefix">
            <span>$</span>
            <input
              className="ds-input"
              type="number"
              min="0"
              step="0.01"
              placeholder={balance || '0.00'}
              value={originalBalance}
              onChange={(e) => setOriginalBalance(e.target.value)}
            />
          </div>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Minimum Payment" error={errors.minPayment}>
          <div className="input-prefix">
            <span>$</span>
            <input
              className="ds-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={minPayment}
              onChange={(e) => setMinPayment(e.target.value)}
            />
          </div>
        </Field>
        <Field label="Interest Rate (APR)" error={errors.apr}>
          <div style={{ position: 'relative' }}>
            <input
              className="ds-input"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="0.00"
              value={apr}
              onChange={(e) => setApr(e.target.value)}
              style={{ paddingRight: 28 }}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', fontSize: 13 }}>%</span>
          </div>
        </Field>
      </div>

      <Field label="Due Date" hint="Optional — we'll alert you when this is approaching">
        <input
          className="ds-input"
          type="date"
          min={todayISO()}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </Field>

      <Field label="Notes">
        <textarea
          className="ds-textarea"
          placeholder="Any notes about this account..."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </Field>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>
          {isEdit ? 'Save Changes' : 'Add Account'}
        </Button>
      </div>
    </div>
  );
}
