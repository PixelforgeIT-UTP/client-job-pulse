import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function InvoiceStatusChart() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  async function fetchInvoiceData() {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all counts at once using filters
      const { count: paidCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('paid', true);

      const { count: unpaidCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('paid', false);

      const { count: overdueCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('paid', false)
        .lt('due_date', today);

      const pendingCount = (unpaidCount || 0) - (overdueCount || 0);
      const total = (paidCount || 0) + (unpaidCount || 0);

      if (total > 0) {
        setData([
          { name: 'Paid', value: paidCount || 0, color: '#10b981' },
          { name: 'Overdue', value: overdueCount || 0, color: '#ef4444' },
          { name: 'Pending', value: pendingCount, color: '#f59e0b' },
        ]);
      } else {
        setData([]); // No invoices
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Invoice Status</CardTitle>
        <CardDescription>
          Overview of your invoice payment status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Loading chart...</p>
          ) : data.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No invoice data found.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  dataKey="value"
                  label={renderCustomizedLabel}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
