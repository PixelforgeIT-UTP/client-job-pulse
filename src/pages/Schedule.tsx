
import { useState } from 'react';
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
import { Calendar as CalendarIcon, Clock, MapPin, Plus, User } from 'lucide-react';

// Mock schedule data
const scheduleItems = [
  { 
    id: 1, 
    title: "Kitchen Renovation", 
    client: "Acme Corp", 
    time: "9:00 AM - 12:00 PM", 
    address: "123 Main St",
    assignedTo: "John Doe"
  },
  { 
    id: 2, 
    title: "Electrical Inspection", 
    client: "Globex Industries", 
    time: "1:30 PM - 3:00 PM", 
    address: "456 Park Ave",
    assignedTo: "Robert Taylor"
  },
  { 
    id: 3, 
    title: "Plumbing Repair", 
    client: "Wayne Enterprises", 
    time: "4:00 PM - 6:00 PM", 
    address: "789 Broadway",
    assignedTo: "Sarah Miller"
  }
];

// Mock upcoming days
const days = [
  { date: "Today", fullDate: "June 4, 2025" },
  { date: "Tomorrow", fullDate: "June 5, 2025" },
  { date: "Friday", fullDate: "June 6, 2025" },
  { date: "Saturday", fullDate: "June 7, 2025" },
  { date: "Sunday", fullDate: "June 8, 2025" },
  { date: "Monday", fullDate: "June 9, 2025" },
  { date: "Tuesday", fullDate: "June 10, 2025" },
];

export default function Schedule() {
  const [activeTab, setActiveTab] = useState('today');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">Manage your team's job schedule</p>
        </div>
        <Button>
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
              {days.map((day, index) => (
                <TabsTrigger 
                  key={index} 
                  value={day.date.toLowerCase()}
                  className="min-w-[100px]"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">{day.date}</span>
                    <span>{day.fullDate.split(', ')[0]}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="today" className="mt-6">
              <div className="space-y-4">
                {scheduleItems.map((item) => (
                  <ScheduleCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>

            {/* Placeholder content for other days */}
            {days.slice(1).map((day, index) => (
              <TabsContent key={index} value={day.date.toLowerCase()} className="mt-6">
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No jobs scheduled for {day.date.toLowerCase()}</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface ScheduleItem {
  id: number;
  title: string;
  client: string;
  time: string;
  address: string;
  assignedTo: string;
}

function ScheduleCard({ item }: { item: ScheduleItem }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <Badge className="ml-2">Today</Badge>
            </div>
            <p className="text-muted-foreground">{item.client}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                {item.time}
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                {item.address}
              </div>
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                {item.assignedTo}
              </div>
            </div>
          </div>
          <div className="flex space-x-2 self-end md:self-center">
            <Button variant="outline" size="sm">Reschedule</Button>
            <Button size="sm">Start Job</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
