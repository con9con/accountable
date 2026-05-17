import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountStore } from '@/store/useAccountStore';
import { useActions } from '@/hooks/useActions';
import { Card, CardHead, CardBody, Icon, Button, Ring, Sparkline, LineChart } from '@/components/ui/ds';
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

  const totalDebt = accounts.reduce((s, a) => s + a.totalDue, 0);
  const totalMin = accounts.reduce((s, a) => s + a.minimumDue, 0);
  const totalOriginal = accounts.reduce((s, a) => s + (a.originalBalance ?? a.totalDue), 0);
  const totalPaidDown = totalOriginal - totalDebt;
  const avgAPR = accounts.length ? accounts.reduce((s, a) => s + a.interestRate, 0) / accounts.length : 0;

  // Next due account
  const withDue = accounts
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
  accounts.forEach((a) => (a.balanceHistory ?? []).forEach((e) => allDates.add(e.date)));
  const sortedDates = Array.from(allDates).sort();
  const historyData = sortedDates.map((date) => {
    const total = accounts.reduce((sum, a) => {
      const history = a.balanceHistory ?? [];
      const entry = [...history].filter((e) => e.date <= date).sort((x, y) => y.date.localeCompare(x.date))[0];
      return sum + (entry ? entry.balance : a.totalDue);
    }, 0);
    return { label: formatDateShort(date), value: total };
  });

  // Payoff projection (avalanche, no extra)
  const payoffResult = calculatePayoff(accounts, 0, 'avalanche');
  const pctPaid = totalOriginal > 0 ? totalPaidDown / totalOriginal : 0;

  // Recent payments
  const recentPayments = [...payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // Debt by type
  const byType = ACCOUNT_TYPES.map((t) => ({
    ...t,
    total: accounts.filter((a) => a.type === t.key).reduce((s, a) => s + a.totalDue, 0),
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

  if (accounts.length === 0) {
    return (
      <div style={{ padding: '48px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Welcome to Accountable</h2>
        <p style={{ color: 'var(--ink-3)', marginBottom: 28, lineHeight: 1.6 }}>
          Track your debts, plan your payoff, and stay motivated. Add your first account to get started.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button onClick={() => navigate('/accounts')}>Add Account</Button>
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
            Total Debt — {accounts.length} account{accounts.length !== 1 ? 's' : ''}
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
          <Button size="sm" onClick={() => navigate('/accounts')}>
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
              <CardBody style={{ padding: 0 }}>
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
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Recent payments */}
          {recentPayments.length > 0 && (
            <Card>
              <CardHead
                action={
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/accounts')}
                    style={{ fontSize: 12 }}
                  >
                    View all
                  </button>
                }
              >
                Recent Payments
              </CardHead>
              <CardBody style={{ padding: 0 }}>
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
              </CardBody>
            </Card>
          )}
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
                {[...accounts].sort((a, b) => b.totalDue - a.totalDue).map((a) => {
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
