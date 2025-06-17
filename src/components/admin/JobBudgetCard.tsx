
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Save, X } from 'lucide-react';

type BudgetData = {
  job_id: string;
  job_title: string;
  client_name: string;
  total_budget: number;
  spent: number;
  remaining: number;
  percentage_used: number;
  status: string;
  labor_cost: number;
  material_cost: number;
};

export function JobBudgetCard() {
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    total_budget: number;
    labor_cost: number;
    material_cost: number;
  }>({ total_budget: 0, labor_cost: 0, material_cost: 0 });
  const { toast } = useToast();

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
        const laborCost = job.labor_cost || 0;
        const materialCost = job.material_cost || 0;
        const spent = laborCost + materialCost;
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
          status: job.status || 'scheduled',
          labor_cost: laborCost,
          material_cost: materialCost
        };
      });

      setBudgetData(formattedData);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch budget data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (job: BudgetData) => {
    setEditingJob(job.job_id);
    setEditValues({
      total_budget: job.total_budget,
      labor_cost: job.labor_cost,
      material_cost: job.material_cost
    });
  };

  const cancelEditing = () => {
    setEditingJob(null);
    setEditValues({ total_budget: 0, labor_cost: 0, material_cost: 0 });
  };

  const saveChanges = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          cost: editValues.total_budget,
          labor_cost: editValues.labor_cost,
          material_cost: editValues.material_cost
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Budget updated successfully",
      });

      setEditingJob(null);
      fetchBudgetData(); // Refresh data
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive",
      });
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
              <TableHead>Labor Cost</TableHead>
              <TableHead>Material Cost</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgetData.map((item) => (
              <TableRow key={item.job_id}>
                <TableCell className="font-medium">{item.job_title}</TableCell>
                <TableCell>{item.client_name}</TableCell>
                <TableCell>
                  {editingJob === item.job_id ? (
                    <Input
                      type="number"
                      value={editValues.total_budget}
                      onChange={(e) => setEditValues(prev => ({ ...prev, total_budget: parseFloat(e.target.value) || 0 }))}
                      className="w-24"
                    />
                  ) : (
                    `$${item.total_budget.toFixed(2)}`
                  )}
                </TableCell>
                <TableCell>
                  {editingJob === item.job_id ? (
                    <Input
                      type="number"
                      value={editValues.labor_cost}
                      onChange={(e) => setEditValues(prev => ({ ...prev, labor_cost: parseFloat(e.target.value) || 0 }))}
                      className="w-24"
                    />
                  ) : (
                    `$${item.labor_cost.toFixed(2)}`
                  )}
                </TableCell>
                <TableCell>
                  {editingJob === item.job_id ? (
                    <Input
                      type="number"
                      value={editValues.material_cost}
                      onChange={(e) => setEditValues(prev => ({ ...prev, material_cost: parseFloat(e.target.value) || 0 }))}
                      className="w-24"
                    />
                  ) : (
                    `$${item.material_cost.toFixed(2)}`
                  )}
                </TableCell>
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
                <TableCell>
                  {editingJob === item.job_id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => saveChanges(item.job_id)}
                        className="h-6 w-6 p-0"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(item)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
