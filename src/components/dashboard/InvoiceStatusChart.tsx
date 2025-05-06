
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Mock data for invoice statuses
const data = [
  { name: 'Paid', value: 65, color: '#10b981' },
  { name: 'Overdue', value: 10, color: '#ef4444' },
  { name: 'Pending', value: 25, color: '#f59e0b' },
];

export default function InvoiceStatusChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Invoice Status</CardTitle>
        <CardDescription>
          Overview of your invoice payment status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
