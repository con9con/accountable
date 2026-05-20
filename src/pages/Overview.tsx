import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useAccountStore } from '@/store/useAccountStore';
import { useActions } from '@/hooks/useActions';
import { Card, CardHead, CardBody, Icon, Button, Ring, Sparkline, LineChart, Modal } from '@/components/ui/ds';
import { PaymentForm } from '@/components/accounts/PaymentForm';
import { AccountForm } from '@/components/accounts/AccountForm';
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPES } from '@/types';
import {
  formatCurrency, formatCurrencyShort, formatDate, formatDateShort,
  daysUntil, fmtMonths, calculatePayoff,
} from '@/lib/utils';

function TypeChip({ type }: { type: string }) {
  const meta = ACCOUNT_TYPES.find((t) => t.key === type);
  if (!meta) return null;
  return (
    <span
      className="type-chip"
      style={{ '--chip-color': meta.color } as React.CSSProperties}
    >
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

export function Overview() {
  const accounts = useAccountStore((s) => s.accounts);
  const payments = useAccountStore((s) => s.payments);
  const actions = useActions();
  const navigate = useNavigate();

  const [paidId, setPaidId] = useState<string | null>(null);
  const [payAccount, setPayAccount] = useState<{ id: string; minimumDue: number } | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const activeAccounts = accounts.filter((a) => a.status !== 'closed');
  useNotifications(activeAccounts);

  const totalDebt = activeAccounts.reduce((s, a) => s + a.totalDue, 0);
  const totalMin = activeAccounts.reduce((s, a) => s + a.minimumDue, 0);
  const totalOriginal = activeAccounts.reduce((s, a) => s + (a.originalBalance ?? a.totalDue), 0);
  const totalPaidDown = totalOriginal - totalDebt;
  const avgAPR = activeAccounts.length ? activeAccounts.reduce((s, a) => s + a.interestRate, 0) / activeAccounts.length : 0;

  // Next due account
  const withDue = activeAccounts
    .filter((a) => a.dueDate)
    .sort((a, b) => {
      const da = daysUntil(a.dueDate) ?? 999;
      const db = daysUntil(b.dueDate) ?? 999;
      return da - db;
    });
  const nextDue = withDue[0];
  const nextDueDays = nextDue ? daysUntil(nextDue.dueDate) : null;

  // Upcoming bills (next 30 days)
  const upcoming = withDue.filter((a) => {
    const d = daysUntil(a.dueDate);
    return d !== null && d >= 0 && d <= 30;
  });

  // Balance history aggregation
  const allDates = new Set<string>();
  activeAccounts.forEach((a) => (a.balanceHistory ?? []).forEach((e) => allDates.add(e.date)));
  const sortedDates = Array.from(allDates).sort();
  const historyData = sortedDates.map((date) => {
    const total = activeAccounts.reduce((sum, a) => {
      const history = a.balanceHistory ?? [];
      const entry = [...history].filter((e) => e.date <= date).sort((x, y) => y.date.localeCompare(x.date))[0];
      return sum + (entry ? entry.balance : a.totalDue);
    }, 0);
    return { label: formatDateShort(date), value: total };
  });

  // Payoff projections
  const payoffAvalanche = calculatePayoff(activeAccounts, 0, 'avalanche');
  const payoffSnowball = calculatePayoff(activeAccounts, 0, 'snowball');
  const payoffResult = payoffAvalanche;
  const pctPaid = totalOriginal > 0 ? totalPaidDown / totalOriginal : 0;

  // Recent payments
  const recentPayments = [...payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // Monthly budget tracker
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const paidThisMonth = payments
    .filter((p) => p.date.startsWith(thisMonth))
    .reduce((s, p) => s + p.amount, 0);
  const monthPct = totalMin > 0 ? Math.min(1, paidThisMonth / totalMin) : 0;

  // Debt by type
  const byType = ACCOUNT_TYPES.map((t) => ({
    ...t,
    total: activeAccounts.filter((a) => a.type === t.key).reduce((s, a) => s + a.totalDue, 0),
  })).filter((t) => t.total > 0);

  function handleMarkPaid(accountId: string) {
    setPaidId(accountId);
  }

  function confirmPaid() {
    if (!paidId) return;
    const account = accounts.find((a) => a.id === paidId);
    if (account) {
      const today = new Date().toISOString().split('T')[0];
      actions.recordPayment(paidId, account.minimumDue, today, 'Minimum payment');
    }
    setPaidId(null);
  }

  if (activeAccounts.length === 0 && accounts.length === 0) {
    return (
      <div style={{ padding: '48px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Welcome to Accountable</h2>
        <p style={{ color: 'var(--ink-3)', marginBottom: 28, lineHeight: 1.6 }}>
          Track your debts, plan your payoff, and stay motivated. Add your first account to get started.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button variant="outline" onClick={() => setShowAdd(true)}>Add Account</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero headline */}
      <div className="overview-hero">
        <div>
          <div style={{ color: 'var(--ink-3)', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            Total Debt — {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>
            {formatCurrency(totalDebt)}
          </div>
          {totalPaidDown > 0 && (
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--positive)', fontWeight: 500 }}>
              ↓ {formatCurrencyShort(totalPaidDown)} paid down so far
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} /> Add Account
          </Button>
        </div>
      </div>

      {/* Metric strip */}
      <div className="metric-row">
        <div className="metric-cell">
          <div className="metric-label">Min. Monthly</div>
          <div className="metric-value">{formatCurrency(totalMin)}</div>
        </div>
        <div className="metric-cell">
          <div className="metric-label">Avg APR</div>
          <div className="metric-value">{avgAPR.toFixed(1)}%</div>
        </div>
        <div className="metric-cell">
          <div className="metric-label">Paid Down</div>
          <div className="metric-value" style={{ color: 'var(--positive)' }}>{formatCurrencyShort(totalPaidDown)}</div>
        </div>
        <div className="metric-cell">
          <div className="metric-label">Debt-free</div>
          <div className="metric-value" style={{ fontSize: 15 }}>
            {payoffResult
              ? payoffResult.debtFreeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : '—'}
          </div>
        </div>
      </div>

      <div className="overview-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Next Due hero */}
          {nextDue && nextDueDays !== null && nextDueDays <= 14 && (
            <div className="hero-due">
              <div className="hero-due-label">Next Due</div>
              <div className="hero-due-name">{nextDue.name}</div>
              <div className="hero-due-amount">{formatCurrency(nextDue.minimumDue)}</div>
              <div className="hero-due-date">
                {nextDueDays === 0
                  ? 'Due today'
                  : nextDueDays < 0
                  ? `${Math.abs(nextDueDays)}d overdue`
                  : `Due in ${nextDueDays} day${nextDueDays !== 1 ? 's' : ''}`}
                {nextDue.dueDate && ` · ${formatDateShort(nextDue.dueDate)}`}
              </div>
              <Button
                onClick={() => handleMarkPaid(nextDue.id)}
                className="hero-due-btn"
              >
                <Icon name="check" size={14} /> Mark as Paid
              </Button>
            </div>
          )}

          {/* Progress ring */}
          {totalOriginal > 0 && (
            <Card>
              <CardHead>Journey to Zero</CardHead>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <Ring pct={pctPaid} size={96} stroke={10} color="var(--positive)">
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--positive)' }}>
                      {Math.round(pctPaid * 100)}%
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>paid</span>
                  </Ring>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 4 }}>
                      {formatCurrencyShort(totalPaidDown)} paid of {formatCurrencyShort(totalOriginal)}
                    </div>
                    {payoffResult && (
                      <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                        Debt-free in <strong>{fmtMonths(payoffResult.totalMonths)}</strong>
                        <br />
                        <span style={{ color: 'var(--ink-3)' }}>
                          {payoffResult.debtFreeDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Upcoming bills */}
          {upcoming.length > 0 && (
            <Card>
              <CardHead>Upcoming Bills</CardHead>
              <CardBody style={{ padding: '0 0 0 16px' }}>
                <div className="up-strip">
                  {upcoming.map((a) => {
                    const d = daysUntil(a.dueDate)!;
                    const color = ACCOUNT_TYPE_COLORS[a.type] || 'var(--accent)';
                    return (
                      <div key={a.id} className="up-card">
                        <div className="up-card-dot" style={{ background: color }} />
                        <div className="up-card-name">{a.name}</div>
                        <div className="up-card-amount">{formatCurrencyShort(a.minimumDue)}</div>
                        <div className="up-card-date">
                          {d === 0 ? 'today' : d < 0 ? `${Math.abs(d)}d ago` : `in ${d}d`}
                        </div>
                        <button
                          className="up-card-pay"
                          onClick={() => setPayAccount({ id: a.id, minimumDue: a.minimumDue })}
                        >
                          Pay
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Monthly budget tracker */}
          {totalMin > 0 && (
            <Card>
              <CardHead>This Month</CardHead>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                    {paidThisMonth > 0 ? (
                      <><strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrencyShort(paidThisMonth)}</strong> paid of {formatCurrencyShort(totalMin)} minimum</>
                    ) : (
                      <>No payments recorded yet this month</>
                    )}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: monthPct >= 1 ? 'var(--positive)' : 'var(--ink-3)' }}>
                    {Math.round(monthPct * 100)}%
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${monthPct * 100}%`,
                    background: monthPct >= 1 ? 'var(--positive)' : 'var(--accent)',
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                {monthPct >= 1 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--positive)', fontWeight: 500 }}>
                    All minimums covered this month
                  </div>
                )}
                {monthPct > 0 && monthPct < 1 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-3)' }}>
                    {formatCurrencyShort(totalMin - paidThisMonth)} remaining to cover minimums
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Recent payments */}
          <Card>
            <CardHead
              action={
                recentPayments.length > 0 ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/accounts')}
                    style={{ fontSize: 12 }}
                  >
                    View all
                  </button>
                ) : undefined
              }
            >
              Recent Payments
            </CardHead>
            <CardBody style={{ padding: recentPayments.length === 0 ? undefined : 0 }}>
              {recentPayments.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--ink-4)', fontSize: 13, padding: '8px 0' }}>
                  No payments yet — record your first one to start tracking progress.
                </div>
              ) : (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <tbody>
                      {recentPayments.map((p) => {
                        const acct = accounts.find((a) => a.id === p.accountId);
                        return (
                          <tr key={p.id}>
                            <td>
                              <div style={{ fontWeight: 500 }}>{acct?.name ?? '—'}</div>
                              {p.note && <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{p.note}</div>}
                            </td>
                            <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{formatDate(p.date)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                              {formatCurrency(p.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Balance history */}
          {historyData.length >= 2 && (
            <Card>
              <CardHead>Balance History</CardHead>
              <CardBody>
                <LineChart data={historyData} height={140} />
              </CardBody>
            </Card>
          )}

          {/* Payoff strategy comparison */}
          {payoffAvalanche && payoffSnowball && (
            <Card>
              <CardHead>Payoff Strategy</CardHead>
              <CardBody style={{ padding: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  {[
                    { label: 'Avalanche', sub: 'Highest APR first', result: payoffAvalanche, color: 'var(--accent)' },
                    { label: 'Snowball', sub: 'Lowest balance first', result: payoffSnowball, color: 'var(--positive)' },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      style={{
                        padding: '14px 16px',
                        borderRight: i === 0 ? '1px solid var(--border-3)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.color, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 10 }}>{s.sub}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', lineHeight: 1, marginBottom: 2 }}>
                        {fmtMonths(s.result.totalMonths)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
                        {s.result.debtFreeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{formatCurrencyShort(s.result.totalInterest)}</span> in interest
                      </div>
                    </div>
                  ))}
                </div>
                {payoffAvalanche.totalInterest !== payoffSnowball.totalInterest && (
                  <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-3)', fontSize: 12, color: 'var(--ink-3)' }}>
                    {payoffAvalanche.totalInterest < payoffSnowball.totalInterest ? (
                      <>Avalanche saves <strong style={{ color: 'var(--positive)' }}>{formatCurrencyShort(payoffSnowball.totalInterest - payoffAvalanche.totalInterest)}</strong> in interest</>
                    ) : (
                      <>Snowball saves <strong style={{ color: 'var(--positive)' }}>{formatCurrencyShort(payoffAvalanche.totalInterest - payoffSnowball.totalInterest)}</strong> in interest</>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Debt by type */}
          {byType.length > 0 && (
            <Card>
              <CardHead>Debt by Type</CardHead>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {byType.map((t) => {
                    const pct = totalDebt > 0 ? t.total / totalDebt : 0;
                    return (
                      <div key={t.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{t.label}</span>
                          <span style={{ color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrencyShort(t.total)} · {Math.round(pct * 100)}%
                          </span>
                        </div>
                        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct * 100}%`, background: t.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Per-account progress */}
          <Card>
            <CardHead
              action={
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/accounts')} style={{ fontSize: 12 }}>
                  Manage
                </button>
              }
            >
              Accounts
            </CardHead>
            <CardBody style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[...activeAccounts].sort((a, b) => b.totalDue - a.totalDue).map((a) => {
                  const orig = a.originalBalance ?? a.totalDue;
                  const pct = orig > 0 ? Math.max(0, (orig - a.totalDue) / orig) : 0;
                  const color = ACCOUNT_TYPE_COLORS[a.type] || 'var(--accent)';
                  const history = (a.balanceHistory ?? []).map((e) => e.balance);
                  return (
                    <div key={a.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <TypeChip type={a.type} />
                            <DueBadge dueDate={a.dueDate} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency(a.totalDue)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 1 }}>
                            {a.interestRate}% APR
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--ink-4)', minWidth: 32 }}>{Math.round(pct * 100)}%</span>
                        {history.length >= 2 && (
                          <div style={{ width: 60, flexShrink: 0 }}>
                            <Sparkline data={history} height={24} color={color} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Pay modal */}
      <Modal open={!!payAccount} onClose={() => setPayAccount(null)} title="Record Payment">
        {payAccount && (
          <PaymentForm
            defaultAccountId={payAccount.id}
            defaultAmount={payAccount.minimumDue}
            onClose={() => setPayAccount(null)}
          />
        )}
      </Modal>

      {/* Add account modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Account">
        {showAdd && <AccountForm onClose={() => setShowAdd(false)} />}
      </Modal>

      {/* Mark as paid confirm */}
      {paidId && (
        <div className="modal-backdrop" onClick={() => setPaidId(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title">Mark Minimum as Paid</span>
              <button className="modal-close" onClick={() => setPaidId(null)}><Icon name="x" size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>
                Record a payment of{' '}
                <strong>{formatCurrency(accounts.find((a) => a.id === paidId)?.minimumDue ?? 0)}</strong>{' '}
                for <strong>{accounts.find((a) => a.id === paidId)?.name}</strong>?
              </p>
            </div>
            <div className="modal-foot">
              <Button variant="ghost" onClick={() => setPaidId(null)}>Cancel</Button>
              <Button onClick={confirmPaid}>Confirm</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
