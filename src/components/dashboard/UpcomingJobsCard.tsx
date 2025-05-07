import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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

export default function UpcomingJobsCard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Calculate end of this business week (Friday, 11:59:59 PM)
      const currentDay = today.getDay(); // Sunday = 0 ... Saturday = 6
      const daysUntilFriday = currentDay <= 5 ? 5 - currentDay : 0;

      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + daysUntilFriday);
      endOfWeek.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "scheduled")
        .gte("scheduled_time", today.toISOString())
        .lte("scheduled_time", endOfWeek.toISOString())
        .order("scheduled_time", { ascending: true })
        .limit(5);

      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        setJobs(data || []);
      }

      setLoading(false);
    };

    fetchJobs();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Upcoming Jobs</CardTitle>
        <CardDescription>Your scheduled jobs for the next business week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} className="flex items-start space-x-4 rounded-md border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Link to="/jobs" className="font-medium hover:underline">
                  {job.title || job.job_description}
                </Link>
                <div className="text-sm text-muted-foreground">{job.client_name}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{formatDateTime(job.scheduled_time)}</span>
                  <Badge variant="outline" className="ml-2 text-xs">Scheduled</Badge>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming jobs found.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/jobs">View All Jobs</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
