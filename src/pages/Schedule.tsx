
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function Schedule() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isStartJobDialogOpen, setIsStartJobDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchJobs();
  }, [date]);

  async function fetchJobs() {
    setIsLoading(true);
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          clients (name, phone)
        `)
        .gte('scheduled_at', startOfDay.toISOString())
        .lt('scheduled_at', endOfDay.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function startJob(jobId: string) {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', jobId);

      if (error) throw error;
      
      toast({
        title: 'Job started',
        description: 'Job has been marked as in progress',
      });
      
      fetchJobs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsStartJobDialogOpen(false);
  }

  async function rescheduleJob(jobId: string, newDate: Date) {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          scheduled_at: newDate.toISOString(),
          status: 'scheduled'
        })
        .eq('id', jobId);

      if (error) throw error;
      
      toast({
        title: 'Job rescheduled',
        description: `Job has been rescheduled to ${format(newDate, 'PPP')}`,
      });
      
      fetchJobs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsRescheduleDialogOpen(false);
  }

  function formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch (e) {
      return '--:--';
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 hover:bg-red-600">Cancelled</Badge>;
      case 'scheduled':
      default:
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Scheduled</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground">View and manage your daily job schedule</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view scheduled jobs</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{format(date, 'PPPP')}</CardTitle>
            <CardDescription>Jobs scheduled for this day</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : jobs.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden md:table-cell">Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{formatTime(job.scheduled_at)}</TableCell>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.clients?.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{job.location || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {job.status === 'scheduled' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedJobId(job.id);
                                  setIsStartJobDialogOpen(true);
                                }}
                              >
                                Start Job
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedJobId(job.id);
                                  setRescheduleDate(new Date(job.scheduled_at));
                                  setIsRescheduleDialogOpen(true);
                                }}
                              >
                                Reschedule
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No jobs scheduled for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Start job dialog */}
      <AlertDialog open={isStartJobDialogOpen} onOpenChange={setIsStartJobDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to start this job? The status will be changed to "In Progress".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedJobId && startJob(selectedJobId)}>
              Start Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule job dialog */}
      <AlertDialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule Job</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new date for this job.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Calendar
              mode="single"
              selected={rescheduleDate}
              onSelect={setRescheduleDate}
              initialFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedJobId && rescheduleDate && rescheduleJob(selectedJobId, rescheduleDate)}
            >
              Reschedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
