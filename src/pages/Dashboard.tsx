
import { Briefcase, CreditCard, FileText, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StatCard from '@/components/dashboard/StatCard';
import RecentClientsCard from '@/components/dashboard/RecentClientsCard';
import UpcomingJobsCard from '@/components/dashboard/UpcomingJobsCard';
import InvoiceStatusChart from '@/components/dashboard/InvoiceStatusChart';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: '0',
    activeJobs: '0',
    pendingInvoices: '0',
    revenueMonth: '0',
    pendingInvoicesCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    setIsLoading(true);
    try {
      // Fetch total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Fetch active jobs
      const { count: activeJobsCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['scheduled', 'in_progress']);

      // Fetch pending invoices
      const { data: pendingInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('paid', false);

      // Calculate total pending invoice amount
      const pendingAmount = pendingInvoices?.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0) || 0;

      // Fetch paid invoices for current month (revenue)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: paidInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('paid', true)
        .gte('created_at', startOfMonth.toISOString());

      const monthlyRevenue = paidInvoices?.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0) || 0;

      setStats({
        totalClients: clientCount?.toString() || '0',
        activeJobs: activeJobsCount?.toString() || '0',
        pendingInvoices: `$${pendingAmount.toLocaleString()}`,
        revenueMonth: `$${monthlyRevenue.toLocaleString()}`,
        pendingInvoicesCount: pendingInvoices?.length || 0
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Get an overview of your business performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/clients" className="block no-underline">
          <StatCard
            title="Total Clients"
            value={isLoading ? "Loading..." : stats.totalClients}
            icon={<Users size={20} />}
            trend={12}
            trendLabel="vs. last month"
            linkTo="/clients"
          />
        </Link>
        <Link to="/jobs" className="block no-underline">
          <StatCard
            title="Active Jobs"
            value={isLoading ? "Loading..." : stats.activeJobs}
            icon={<Briefcase size={20} />}
            trend={5}
            trendLabel="vs. last month"
            linkTo="/jobs"
          />
        </Link>
        <Link to="/invoices" className="block no-underline">
          <StatCard
            title="Pending Invoices"
            value={isLoading ? "Loading..." : stats.pendingInvoices}
            icon={<FileText size={20} />}
            description={`${stats.pendingInvoicesCount} invoices awaiting payment`}
            linkTo="/invoices"
          />
        </Link>
        <Link to="/payments" className="block no-underline">
          <StatCard
            title="Revenue (MTD)"
            value={isLoading ? "Loading..." : stats.revenueMonth}
            icon={<CreditCard size={20} />}
            trend={8}
            trendLabel="vs. last month"
            linkTo="/payments"
          />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingJobsCard />
        <RecentClientsCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <InvoiceStatusChart />
      </div>
    </div>
  );
}
