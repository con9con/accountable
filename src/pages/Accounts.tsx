import { useState, useMemo, useRef, useEffect } from 'react';
import { useAccountStore } from '@/store/useAccountStore';
import { useActions } from '@/hooks/useActions';
import { Icon, Button, Modal, Confirm, Sparkline, Field } from '@/components/ui/ds';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_COLORS } from '@/types';
import type { Account, Payment } from '@/types';
import { formatCurrency, formatDate, formatDateShort, daysUntil, todayISO } from '@/lib/utils';
import { AccountForm } from '@/components/accounts/AccountForm';
import { PaymentForm } from '@/components/accounts/PaymentForm';

type FilterKey = 'all' | 'closed' | Account['type'];
type SortKey = 'balance' | 'name' | 'apr' | 'due';

function TypeChip({ type }: { type: Account['type'] }) {
  const meta = ACCOUNT_TYPES.find((t) => t.key === type);
  if (!meta) return null;
  const color = ACCOUNT_TYPE_COLORS[type];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      background: `${color}22`, color,
    }}>
      {meta.label}
    </span>
  );
}

function DueBadge({ dueDate }: { dueDate?: string }) {
  const days = daysUntil(dueDate);
  if (days === null) return null;
  if (days < 0) return <span className="badge badge-danger">Past Due</span>;
  if (days === 0) return <span className="badge badge-danger">Due Today</span>;
  if (days <= 7) return <span className="badge badge-warning">Due in {days}d</span>;
  if (days <= 14) return <span className="badge badge-info">Due in {days}d</span>;
  return null;
}

function EditPaymentForm({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const actions = useActions();
  const [amount, setAmount] = useState(payment.amount.toFixed(2));
  const [date, setDate] = useState(payment.date);
  const [note, setNote] = useState(payment.note ?? '');
  const [error, setError] = useState('');

  function handleSave() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    actions.updatePayment(payment.id, { amount: amt, date, note: note.trim() });
    onClose();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Amount" error={error}>
        <div className="input-prefix">
          <span>$</span>
          <input className="ds-input" type="number" min="0.01" step="0.01" value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }} autoFocus />
        </div>
      </Field>
      <Field label="Date">
        <input className="ds-input" type="date" max={todayISO()} value={date}
          onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Note">
        <input className="ds-input" placeholder="Optional note..." value={note}
          onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}

function CardActions({ account: a, expanded, onToggleExpanded, onPay, onEdit, onToggleClosed, onDelete }: {
  account: Account;
  expanded: boolean;
  onToggleExpanded: () => void;
  onPay: (a: Account) => void;
  onEdit: (a: Account) => void;
  onToggleClosed: (a: Account) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const isClosed = a.status === 'closed';

  const menuItems = [
    ...(!isClosed ? [{ label: 'Record Payment', icon: 'dollar' as const, onClick: () => { onPay(a); setOpen(false); } }] : []),
    { label: 'Edit', icon: 'edit' as const, onClick: () => { onEdit(a); setOpen(false); } },
    { label: isClosed ? 'Reopen' : 'Close Account', icon: 'x' as const, onClick: () => { onToggleClosed(a); setOpen(false); } },
    { label: 'Delete', icon: 'trash' as const, danger: true, onClick: () => { onDelete(a.id); setOpen(false); } },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button
        onClick={onToggleExpanded}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--ink-3)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
        }}
      >
        <Icon name={expanded ? 'chevronUp' : 'chevronDown'} size={13} />
        {expanded ? 'Hide payments' : 'View payments'}
      </button>

      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            background: open ? 'var(--surface-3)' : 'none',
            border: '1px solid ' + (open ? 'var(--border)' : 'transparent'),
            borderRadius: 'var(--r-sm)',
            cursor: 'pointer', color: 'var(--ink-3)',
            width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.12s, color 0.12s',
          }}
          aria-label="Account actions"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.4" />
            <circle cx="8" cy="8" r="1.4" />
            <circle cx="8" cy="13" r="1.4" />
          </svg>
        </button>

        {open && (
          <div style={{
            position: 'absolute', bottom: '100%', right: 0, marginBottom: 6,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)',
            minWidth: 170, zIndex: 20, overflow: 'hidden',
          }}>
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 13.5, textAlign: 'left',
                  color: item.danger ? 'var(--danger)' : 'var(--ink-2)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = item.danger ? 'var(--danger-2)' : 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <Icon name={item.icon} size={14} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AccountCardProps {
  account: Account;
  payments: Payment[];
  onEdit: (a: Account) => void;
  onDelete: (id: string) => void;
  onPay: (a: Account) => void;
  onAddDueDate: (a: Account) => void;
  onEditPayment: (p: Payment) => void;
  onToggleClosed: (a: Account) => void;
}

