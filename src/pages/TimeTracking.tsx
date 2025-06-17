
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Square, Clock } from 'lucide-react';
import { JobSelector } from '@/components/time-tracking/JobSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface TimeEntry {
  id: string;
  job_title: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  notes?: string;
  is_active: boolean;
}

export default function TimeTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState('');
  const [notes, setNotes] = useState('');
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTimeEntries();
      checkActiveEntry();
    }
  }, [user]);

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          jobs (title)
        `)
        .eq('user_id', user?.id)
        .order('start_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      const entriesWithJobTitles = (data || []).map((entry: any) => ({
        id: entry.id,
        job_title: entry.jobs?.title || 'Unknown Job',
        start_time: entry.start_time,
        end_time: entry.end_time,
        duration: entry.duration,
        notes: entry.notes,
        is_active: !entry.end_time
      }));

      setTimeEntries(entriesWithJobTitles);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const checkActiveEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          jobs (title)
        `)
        .eq('user_id', user?.id)
        .is('end_time', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setActiveEntry({
          id: data.id,
          job_title: data.jobs?.title || 'Unknown Job',
          start_time: data.start_time,
          notes: data.notes,
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error checking active entry:', error);
    }
  };

  const startTimer = async () => {
    if (!selectedJobId) {
      toast({
        title: "No job selected",
        description: "Please select a job before starting the timer",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          job_id: selectedJobId,
          user_id: user?.id,
          start_time: new Date().toISOString(),
          notes: notes || null
        })
        .select(`
          *,
          jobs (title)
        `)
        .single();

      if (error) throw error;

      setActiveEntry({
        id: data.id,
        job_title: data.jobs?.title || 'Unknown Job',
        start_time: data.start_time,
        notes: data.notes,
        is_active: true
      });

      setNotes('');
      setSelectedJobId('');

      toast({
        title: "Timer started",
        description: "Time tracking has begun for the selected job",
      });

      fetchTimeEntries();
    } catch (error: any) {
      toast({
        title: "Error starting timer",
        description: error.message || "Failed to start time tracking",
        variant: "destructive",
      });
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;

    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(activeEntry.start_time);
      const duration = Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60); // duration in minutes

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime,
          duration: duration
        })
        .eq('id', activeEntry.id);

      if (error) throw error;

      setActiveEntry(null);

      toast({
        title: "Timer stopped",
        description: `Tracked ${duration} minutes for this job`,
      });

      fetchTimeEntries();
    } catch (error: any) {
      toast({
        title: "Error stopping timer",
        description: error.message || "Failed to stop time tracking",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCurrentDuration = () => {
    if (!activeEntry) return '0h 0m';
    const startTime = new Date(activeEntry.start_time);
    const duration = Math.round((currentTime.getTime() - startTime.getTime()) / 1000 / 60);
    return formatDuration(duration);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Time Tracking</h1>
        <p className="text-muted-foreground">Track time spent on jobs and tasks.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeEntry ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-800">{activeEntry.job_title}</p>
                      <p className="text-sm text-green-600">
                        Started: {new Date(activeEntry.start_time).toLocaleTimeString()}
                      </p>
                      {activeEntry.notes && (
                        <p className="text-sm text-green-600 mt-1">{activeEntry.notes}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {getCurrentDuration()}
                    </Badge>
                  </div>
                </div>
                <Button onClick={stopTimer} className="w-full" variant="destructive">
                  <Square className="mr-2 h-4 w-4" />
                  Stop Timer
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="job">Select Job</Label>
                  <JobSelector
                    value={selectedJobId}
                    onValueChange={setSelectedJobId}
                    placeholder="Choose an active job"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this time entry..."
                    rows={3}
                  />
                </div>
                <Button onClick={startTimer} className="w-full" disabled={!selectedJobId}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Timer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No time entries found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.job_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.start_time).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.duration ? formatDuration(entry.duration) : getCurrentDuration()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.is_active ? "default" : "secondary"}>
                          {entry.is_active ? "Active" : "Completed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
