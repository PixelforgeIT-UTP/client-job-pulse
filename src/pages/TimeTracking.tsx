
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Plus, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock time tracking data
const timeEntries = [
  { 
    id: 1, 
    job: "Kitchen Renovation",
    client: "Acme Corp", 
    date: "June 4, 2025", 
    startTime: "9:00 AM", 
    endTime: "12:00 PM",
    duration: "3h 0m",
    status: "completed"
  },
  { 
    id: 2, 
    job: "Electrical Inspection",
    client: "Globex Industries", 
    date: "June 4, 2025", 
    startTime: "1:30 PM", 
    endTime: "3:00 PM",
    duration: "1h 30m",
    status: "completed"
  },
  { 
    id: 3, 
    job: "Plumbing Repair",
    client: "Wayne Enterprises", 
    date: "June 4, 2025", 
    startTime: "4:00 PM", 
    endTime: null,
    duration: "0h 45m",
    status: "in-progress"
  }
];

export default function TimeTracking() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('daily');
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerEntries, setTimerEntries] = useState(timeEntries);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(remainingSeconds).padStart(2, '0')
    ].join(':');
  };

  const toggleTimer = (id: number) => {
    // If there's an active timer and it's different from the one we're clicking
    if (activeTimer !== null && activeTimer !== id) {
      stopTimer();
    }
    
    // If we're clicking the currently active timer, stop it
    if (activeTimer === id) {
      stopTimer();
    } else {
      // Start the timer for this entry
      startTimer(id);
    }
  };

  const startTimer = (id: number) => {
    // Stop any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Set active timer ID
    setActiveTimer(id);
    
    // Get the entry
    const entry = timerEntries.find(e => e.id === id);
    if (!entry) return;
    
    // Calculate initial elapsed time from the entry's duration
    let initialSeconds = 0;
    if (entry.duration) {
      const durationMatch = entry.duration.match(/(\d+)h\s*(\d+)m/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1], 10);
        const minutes = parseInt(durationMatch[2], 10);
        initialSeconds = hours * 3600 + minutes * 60;
      }
    }
    
    setElapsedTime(initialSeconds);
    startTimeRef.current = Date.now() - (initialSeconds * 1000);
    
    // Update the timer every second
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const currentTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(currentTime);
      }
    }, 1000);

    // Update the entry status
    updateEntryStatus(id, "in-progress");
    
    toast({
      title: "Timer started",
      description: `Timer for "${entry.job}" has been started.`,
    });
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (activeTimer !== null) {
      // Update entry status and duration
      const hours = Math.floor(elapsedTime / 3600);
      const minutes = Math.floor((elapsedTime % 3600) / 60);
      const newDuration = `${hours}h ${minutes}m`;
      
      updateEntryDuration(activeTimer, newDuration, "completed");
      
      toast({
        title: "Timer stopped",
        description: `Timer stopped. Total time: ${formatTime(elapsedTime)}.`,
      });
    }
    
    setActiveTimer(null);
    startTimeRef.current = null;
  };

  const updateEntryStatus = (id: number, status: string) => {
    setTimerEntries(entries => 
      entries.map(entry => 
        entry.id === id ? { ...entry, status } : entry
      )
    );
  };

  const updateEntryDuration = (id: number, duration: string, status: string) => {
    setTimerEntries(entries => 
      entries.map(entry => 
        entry.id === id ? { ...entry, duration, status } : entry
      )
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-500">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">Track time spent on jobs</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Time Entry
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Active Timer</CardTitle>
              <CardDescription>Currently tracking time</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTimer ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-md bg-muted/50">
              <div>
                <h3 className="font-semibold">
                  {timerEntries.find(e => e.id === activeTimer)?.job || "Unknown Job"}
                </h3>
                <p className="text-muted-foreground">
                  {timerEntries.find(e => e.id === activeTimer)?.client || "No client"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-mono">{formatTime(elapsedTime)}</div>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => stopTimer()}
                >
                  <Pause className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-2 opacity-30" />
              <p>No active timer</p>
              <p className="text-sm">Start a timer to track your work time</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full md:w-auto justify-start">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden md:table-cell">Time</TableHead>
                      <TableHead className="hidden md:table-cell">Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timerEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.job}</TableCell>
                        <TableCell>{entry.client}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {entry.startTime} {entry.endTime ? `- ${entry.endTime}` : ''}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {entry.id === activeTimer ? formatTime(elapsedTime) : entry.duration}
                        </TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell className="text-right">
                          {entry.id === activeTimer ? (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => toggleTimer(entry.id)}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Stop
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleTimer(entry.id)}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Start
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Weekly view coming soon</p>
              </div>
            </TabsContent>
            
            <TabsContent value="monthly" className="mt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Monthly view coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
