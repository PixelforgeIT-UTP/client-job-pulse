
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function InvoiceStatusChart() {
  const [data, setData] = useState([
    { name: 'Paid', value: 65, color: '#10b981' },
    { name: 'Overdue', value: 10, color: '#ef4444' },
    { name: 'Pending', value: 25, color: '#f59e0b' },
  ]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  async function fetchInvoiceData() {
    setIsLoading(true);
    try {
      // Fetch paid invoices count
      const { count: paidCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('paid', true);

      // Fetch unpaid invoices count
      const { count: unpaidCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('paid', false);

      // Get current date
      const currentDate = new Date();
      
      // Fetch overdue invoices (unpaid and past due date)
      const { count: overdueCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('paid', false)
        .lt('due_date', currentDate.toISOString().split('T')[0]);

      // Calculate pending (unpaid but not overdue)
      const pendingCount = (unpaidCount || 0) - (overdueCount || 0);

      // If we have data, update the chart
      if (paidCount !== null || unpaidCount !== null) {
        const total = (paidCount || 0) + (unpaidCount || 0);
        
        if (total > 0) {
          setData([
            { name: 'Paid', value: Math.round((paidCount || 0) / total * 100), color: '#10b981' },
            { name: 'Overdue', value: Math.round((overdueCount || 0) / total * 100), color: '#ef4444' },
            { name: 'Pending', value: Math.round(pendingCount / total * 100), color: '#f59e0b' },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show the percentage if it's large enough (to prevent overlap)
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
                label={renderCustomizedLabel}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
