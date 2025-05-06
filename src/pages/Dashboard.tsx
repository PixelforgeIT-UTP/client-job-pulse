
import { Briefcase, CreditCard, FileText, Users } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import RecentClientsCard from '@/components/dashboard/RecentClientsCard';
import UpcomingJobsCard from '@/components/dashboard/UpcomingJobsCard';
import InvoiceStatusChart from '@/components/dashboard/InvoiceStatusChart';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Get an overview of your business performance</p>
      </div>

      <div className="dashboard-grid">
        <StatCard
          title="Total Clients"
          value="36"
          icon={<Users size={20} />}
          trend={12}
          trendLabel="vs. last month"
        />
        <StatCard
          title="Active Jobs"
          value="18"
          icon={<Briefcase size={20} />}
          trend={5}
          trendLabel="vs. last month"
        />
        <StatCard
          title="Pending Invoices"
          value="$12,450"
          icon={<FileText size={20} />}
          description="7 invoices awaiting payment"
        />
        <StatCard
          title="Revenue (MTD)"
          value="$24,780"
          icon={<CreditCard size={20} />}
          trend={8}
          trendLabel="vs. last month"
        />
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
