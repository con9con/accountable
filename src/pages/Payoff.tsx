import { useState, useMemo } from 'react';
import { useAccountStore } from '@/store/useAccountStore';
import { Card, CardHead, CardBody, Icon, LineChart } from '@/components/ui/ds';
import { ACCOUNT_TYPE_COLORS } from '@/types';
import { formatCurrency, formatCurrencyShort, fmtMonths, calculatePayoff } from '@/lib/utils';

export function Payoff() {
  const accounts = useAccountStore((s) => s.accounts);

  const [extra, setExtra] = useState(0);
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [showTable, setShowTable] = useState(false);

  const totalMin = accounts.reduce((s, a) => s + a.minimumDue, 0);

  const result = useMemo(
    () => calculatePayoff(accounts, extra, strategy),
    [accounts, extra, strategy]
  );

  const resultAlt = useMemo(
    () => calculatePayoff(accounts, extra, strategy === 'avalanche' ? 'snowball' : 'avalanche'),
    [accounts, extra, strategy]
  );

  const baseResult = useMemo(
    () => calculatePayoff(accounts, 0, strategy),
    [accounts, strategy]
  );

  const monthsSaved = baseResult && result ? Math.max(0, baseResult.totalMonths - result.totalMonths) : 0;
  const interestSaved = baseResult && result ? Math.max(0, baseResult.totalInterest - result.totalInterest) : 0;

  // Chart data
  const chartData = useMemo(() => {
    if (!result) return [];
    const step = Math.max(1, Math.floor(result.monthly.length / 24));
    return result.monthly
      .filter((_, i) => i % step === 0 || i === result.monthly.length - 1)
      .map((m) => {
        const d = new Date();
        d.setMonth(d.getMonth() + m.month);
        return {
          label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          value: m.balance,
        };
      });
  }, [result]);

  const chartDataAlt = useMemo(() => {
    if (!resultAlt) return [];
    const step = Math.max(1, Math.floor(resultAlt.monthly.length / 24));
    return resultAlt.monthly
      .filter((_, i) => i % step === 0 || i === resultAlt.monthly.length - 1)
      .map((m) => {
        const d = new Date();
        d.setMonth(d.getMonth() + m.month);
        return {
          label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          value: m.balance,
        };
      });
  }, [resultAlt]);

  if (accounts.length === 0) {
    return (
      <div style={{ padding: '48px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <Icon name="calc" size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No accounts to plan</h2>
        <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
          Add accounts on the Accounts page to see your payoff plan.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>Payoff Plan</h1>
        <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>
          {formatCurrency(totalMin)}/mo minimum · See how extra payments accelerate your payoff
        </div>
      </div>

      {/* Extra payment + strategy */}
      <Card>
        <CardHead>Strategy & Extra Payment</CardHead>
        <CardBody>
          {/* Strategy tabs */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8, fontWeight: 500 }}>Strategy</div>
            <div className="ds-tabs">
              <button
                className={strategy === 'avalanche' ? 'active' : ''}
                onClick={() => setStrategy('avalanche')}
              >
                Avalanche (Highest APR)
              </button>
              <button
                className={strategy === 'snowball' ? 'active' : ''}
                onClick={() => setStrategy('snowball')}
              >
                Snowball (Lowest Balance)
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 8 }}>
              {strategy === 'avalanche'
                ? 'Pays off highest-interest debt first — saves the most in interest.'
                : 'Pays off smallest balance first — builds momentum with quick wins.'}
            </div>
          </div>

          {/* Extra payment slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Extra Monthly Payment</span>
              <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                +{formatCurrencyShort(extra)}/mo
              </span>
            </div>
            <input
              type="range"
              className="range"
              min={0}
              max={2000}
              step={25}
              value={extra}
              onChange={(e) => setExtra(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>
              <span>$0</span>
              <span>$1,000</span>
              <span>$2,000</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {result && (
        <>
          {/* Outcome hero */}
          <div
            style={{
              background: 'var(--accent)',
              borderRadius: 'var(--r-lg)',
              padding: '24px 28px',
              color: '#fff',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: 6 }}>
                Debt-Free Date
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {result.debtFreeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                {fmtMonths(result.totalMonths)} from now
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: 6 }}>
                Total Interest
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {formatCurrencyShort(result.totalInterest)}
              </div>
            </div>
            {extra > 0 && monthsSaved > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: 6 }}>
                  Months Saved
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#86efac' }}>
                  {monthsSaved}mo
                </div>
              </div>
            )}
            {extra > 0 && interestSaved > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: 6 }}>
                  Interest Saved
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#86efac' }}>
                  {formatCurrencyShort(interestSaved)}
                </div>
              </div>
            )}
          </div>

          {/* Projection chart */}
          {chartData.length >= 2 && (
            <Card>
              <CardHead>Balance Projection</CardHead>
              <CardBody>
                <LineChart
                  data={chartData}
                  height={160}
                  secondData={chartDataAlt.length >= 2 ? chartDataAlt : undefined}
                  secondColor="var(--positive)"
                />
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'var(--ink-3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 16, height: 2, background: 'var(--accent)', display: 'inline-block', borderRadius: 1 }} />
                    {strategy === 'avalanche' ? 'Avalanche' : 'Snowball'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 16, height: 2, background: 'var(--positive)', display: 'inline-block', borderRadius: 1, opacity: 0.7 }} />
                    {strategy === 'avalanche' ? 'Snowball' : 'Avalanche'}
                  </span>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Payoff order */}
          <Card>
            <CardHead>Payoff Order</CardHead>
            <CardBody style={{ padding: 0 }}>
              <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Account</th>
                    <th className="hide-sm">Balance</th>
                    <th className="hide-sm">Interest Paid</th>
                    <th style={{ textAlign: 'right' }}>Paid Off</th>
                  </tr>
                </thead>
                <tbody>
                  {result.accounts.map((r) => {
                    const acct = accounts.find((a) => a.id === r.id);
                    if (!acct) return null;
                    const color = ACCOUNT_TYPE_COLORS[acct.type] || 'var(--ink-4)';
                    const payoffDate = new Date();
                    payoffDate.setMonth(payoffDate.getMonth() + r.months);
                    return (
                      <tr key={r.id}>
                        <td style={{ color: 'var(--ink-4)', fontWeight: 700, fontSize: 13 }}>#{r.order}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 3, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{acct.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{acct.interestRate}% APR</div>
                            </div>
                            {r.order === 1 && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 6px',
                                background: 'var(--accent)', color: '#fff',
                                borderRadius: 4, letterSpacing: '0.04em',
                              }}>
                                FOCUS
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="hide-sm" style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                          {formatCurrency(acct.totalDue)}
                        </td>
                        <td className="hide-sm" style={{ color: 'var(--danger)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrencyShort(r.interestPaid)}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>
                          <div style={{ fontWeight: 500 }}>
                            {payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ color: 'var(--ink-4)', fontSize: 11 }}>{fmtMonths(r.months)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </CardBody>
          </Card>

          {/* Month-by-month table */}
          <Card>
            <CardHead
              action={
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowTable((v) => !v)}
                  style={{ fontSize: 12 }}
                >
                  {showTable ? 'Hide' : 'Show'} details
                  <Icon name={showTable ? 'chevronUp' : 'chevronDown'} size={12} />
                </button>
              }
            >
              Month-by-Month Breakdown
            </CardHead>

            {showTable && (
              <CardBody style={{ padding: 0 }}>
                <div className="tbl-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead style={{ position: 'sticky', top: 0 }}>
                      <tr>
                        <th>Month</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Remaining</th>
                        <th style={{ textAlign: 'right' }} className="hide-sm">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.monthly.map((m, i) => {
                        const d = new Date();
                        d.setMonth(d.getMonth() + m.month);
                        const prev = i > 0 ? result.monthly[i - 1].balance : accounts.reduce((s, a) => s + a.totalDue, 0);
                        const change = m.balance - prev;
                        return (
                          <tr key={m.month}>
                            <td style={{ color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                              {m.month}
                            </td>
                            <td style={{ fontSize: 13 }}>
                              {d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                              {formatCurrency(m.balance)}
                            </td>
                            <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--positive)', fontVariantNumeric: 'tabular-nums' }} className="hide-sm">
                              {change < 0 ? `−${formatCurrencyShort(Math.abs(change))}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
