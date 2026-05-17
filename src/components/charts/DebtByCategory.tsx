import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

const SLICES = [
  { key: 'creditCards', label: 'Credit Cards', color: '#3b82f6' },
  { key: 'carLoans',    label: 'Car Loans',    color: '#22c55e' },
  { key: 'personal',   label: 'Personal Loans', color: '#a855f7' },
];

interface Props {
  creditCards: number;
  carLoans: number;
  personal: number;
}

export function DebtByCategory({ creditCards, carLoans, personal }: Props) {
  const data = [
    { ...SLICES[0], value: creditCards },
    { ...SLICES[1], value: carLoans },
    { ...SLICES[2], value: personal },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={3}
          dataKey="value"
          nameKey="label"
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), '']}
          contentStyle={{ borderRadius: 8, fontSize: 13 }}
        />
        <Legend
          formatter={(value) => <span className="text-sm">{value}</span>}
          iconType="circle"
          iconSize={10}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
