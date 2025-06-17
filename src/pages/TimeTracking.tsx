
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
      // For now, return empty array since time_entries table might not exist yet
      console.log('Time entries functionality will be available once the table is created');
      setTimeEntries([]);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const checkActiveEntry = async () => {
    try {
      // For now, no active entry since time_entries table might not exist yet
      console.log('Active entry check will be available once the table is created');
      setActiveEntry(null);
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
      // For now, just simulate starting the timer
      console.log(`Would start timer for job ${selectedJobId}`);
      
      toast({
        title: "Info",
        description: "Time tracking functionality will be available once the database table is created",
      });

      setNotes('');
      setSelectedJobId('');
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
      console.log('Would stop timer');
      setActiveEntry(null);

      toast({
        title: "Timer stopped",
        description: "Timer functionality will be available once the database is set up",
      });
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
            <div className="text-center py-8 text-muted-foreground">
              Time tracking functionality will be available once the database is properly set up
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
