
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

// Mock data for upcoming jobs
const upcomingJobs = [
  { 
    id: 1, 
    title: "Kitchen Renovation", 
    client: "Acme Corp", 
    date: "Today, 2:00 PM", 
    status: "confirmed" 
  },
  { 
    id: 2, 
    title: "Electrical Inspection", 
    client: "Globex Industries", 
    date: "Tomorrow, 9:00 AM", 
    status: "pending" 
  },
  { 
    id: 3, 
    title: "Plumbing Repair", 
    client: "Wayne Enterprises", 
    date: "Wed, Jun 5 - 11:30 AM", 
    status: "confirmed" 
  },
  { 
    id: 4, 
    title: "HVAC Maintenance", 
    client: "Stark Industries", 
    date: "Thu, Jun 6 - 3:00 PM", 
    status: "confirmed" 
  },
];

export default function UpcomingJobsCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Upcoming Jobs</CardTitle>
          <CardDescription>Jobs scheduled for the next 7 days</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/schedule">View calendar</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-muted-foreground">{job.client}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  <span>{job.date}</span>
                </div>
                <Badge variant={job.status === 'pending' ? "outline" : "default"}>
                  {job.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
