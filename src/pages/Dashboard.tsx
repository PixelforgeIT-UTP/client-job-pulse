
import { useEffect, useState } from 'react';
import { Calendar, Users, Briefcase, DollarSign } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import RecentClientsCard from '@/components/dashboard/RecentClientsCard';
import UpcomingJobsCard from '@/components/dashboard/UpcomingJobsCard';
import InvoiceStatusChart from '@/components/dashboard/InvoiceStatusChart';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalJobs: 0,
    expectedRevenue: 0,
    completedJobs: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      // Fetch total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact' });

      // Fetch total jobs
      const { count: jobCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact' });

      // Fetch completed jobs
      const { count: completedCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('status', 'completed');

      // Calculate expected revenue from labor and material costs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('labor_cost, material_cost, cost')
        .neq('status', 'cancelled');

      let expectedRevenue = 0;
      if (jobsData) {
        expectedRevenue = jobsData.reduce((total, job) => {
          const laborCost = job.labor_cost || 0;
          const materialCost = job.material_cost || 0;
          const serviceCost = job.cost || 0;
          return total + laborCost + materialCost + serviceCost;
        }, 0);
      }

      setStats({
        totalClients: clientCount || 0,
        totalJobs: jobCount || 0,
        expectedRevenue: Math.round(expectedRevenue),
        completedJobs: completedCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your business.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={stats.totalClients.toString()}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          linkTo="/clients"
        />
        <StatCard
          title="Active Jobs"
          value={stats.totalJobs.toString()}
          icon={<Briefcase className="h-6 w-6 text-green-600" />}
          linkTo="/jobs"
        />
        <StatCard
          title="Expected Revenue"
          value={`$${stats.expectedRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6 text-purple-600" />}
          description="Labor + Materials + Services"
        />
        <StatCard
          title="Completed Jobs"
          value={stats.completedJobs.toString()}
          icon={<Calendar className="h-6 w-6 text-amber-600" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RecentClientsCard />
        <UpcomingJobsCard />
      </div>

      <InvoiceStatusChart />
    </div>
  );
}
