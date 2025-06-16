
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

type BudgetData = {
  job_id: string;
  job_title: string;
  client_name: string;
  total_budget: number;
  spent: number;
  remaining: number;
  percentage_used: number;
  status: string;
};

export function JobBudgetCard() {
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    setIsLoading(true);
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          cost,
          labor_cost,
          material_cost,
          status,
          clients (name)
        `);

      if (error) throw error;

      const formattedData = (jobs || []).map((job: any) => {
        const totalBudget = job.cost || 0;
        const spent = (job.labor_cost || 0) + (job.material_cost || 0);
        const remaining = totalBudget - spent;
        const percentageUsed = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

        return {
          job_id: job.id,
          job_title: job.title,
          client_name: job.clients?.name || 'Unknown Client',
          total_budget: totalBudget,
          spent: spent,
          remaining: remaining,
          percentage_used: percentageUsed,
          status: job.status || 'scheduled'
        };
      });

      setBudgetData(formattedData);
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget per Job and Budget Remaining</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Total Budget</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgetData.map((item) => (
              <TableRow key={item.job_id}>
                <TableCell className="font-medium">{item.job_title}</TableCell>
                <TableCell>{item.client_name}</TableCell>
                <TableCell>${item.total_budget.toFixed(2)}</TableCell>
                <TableCell>${item.spent.toFixed(2)}</TableCell>
                <TableCell className={item.remaining < 0 ? 'text-red-600' : 'text-green-600'}>
                  ${item.remaining.toFixed(2)}
                </TableCell>
                <TableCell className="w-[120px]">
                  <div className="space-y-1">
                    <Progress 
                      value={Math.min(item.percentage_used, 100)} 
                      className="h-2"
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.percentage_used.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      item.status === 'completed' ? 'default' : 
                      item.remaining < 0 ? 'destructive' : 'secondary'
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
