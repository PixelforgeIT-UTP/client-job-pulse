
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

type HourData = {
  job_id: string;
  job_title: string;
  client_name: string;
  employee_name: string;
  total_hours: number;
  status: string;
};

export function HourTrackingCard() {
  const [hourData, setHourData] = useState<HourData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHourData();
  }, []);

  const fetchHourData = async () => {
    setIsLoading(true);
    try {
      // This would need to be implemented with proper time tracking data
      // For now, we'll simulate with job duration data
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          duration,
          status,
          assigned_to,
          clients (name)
        `);

      if (error) throw error;

      const formattedData = await Promise.all(
        (jobs || []).map(async (job: any) => {
          let employeeName = 'Unassigned';
          if (job.assigned_to) {
            try {
              const { data: profile } = await supabase
                .rpc('get_user_profile', { user_id: job.assigned_to });
              employeeName = profile?.[0]?.full_name || 'Unknown Employee';
            } catch (error) {
              console.error('Error fetching employee profile:', error);
            }
          }

          return {
            job_id: job.id,
            job_title: job.title,
            client_name: job.clients?.name || 'Unknown Client',
            employee_name: employeeName,
            total_hours: job.duration || 0,
            status: job.status || 'scheduled'
          };
        })
      );

      setHourData(formattedData);
    } catch (error) {
      console.error('Error fetching hour data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hour Tracking</CardTitle>
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
        <CardTitle>Hour Count per Job per Employee</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hourData.map((item) => (
              <TableRow key={item.job_id}>
                <TableCell className="font-medium">{item.job_title}</TableCell>
                <TableCell>{item.client_name}</TableCell>
                <TableCell>{item.employee_name}</TableCell>
                <TableCell>{item.total_hours}h</TableCell>
                <TableCell>
                  <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
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