function AccountCard({ account: a, payments, onEdit, onDelete, onPay, onAddDueDate, onEditPayment, onToggleClosed }: AccountCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = ACCOUNT_TYPE_COLORS[a.type] || 'var(--accent)';
  const orig = a.originalBalance ?? a.totalDue;
  const pct = orig > 0 ? Math.max(0, (orig - a.totalDue) / orig) : 0;
  const history = (a.balanceHistory ?? []).map((e) => e.balance);
  const acctPayments = payments.filter((p) => p.accountId === a.id).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 5);
  const isClosed = a.status === 'closed';

  return (
    <div className="card" style={{ opacity: isClosed ? 0.7 : 1 }}>

      {/* Card body */}
      <div style={{ padding: '16px 18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <TypeChip type={a.type} />
              {a.issuer && (
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{a.issuer}</span>
              )}
              {isClosed
                ? <span className="badge" style={{ background: 'var(--border)', color: 'var(--ink-3)' }}>Closed</span>
                : <DueBadge dueDate={a.dueDate} />
              }
            </div>
          </div>
          {/* Balance */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {formatCurrency(a.totalDue)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{Math.round(pct * 100)}% paid</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Min. Payment</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(a.minimumDue)}<span style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 400 }}>/mo</span></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>APR</span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{a.interestRate}%</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Due Date</span>
            {a.dueDate ? (
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{formatDateShort(a.dueDate)}</span>
            ) : (
              <button
                onClick={() => onAddDueDate(a)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontWeight: 600, textAlign: 'left' }}
              >
                + Add
              </button>
            )}
          </div>
        </div>

        {/* Sparkline */}
        {history.length >= 2 && (
          <div style={{ marginBottom: 14 }}>
            <Sparkline data={history} height={32} color={color} />
          </div>
        )}

        {/* Bottom row: payments toggle + kebab menu */}
        <CardActions
          account={a}
          expanded={expanded}
          onToggleExpanded={() => setExpanded((v) => !v)}
          onPay={onPay}
          onEdit={onEdit}
          onToggleClosed={onToggleClosed}
          onDelete={onDelete}
        />

        {/* Expanded: recent payments */}
        {expanded && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-3)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Recent Payments
            </div>
            {acctPayments.length === 0 ? (
              <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>No payments recorded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {acctPayments.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border-3)', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{formatDate(p.date)}</div>
                      {p.note && <div style={{ color: 'var(--ink-4)', fontSize: 11.5 }}>{p.note}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(p.amount)}</span>
                      <button
                        onClick={() => onEditPayment(p)}
                        style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--ink-4)', lineHeight: 1 }}
                        title="Edit payment"
                      >
                        <Icon name="edit" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Accounts() {
  const accounts = useAccountStore((s) => s.accounts);
  const payments = useAccountStore((s) => s.payments);
  const actions = useActions();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('balance');
  const [showAdd, setShowAdd] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [payAccount, setPayAccount] = useState<Account | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);

  const closedCount = accounts.filter((a) => a.status === 'closed').length;
  const visibleAccounts = filter === 'closed'
    ? accounts.filter((a) => a.status === 'closed')
    : accounts.filter((a) => a.status !== 'closed');

  const sortFn = (a: Account, b: Account) => {
    if (sort === 'balance') return b.totalDue - a.totalDue;
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'apr') return b.interestRate - a.interestRate;
    if (sort === 'due') {
      const da = daysUntil(a.dueDate) ?? 999;
      const db = daysUntil(b.dueDate) ?? 999;
      return da - db;
    }
    return 0;
  };

  const presentTypes = useMemo(
    () => ACCOUNT_TYPES.filter((t) => visibleAccounts.some((a) => a.type === t.key)),
    [visibleAccounts]
  );

  const filtered = useMemo(() => {
    const list = (filter === 'all' || filter === 'closed') ? visibleAccounts : visibleAccounts.filter((a) => a.type === filter);
    return [...list].sort(sortFn);
  }, [visibleAccounts, filter, sort]);

  const grouped = useMemo(() =>
    presentTypes.map((t) => ({
      ...t,
      accounts: [...visibleAccounts.filter((a) => a.type === t.key)].sort(sortFn),
    })),
    [visibleAccounts, sort, presentTypes]
  );

  const cardProps = (a: Account) => ({
    account: a,
    payments,
    onEdit: setEditAccount,
    onDelete: setDeleteId,
    onPay: setPayAccount,
    onAddDueDate: setEditAccount,
    onEditPayment: setEditPayment,
    onToggleClosed: (acct: Account) => actions.updateAccount(acct.id, { status: acct.status === 'closed' ? 'active' : 'closed' }),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>Accounts</h1>
          <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} · {formatCurrency(accounts.reduce((s, a) => s + a.totalDue, 0))} total
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Account
        </Button>
      </div>

      {/* Filter + sort bar */}
      {accounts.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Filter</label>
            <select
              className="ds-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterKey)}
              style={{ width: 'auto', fontSize: 12.5, background: 'rgba(255,255,255,0.08)', color: '#fff', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <option value="all" style={{ background: '#1a1a3e', color: '#fff' }}>All</option>
              {presentTypes.map((t) => (
                <option key={t.key} value={t.key} style={{ background: '#1a1a3e', color: '#fff' }}>{t.label}</option>
              ))}
              {closedCount > 0 && <option value="closed" style={{ background: '#1a1a3e', color: '#fff' }}>Closed ({closedCount})</option>}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <label style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Sort By</label>
            <select
              className="ds-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={{ width: 'auto', fontSize: 12.5, background: 'rgba(255,255,255,0.08)', color: '#fff', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <option value="balance" style={{ background: '#1a1a3e', color: '#fff' }}>Balance</option>
              <option value="name" style={{ background: '#1a1a3e', color: '#fff' }}>Name</option>
              <option value="apr" style={{ background: '#1a1a3e', color: '#fff' }}>APR</option>
              <option value="due" style={{ background: '#1a1a3e', color: '#fff' }}>Due Date</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty state */}
      {accounts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-3)' }}>
          <Icon name="card" size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14, marginBottom: 16 }}>No accounts yet. Add your first account to start tracking.</p>
          <Button variant="outline" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} /> Add Account
          </Button>
        </div>
      )}

      {/* Grouped view — all types */}
      {(filter === 'all') && grouped.map((group) => (
        <div key={group.key}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: group.color, display: 'inline-block' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{group.label}</span>
            <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>
              · {group.accounts.length} account{group.accounts.length !== 1 ? 's' : ''}
              · {formatCurrency(group.accounts.reduce((s, a) => s + a.totalDue, 0))}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {group.accounts.map((a) => (
              <AccountCard key={a.id} {...cardProps(a)} />
            ))}
          </div>
        </div>
      ))}

      {/* Single-type / closed filtered view */}
      {filter !== 'all' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map((a) => (
            <AccountCard key={a.id} {...cardProps(a)} />
          ))}
        </div>
      )}

      {/* No match for filter */}
      {accounts.length > 0 && filter !== 'all' && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--ink-3)', fontSize: 14 }}>
          {filter === 'closed'
            ? 'No closed accounts.'
            : `No ${ACCOUNT_TYPES.find((t) => t.key === filter)?.label} accounts yet.`}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Account">
        <AccountForm onClose={() => setShowAdd(false)} />
      </Modal>
      <Modal open={!!editAccount} onClose={() => setEditAccount(null)} title="Edit Account">
        {editAccount && <AccountForm account={editAccount} onClose={() => setEditAccount(null)} />}
      </Modal>
      <Modal open={!!payAccount} onClose={() => setPayAccount(null)} title="Record Payment">
        {payAccount && <PaymentForm defaultAccountId={payAccount.id} onClose={() => setPayAccount(null)} />}
      </Modal>
      <Modal open={!!editPayment} onClose={() => setEditPayment(null)} title="Edit Payment">
        {editPayment && <EditPaymentForm payment={editPayment} onClose={() => setEditPayment(null)} />}
      </Modal>
      <Confirm
        open={!!deleteId}
        title="Delete Account"
        message="This will permanently delete this account and all its payment history."
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleteId) actions.deleteAccount(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
