
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronRight } from 'lucide-react';

type JobAllocation = {
  job_id: string;
  job_title: string;
  client_name: string;
  hours: number;
  status: string;
  scheduled_at: string | null;
  completed_at: string | null;
};

type UserHourData = {
  user_id: string;
  user_name: string;
  total_hours: number;
  job_allocations: JobAllocation[];
};

export function UserHourBreakdownCard() {
  const [userHourData, setUserHourData] = useState<UserHourData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUserHourData();
  }, []);

  const fetchUserHourData = async () => {
    setIsLoading(true);
    try {
      // Fetch all jobs with assigned users
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          duration,
          status,
          assigned_to,
          scheduled_at,
          completed_at,
          clients (name)
        `)
        .not('assigned_to', 'is', null);

      if (error) throw error;

      // Group jobs by user
      const userJobMap = new Map<string, JobAllocation[]>();
      
      for (const job of jobs || []) {
        if (!userJobMap.has(job.assigned_to)) {
          userJobMap.set(job.assigned_to, []);
        }
        
        userJobMap.get(job.assigned_to)!.push({
          job_id: job.id,
          job_title: job.title,
          client_name: job.clients?.name || 'Unknown Client',
          hours: job.duration || 0,
          status: job.status || 'scheduled',
          scheduled_at: job.scheduled_at,
          completed_at: job.completed_at
        });
      }

      // Fetch user profiles and calculate totals
      const userHourData: UserHourData[] = [];
      
      for (const [userId, jobAllocations] of userJobMap.entries()) {
        try {
          const { data: profile } = await supabase
            .rpc('get_user_profile', { user_id: userId });
          
          const userName = profile?.[0]?.full_name || 'Unknown Employee';
          const totalHours = jobAllocations.reduce((sum, job) => sum + job.hours, 0);
          
          userHourData.push({
            user_id: userId,
            user_name: userName,
            total_hours: totalHours,
            job_allocations: jobAllocations.sort((a, b) => 
              new Date(b.scheduled_at || '').getTime() - new Date(a.scheduled_at || '').getTime()
            )
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }

      // Sort by total hours descending
      userHourData.sort((a, b) => b.total_hours - a.total_hours);
      setUserHourData(userHourData);
    } catch (error) {
      console.error('Error fetching user hour data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hour Breakdown by User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hour Breakdown by User</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userHourData.map((user) => (
            <Collapsible key={user.user_id}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-muted/50"
                  onClick={() => toggleUserExpansion(user.user_id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-left">
                      <div className="font-medium">{user.user_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.job_allocations.length} job(s) • {user.total_hours}h total
                      </div>
                    </div>
                  </div>
                  {expandedUsers.has(user.user_id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="ml-4 border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.job_allocations.map((job) => (
                        <TableRow key={job.job_id}>
                          <TableCell className="font-medium">{job.job_title}</TableCell>
                          <TableCell>{job.client_name}</TableCell>
                          <TableCell>{job.hours}h</TableCell>
                          <TableCell>
                            <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(job.scheduled_at)}</TableCell>
                          <TableCell>{formatDate(job.completed_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
          {userHourData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No assigned jobs found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
