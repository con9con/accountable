import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Account } from '@/types';
import { formatCurrency } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  credit_card: '#3b82f6',
  car_loan:    '#22c55e',
  personal_loan: '#a855f7',
};

interface Props {
  accounts: Account[];
}

export function DebtByAccount({ accounts }: Props) {
  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
        No data yet
      </div>
    );
  }

  const data = [...accounts]
    .sort((a, b) => b.totalDue - a.totalDue)
    .map((a) => ({
      name: a.name.length > 18 ? a.name.slice(0, 17) + '…' : a.name,
      fullName: a.name,
      value: a.totalDue,
      type: a.type,
    }));

  const chartHeight = Math.max(160, data.length * 44);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        barSize={22}
      >
        <XAxis
          type="number"
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip
          formatter={(value, _, props) => [
            formatCurrency(Number(value)),
            (props as { payload?: { fullName?: string } }).payload?.fullName ?? '',
          ]}
          contentStyle={{ borderRadius: 8, fontSize: 13 }}
          cursor={{ fill: 'oklch(0 0 0 / 5%)' }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={TYPE_COLORS[d.type]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
