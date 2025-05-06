
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for upcoming jobs
const upcomingJobs = [
  {
    id: 1,
    title: "Kitchen Renovation",
    client: "Acme Corp",
    time: "Today, 2:00 PM",
    address: "123 Main St, Anytown"
  },
  {
    id: 2,
    title: "Electrical Inspection",
    client: "Globex Industries",
    time: "Tomorrow, 9:00 AM",
    address: "456 Park Ave, Othertown"
  },
  {
    id: 3,
    title: "Plumbing Repair",
    client: "Wayne Enterprises",
    time: "Wed, Jun 5 - 11:30 AM",
    address: "789 Broadway, Somewhere"
  }
];

export default function UpcomingJobsCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Upcoming Jobs</CardTitle>
        <CardDescription>Your scheduled jobs for the next few days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingJobs.map((job) => (
          <div key={job.id} className="flex items-start space-x-4 rounded-md border p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Link to="/jobs" className="font-medium hover:underline">{job.title}</Link>
              <div className="text-sm text-muted-foreground">{job.client}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>{job.time}</span>
                <Badge variant="outline" className="ml-2 text-xs">Scheduled</Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/jobs">View All Jobs</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
