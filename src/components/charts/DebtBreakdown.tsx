import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3b82f6', '#22c55e', '#a855f7'];

interface DebtBreakdownProps {
  creditCardTotal: number;
  carLoanTotal: number;
  personalLoanTotal: number;
}

export function DebtBreakdown({ creditCardTotal, carLoanTotal, personalLoanTotal }: DebtBreakdownProps) {
  const data = [
    { name: 'Credit Cards', value: creditCardTotal },
    { name: 'Car Loans', value: carLoanTotal },
    { name: 'Personal Loans', value: personalLoanTotal },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No debt to display
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
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend formatter={(value) => <span className="text-sm">{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
