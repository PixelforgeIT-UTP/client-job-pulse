
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface Job {
  id: string;
  title: string;
  client_name: string;
  status: string;
}

interface JobSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function JobSelector({ value, onValueChange, placeholder = "Select a job" }: JobSelectorProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveJobs();
  }, []);

  const fetchActiveJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          status,
          clients (name)
        `)
        .in('status', ['scheduled', 'in_progress', 'active'])
        .order('title');

      if (error) throw error;

      const jobsWithClientNames = (data || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        client_name: job.clients?.name || 'Unknown Client',
        status: job.status
      }));

      setJobs(jobsWithClientNames);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading jobs..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {jobs.map((job) => (
          <SelectItem key={job.id} value={job.id}>
            {job.title} - {job.client_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
