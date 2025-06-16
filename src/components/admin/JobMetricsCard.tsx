
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type MetricType = 'active-jobs' | 'total-revenue' | 'avg-duration' | 'pending-photos' | 'pending-quotes' | 'total-hours';

interface JobMetricsCardProps {
  type: MetricType;
}

export function JobMetricsCard({ type }: JobMetricsCardProps) {
  const [value, setValue] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetric();
  }, [type]);

  const fetchMetric = async () => {
    setIsLoading(true);
    try {
      switch (type) {
        case 'active-jobs':
          const { data: activeJobs } = await supabase
            .from('jobs')
            .select('id')
            .neq('status', 'completed');
          setValue((activeJobs?.length || 0).toString());
          break;

        case 'total-revenue':
          const { data: completedJobs } = await supabase
            .from('jobs')
            .select('cost')
            .eq('status', 'completed');
          const totalRevenue = completedJobs?.reduce((sum, job) => sum + (job.cost || 0), 0) || 0;
          setValue(`$${totalRevenue.toFixed(2)}`);
          break;

        case 'avg-duration':
          const { data: jobsWithDuration } = await supabase
            .from('jobs')
            .select('duration')
            .not('duration', 'is', null);
          const avgDuration = jobsWithDuration?.length 
            ? jobsWithDuration.reduce((sum, job) => sum + job.duration, 0) / jobsWithDuration.length 
            : 0;
          setValue(`${avgDuration.toFixed(1)}h`);
          break;

        case 'pending-photos':
          const { data: pendingPhotos } = await (supabase as any)
            .from('photo_approval_requests')
            .select('id')
            .eq('status', 'pending');
          setValue((pendingPhotos?.length || 0).toString());
          break;

        case 'pending-quotes':
          const { data: pendingQuotes } = await supabase
            .from('quotes')
            .select('id')
            .eq('status', 'pending');
          setValue((pendingQuotes?.length || 0).toString());
          break;

        case 'total-hours':
          const { data: allJobs } = await supabase
            .from('jobs')
            .select('duration');
          const totalHours = allJobs?.reduce((sum, job) => sum + (job.duration || 0), 0) || 0;
          setValue(`${totalHours}h`);
          break;

        default:
          setValue('N/A');
      }
    } catch (error) {
      console.error('Error fetching metric:', error);
      setValue('Error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-2xl font-bold">...</div>;
  }

  return <div className="text-2xl font-bold">{value}</div>;
}
