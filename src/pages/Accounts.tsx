import { useState, useMemo } from 'react';
import { useAccountStore } from '@/store/useAccountStore';
import { useActions } from '@/hooks/useActions';
import { Card, CardHead, CardBody, Icon, Button, Modal, Confirm, Sparkline } from '@/components/ui/ds';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_COLORS } from '@/types';
import type { Account } from '@/types';
import { formatCurrency, formatDate, formatDateShort, daysUntil } from '@/lib/utils';
import { AccountForm } from '@/components/accounts/AccountForm';
import { PaymentForm } from '@/components/accounts/PaymentForm';

type FilterKey = 'all' | Account['type'];
type SortKey = 'balance' | 'name' | 'apr' | 'due';

function TypeChip({ type }: { type: Account['type'] }) {
  const meta = ACCOUNT_TYPES.find((t) => t.key === type);
  if (!meta) return null;
  const color = ACCOUNT_TYPE_COLORS[type];
  return (
    <span className="type-chip" style={{ '--chip-color': color } as React.CSSProperties}>
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

interface AccountRowProps {
  account: Account;
  payments: import('@/types').Payment[];
  onEdit: (a: Account) => void;
  onDelete: (id: string) => void;
  onPay: (a: Account) => void;
}

function AccountRow({ account: a, payments, onEdit, onDelete, onPay }: AccountRowProps) {
  const [expanded, setExpanded] = useState(false);
  const orig = a.originalBalance ?? a.totalDue;
  const pct = orig > 0 ? Math.max(0, (orig - a.totalDue) / orig) : 0;
  const color = ACCOUNT_TYPE_COLORS[a.type] || 'var(--accent)';
  const history = (a.balanceHistory ?? []).map((e) => e.balance);
  const acctPayments = payments.filter((p) => p.accountId === a.id).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 5);

  return (
    <>
      <tr className={`clickable${expanded ? ' expanded' : ''}`} onClick={() => setExpanded((e) => !e)}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 36, borderRadius: 2, background: color, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <TypeChip type={a.type} />
                <DueBadge dueDate={a.dueDate} />
              </div>
            </div>
          </div>
        </td>
        <td className="hide-sm" style={{ color: 'var(--ink-3)', fontSize: 13 }}>
          {a.dueDate ? formatDateShort(a.dueDate) : '—'}
        </td>
        <td className="hide-sm" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(a.minimumDue)}<span style={{ color: 'var(--ink-4)', fontSize: 11 }}>/mo</span>
        </td>
        <td className="hide-sm" style={{ fontSize: 13 }}>{a.interestRate}%</td>
        <td style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
            {history.length >= 2 && (
              <div style={{ width: 60 }} className="hide-sm">
                <Sparkline data={history} height={24} color={color} />
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(a.totalDue)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{Math.round(pct * 100)}% paid</div>
            </div>
            <Icon name={expanded ? 'chevronUp' : 'chevronDown'} size={14} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="expand-row">
          <td colSpan={5}>
            <div className="acct-detail">
              <div>
                <div className="panel-title">Progress</div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
                  <span>{formatCurrency(orig - a.totalDue)} paid</span>
                  <span>of {formatCurrency(orig)}</span>
                </div>

                <div className="panel-title">Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13 }}>
                  {a.issuer && (
                    <>
                      <span style={{ color: 'var(--ink-3)' }}>Issuer</span>
                      <span>{a.issuer}</span>
                    </>
                  )}
                  <span style={{ color: 'var(--ink-3)' }}>Min. Payment</span>
                  <span>{formatCurrency(a.minimumDue)}</span>
                  <span style={{ color: 'var(--ink-3)' }}>Interest Rate</span>
                  <span>{a.interestRate}% APR</span>
                  {a.dueDate && (
                    <>
                      <span style={{ color: 'var(--ink-3)' }}>Due Date</span>
                      <span>{formatDate(a.dueDate)}</span>
                    </>
                  )}
                  {a.notes && (
                    <>
                      <span style={{ color: 'var(--ink-3)' }}>Notes</span>
                      <span style={{ color: 'var(--ink-2)' }}>{a.notes}</span>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); onPay(a); }}>
                    <Icon name="dollar" size={13} /> Record Payment
                  </Button>
                  <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(a); }}>
                    <Icon name="edit" size={13} /> Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(a.id); }}>
                    <Icon name="trash" size={13} />
                  </Button>
                </div>
              </div>

              <div>
                <div className="panel-title">Recent Payments</div>
                {acctPayments.length === 0 ? (
                  <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>No payments recorded yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {acctPayments.map((p) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border-3)', fontSize: 13 }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{formatDate(p.date)}</div>
                          {p.note && <div style={{ color: 'var(--ink-4)', fontSize: 11.5 }}>{p.note}</div>}
                        </div>
                        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {history.length >= 2 && (
                  <div style={{ marginTop: 16 }}>
                    <div className="panel-title" style={{ marginBottom: 8 }}>Balance History</div>
                    <Sparkline data={history} height={40} color={color} />
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
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

  const filtered = useMemo(() => {
    let list = filter === 'all' ? accounts : accounts.filter((a) => a.type === filter);
    return [...list].sort((a, b) => {
      if (sort === 'balance') return b.totalDue - a.totalDue;
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'apr') return b.interestRate - a.interestRate;
      if (sort === 'due') {
        const da = daysUntil(a.dueDate) ?? 999;
        const db = daysUntil(b.dueDate) ?? 999;
        return da - db;
      }
      return 0;
    });
  }, [accounts, filter, sort]);

  const totalDebt = filtered.reduce((s, a) => s + a.totalDue, 0);

  const presentTypes = useMemo(
    () => ACCOUNT_TYPES.filter((t) => accounts.some((a) => a.type === t.key)),
    [accounts]
  );

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
        <Button onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Account
        </Button>
      </div>

      {/* Filter chips + sort */}
      {accounts.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
            {[{ key: 'all', label: 'All', color: '' }, ...presentTypes].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key as FilterKey)}
                style={{
                  padding: '5px 12px',
                  fontSize: 12.5,
                  fontWeight: 500,
                  borderRadius: 999,
                  border: filter === t.key ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                  background: filter === t.key ? 'var(--ink)' : 'var(--surface)',
                  color: filter === t.key ? '#fff' : 'var(--ink-2)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {'color' in t && t.color && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
                )}
                {t.label}
              </button>
            ))}
          </div>
          <select
            className="ds-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            style={{ width: 'auto', minWidth: 130, fontSize: 12.5 }}
          >
            <option value="balance">Sort: Balance</option>
            <option value="name">Sort: Name</option>
            <option value="apr">Sort: APR</option>
            <option value="due">Sort: Due Date</option>
          </select>
        </div>
      )}

      {/* Empty state */}
      {accounts.length === 0 && (
        <Card>
          <CardBody>
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-3)' }}>
              <Icon name="card" size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 14, marginBottom: 16 }}>No accounts yet. Add your first account to start tracking.</p>
              <Button onClick={() => setShowAdd(true)}>
                <Icon name="plus" size={14} /> Add Account
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Accounts table */}
      {filtered.length > 0 && (
        <Card>
          {filter !== 'all' && (
            <CardHead>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {ACCOUNT_TYPES.find((t) => t.key === filter)?.label ?? 'Accounts'}
                <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>· {formatCurrency(totalDebt)}</span>
              </span>
            </CardHead>
          )}
          <CardBody style={{ padding: 0 }}>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th className="hide-sm">Due</th>
                    <th className="hide-sm">Minimum</th>
                    <th className="hide-sm">APR</th>
                    <th style={{ textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <AccountRow
                      key={a.id}
                      account={a}
                      payments={payments}
                      onEdit={setEditAccount}
                      onDelete={setDeleteId}
                      onPay={setPayAccount}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* No match for filter */}
      {accounts.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--ink-3)', fontSize: 14 }}>
          No {ACCOUNT_TYPES.find((t) => t.key === filter)?.label} accounts yet.
        </div>
      )}

      {/* Add Account modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Account">
        <AccountForm onClose={() => setShowAdd(false)} />
      </Modal>

      {/* Edit Account modal */}
      <Modal open={!!editAccount} onClose={() => setEditAccount(null)} title="Edit Account">
        {editAccount && (
          <AccountForm account={editAccount} onClose={() => setEditAccount(null)} />
        )}
      </Modal>

      {/* Record Payment modal */}
      <Modal open={!!payAccount} onClose={() => setPayAccount(null)} title="Record Payment">
        {payAccount && (
          <PaymentForm defaultAccountId={payAccount.id} onClose={() => setPayAccount(null)} />
        )}
      </Modal>

      {/* Delete confirm */}
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
