
import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('daily');
  const [activeTimer, setActiveTimer] = useState<number | null>(3);

  const toggleTimer = (id: number) => {
    if (activeTimer === id) {
      setActiveTimer(null);
    } else {
      setActiveTimer(id);
    }
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
                <h3 className="font-semibold">Plumbing Repair</h3>
                <p className="text-muted-foreground">Wayne Enterprises</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-mono">00:45:12</div>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => toggleTimer(3)}
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
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.job}</TableCell>
                        <TableCell>{entry.client}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {entry.startTime} {entry.endTime ? `- ${entry.endTime}` : ''}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{entry.duration}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell className="text-right">
                          {entry.status === 'in-progress' ? (
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
