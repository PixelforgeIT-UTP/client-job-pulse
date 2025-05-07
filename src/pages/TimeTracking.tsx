
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
import { Play, Pause, StopCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type TimeEntry = {
  id: string;
  jobName: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // in seconds
};

export default function TimeTracking() {
  const { toast } = useToast();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentJobName, setCurrentJobName] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    // Load time entries from localStorage
    const savedEntries = localStorage.getItem('timeEntries');
    if (savedEntries) {
      try {
        const parsed = JSON.parse(savedEntries);
        // Convert string dates back to Date objects
        const entries = parsed.map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : null
        }));
        setTimeEntries(entries);
      } catch (error) {
        console.error('Error parsing saved time entries:', error);
      }
    }

    // Load current timer state
    const savedTimerState = localStorage.getItem('currentTimerState');
    if (savedTimerState) {
      try {
        const { isRunning, jobName, startTime } = JSON.parse(savedTimerState);
        if (isRunning && startTime) {
          setIsTimerRunning(true);
          setCurrentJobName(jobName || '');
          startTimeRef.current = new Date(startTime);
          
          // Calculate elapsed time since the timer was started
          const now = new Date();
          const startDate = new Date(startTime);
          const elapsedSeconds = Math.floor((now.getTime() - startDate.getTime()) / 1000);
          setElapsedTime(elapsedSeconds);
          
          // Start the timer
          startTimer();
        }
      } catch (error) {
        console.error('Error parsing saved timer state:', error);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const handleStartTimer = (jobName: string) => {
    if (!jobName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a job name',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date();
    startTimeRef.current = now;
    setCurrentJobName(jobName);
    setElapsedTime(0);
    setIsTimerRunning(true);
    
    startTimer();
    
    // Save current timer state
    localStorage.setItem('currentTimerState', JSON.stringify({
      isRunning: true,
      jobName,
      startTime: now.toISOString()
    }));

    toast({
      title: 'Timer Started',
      description: `Started tracking time for "${jobName}"`,
    });
  };

  const handlePauseResumeTimer = () => {
    if (isTimerRunning) {
      // Pause the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Save paused state
      localStorage.setItem('currentTimerState', JSON.stringify({
        isRunning: false,
        jobName: currentJobName,
        startTime: startTimeRef.current?.toISOString(),
        elapsedTime
      }));
      
      toast({
        title: 'Timer Paused',
        description: `Paused tracking time for "${currentJobName}"`,
      });
    } else {
      // Resume the timer
      startTimer();
      
      // Save resumed state
      localStorage.setItem('currentTimerState', JSON.stringify({
        isRunning: true,
        jobName: currentJobName,
        startTime: startTimeRef.current?.toISOString(),
        elapsedTime
      }));
      
      toast({
        title: 'Timer Resumed',
        description: `Resumed tracking time for "${currentJobName}"`,
      });
    }
    
    setIsTimerRunning(!isTimerRunning);
  };

  const handleStopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (startTimeRef.current) {
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        jobName: currentJobName,
        startTime: startTimeRef.current,
        endTime: new Date(),
        duration: elapsedTime
      };
      
      const updatedEntries = [...timeEntries, newEntry];
      setTimeEntries(updatedEntries);
      
      // Save to localStorage
      localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
      
      // Clear current timer state
      localStorage.removeItem('currentTimerState');
    }
    
    setIsTimerRunning(false);
    setElapsedTime(0);
    startTimeRef.current = null;
    
    toast({
      title: 'Timer Stopped',
      description: `Saved time entry for "${currentJobName}"`,
    });
  };

  const formatTimeDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Time Tracking</h1>
        <p className="text-muted-foreground">Track time spent on jobs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timer</CardTitle>
          <CardDescription>Track your work time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter job name"
                  value={currentJobName}
                  onChange={(e) => setCurrentJobName(e.target.value)}
                  disabled={isTimerRunning}
                />
              </div>
              <div className="flex gap-2">
                {!isTimerRunning && !elapsedTime ? (
                  <Button
                    onClick={() => handleStartTimer(currentJobName)}
                    className="flex-1 sm:flex-none"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Timer
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handlePauseResumeTimer}
                      variant="outline"
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleStopTimer}
                      variant="destructive"
                    >
                      <StopCircle className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="text-center py-6">
              <div className="text-4xl font-mono">
                {formatTimeDisplay(elapsedTime)}
              </div>
              {startTimeRef.current && (
                <div className="text-sm text-muted-foreground mt-2">
                  Started at {format(startTimeRef.current, 'h:mm a')}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>Recent tracked time</CardDescription>
        </CardHeader>
        <CardContent>
          {timeEntries.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...timeEntries].reverse().map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.jobName}</TableCell>
                      <TableCell>{format(entry.startTime, 'MM/dd/yyyy')}</TableCell>
                      <TableCell>{format(entry.startTime, 'h:mm a')}</TableCell>
                      <TableCell>{entry.endTime ? format(entry.endTime, 'h:mm a') : 'In progress'}</TableCell>
                      <TableCell>{formatDuration(entry.duration)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No time entries recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
