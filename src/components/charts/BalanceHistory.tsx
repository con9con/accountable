import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { Account } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Props {
  accounts: Account[];
}

interface DataPoint {
  date: string;
  total: number;
}

function aggregateHistory(accounts: Account[]): DataPoint[] {
  const allDates = new Set<string>();
  accounts.forEach((a) => {
    (a.balanceHistory ?? []).forEach((e) => allDates.add(e.date));
  });

  if (allDates.size === 0) return [];

  const sortedDates = Array.from(allDates).sort();

  return sortedDates.map((date) => {
    const total = accounts.reduce((sum, a) => {
      const history = a.balanceHistory ?? [];
      const entry = [...history]
        .filter((e) => e.date <= date)
        .sort((x, y) => y.date.localeCompare(x.date))[0];
      return sum + (entry ? entry.balance : (a.originalBalance ?? a.totalDue));
    }, 0);
    return { date, total };
  });
}

export function BalanceHistory({ accounts }: Props) {
  const data = aggregateHistory(accounts);

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Not enough history yet — record payments to track progress over time.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 6%)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const [, m, d] = v.split('-');
            return `${m}/${d}`;
          }}
        />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), 'Total Debt']}
          labelFormatter={(label) => typeof label === 'string' ? formatDate(label) : String(label)}
          contentStyle={{ borderRadius: 8, fontSize: 13 }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#totalGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#6366f1' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
