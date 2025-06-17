
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, DollarSign, Camera, FileText, Quote, TrendingUp, Users } from 'lucide-react';
import { HourTrackingCard } from '@/components/admin/HourTrackingCard';
import { JobBudgetCard } from '@/components/admin/JobBudgetCard';
import { PendingPhotosCard } from '@/components/admin/PendingPhotosCard';
import { JobNotesCard } from '@/components/admin/JobNotesCard';
import { PendingQuotesCard } from '@/components/admin/PendingQuotesCard';
import { JobMetricsCard } from '@/components/admin/JobMetricsCard';
import { UserManagementCard } from '@/components/admin/UserManagementCard';

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleMetricCardClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of all jobs, employees, and business metrics.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMetricCardClick('hours')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <JobMetricsCard type="active-jobs" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMetricCardClick('budget')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <JobMetricsCard type="total-revenue" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMetricCardClick('hours')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Job Duration</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <JobMetricsCard type="avg-duration" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMetricCardClick('photos')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Photos</CardTitle>
                <Camera className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <JobMetricsCard type="pending-photos" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMetricCardClick('quotes')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                <Quote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <JobMetricsCard type="pending-quotes" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMetricCardClick('hours')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <JobMetricsCard type="total-hours" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hours">
          <HourTrackingCard />
        </TabsContent>

        <TabsContent value="budget">
          <JobBudgetCard />
        </TabsContent>

        <TabsContent value="photos">
          <PendingPhotosCard />
        </TabsContent>

        <TabsContent value="notes">
          <JobNotesCard />
        </TabsContent>

        <TabsContent value="quotes">
          <PendingQuotesCard />
        </TabsContent>

        <TabsContent value="users">
          <UserManagementCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
