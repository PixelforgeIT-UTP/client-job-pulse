
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, MapPin, Plus, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { JobFormDialog } from '@/components/jobs/JobFormDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Schedule() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('today');
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState<{ date: string; fullDate: string; key: string }[]>([]);

  // Dialog states
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    generateDays();
    fetchJobs();
  }, []);

  function generateDays() {
    const daysArray = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      let dateLabel;
      if (i === 0) {
        dateLabel = "Today";
      } else if (i === 1) {
        dateLabel = "Tomorrow";
      } else {
        dateLabel = date.toLocaleDateString('en-US', { weekday: 'long' });
      }
      
      const fullDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      // Fix: change 'lowercase' to 'short' for the weekday format
      const key = i === 0 ? 'today' : date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      
      daysArray.push({ date: dateLabel, fullDate, key });
    }
    
    setDays(daysArray);
  }

  async function fetchJobs() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id, 
          title, 
          description, 
          status, 
          scheduled_at, 
          location,
          duration,
          client_id, 
          clients(name),
          assigned_to,
          profiles(full_name)
        `)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setScheduleItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching schedule",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  const formatScheduleDate = (dateString: string) => {
    if (!dateString) return 'No date set';

    const date = new Date(dateString);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${timeString}`;
  };

  function isSameDay(date1: Date, date2: Date) {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  const getDayKey = (dateString: string) => {
    if (!dateString) return '';

    const jobDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (isSameDay(jobDate, today)) {
      return 'today';
    }

    if (isSameDay(jobDate, tomorrow)) {
      return 'tomorrow';
    }

    // Fix: change 'lowercase' to 'short' for the weekday format
    return jobDate.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  };

  const filteredItems = activeTab === 'today' 
    ? scheduleItems.filter(item => getDayKey(item.scheduled_at) === 'today')
    : scheduleItems.filter(item => getDayKey(item.scheduled_at) === activeTab);

  function handleCreateJob() {
    setSelectedJob(null);
    setIsJobFormOpen(true);
  }

  async function handleStartJob(job: any) {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'in_progress',
        })
        .eq('id', job.id);

      if (error) throw error;

      toast({
        title: "Job started",
        description: `Job "${job.title}" has been marked as in progress.`,
      });

      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error starting job",
        description: error.message,
        variant: "destructive"
      });
    }
  }

  function handleOpenReschedule(job: any) {
    setSelectedJob(job);
    const jobDate = job.scheduled_at ? new Date(job.scheduled_at) : new Date();
    setSelectedDate(jobDate);
    setSelectedTime(
      jobDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    );
    setIsRescheduleDialogOpen(true);
  }

  async function handleRescheduleJob() {
    if (!selectedJob || !selectedDate) return;
    
    try {
      const scheduledDateTime = new Date(selectedDate);
      
      if (selectedTime) {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        scheduledDateTime.setHours(hours, minutes);
      }
      
      const { error } = await supabase
        .from('jobs')
        .update({ 
          scheduled_at: scheduledDateTime.toISOString(),
        })
        .eq('id', selectedJob.id);

      if (error) throw error;

      toast({
        title: "Job rescheduled",
        description: `Job "${selectedJob.title}" has been rescheduled to ${format(scheduledDateTime, 'PPP')} at ${format(scheduledDateTime, 'p')}.`,
      });

      setIsRescheduleDialogOpen(false);
      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error rescheduling job",
        description: error.message,
        variant: "destructive"
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">Manage your team's job schedule</p>
        </div>
        <Button onClick={handleCreateJob}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Job
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Job Calendar</CardTitle>
              <CardDescription>View and manage scheduled jobs</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Month View
              </Button>
              <Button variant="outline" size="sm">
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full md:w-auto justify-start overflow-x-auto">
              {days.map((day) => (
                <TabsTrigger 
                  key={day.key} 
                  value={day.key}
                  className="min-w-[100px]"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">{day.date}</span>
                    <span>{day.fullDate.split(', ')[0]}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {days.map((day) => (
              <TabsContent key={day.key} value={day.key} className="mt-6">
                {isLoading ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">Loading schedule...</p>
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="space-y-4">
                    {filteredItems.map((item) => (
                      <ScheduleCard 
                        key={item.id} 
                        item={item} 
                        formatScheduleDate={formatScheduleDate}
                        onStartJob={() => handleStartJob(item)}
                        onReschedule={() => handleOpenReschedule(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No jobs scheduled for {day.date.toLowerCase()}</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Job Form Dialog */}
      <JobFormDialog 
        isOpen={isJobFormOpen}
        onClose={() => setIsJobFormOpen(false)}
        onSuccess={fetchJobs}
      />

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Job</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Select new date</h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Select new time</h4>
              <Input 
                type="time" 
                value={selectedTime} 
                onChange={(e) => setSelectedTime(e.target.value)} 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRescheduleJob}>
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ScheduleItem {
  id: number;
  title: string;
  clients: { name: string };
  scheduled_at: string;
  address: string;
  location: string;
  assignedTo: string;
  profiles: { full_name: string };
}

interface ScheduleCardProps {
  item: ScheduleItem;
  formatScheduleDate: (date: string) => string;
  onStartJob: () => void;
  onReschedule: () => void;
}

function ScheduleCard({ item, formatScheduleDate, onStartJob, onReschedule }: ScheduleCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <Badge className="ml-2">Today</Badge>
            </div>
            <p className="text-muted-foreground">{item.clients?.name}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                {item.scheduled_at ? formatScheduleDate(item.scheduled_at) : 'No time set'}
              </div>
              {item.location && (
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  {item.location}
                </div>
              )}
              {item.profiles?.full_name && (
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  {item.profiles.full_name}
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2 self-end md:self-center">
            <Button variant="outline" size="sm" onClick={onReschedule}>Reschedule</Button>
            <Button size="sm" onClick={onStartJob}>Start Job</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
