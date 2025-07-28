import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Calendar, Map, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { JobFormDialog } from '@/components/jobs/JobFormDialog';
import { format } from 'date-fns';
import { JobPhotosDialog } from '@/components/jobs/JobPhotosDialog';
import { JobNotesDialog } from '@/components/jobs/JobNotesDialog';
import { useAuth } from '@/contexts/AuthContext';

export default function Jobs() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [clients, setClients] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isPhotosDialogOpen, setIsPhotosDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchClients();
  }, []);

  async function fetchJobs() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name');

      if (error) throw error;

      const clientMap: { [key: string]: string } = {};
      if (data) {
        data.forEach(client => {
          clientMap[client.id] = client.name;
        });
      }
      setClients(clientMap);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
    }
  }

  const filteredJobs = jobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clients[job.client_id]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 hover:bg-red-600">Cancelled</Badge>;
      case 'scheduled':
      default:
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Scheduled</Badge>;
    }
  };

  function handleAddJob() {
    setSelectedJob(null);
    setIsJobFormOpen(true);
  }

  function handleEditJob(job: any) {
    setSelectedJob(job);
    setIsJobFormOpen(true);
  }

  function handleViewPhotos(job: any) {
    setSelectedJob(job);
    setIsPhotosDialogOpen(true);
  }

  function handleViewNotes(job: any) {
    setSelectedJob(job);
    setIsNotesDialogOpen(true);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your service jobs</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddJob} size="sm" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Job
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl">Job Management</CardTitle>
              <CardDescription className="text-sm">View and manage all jobs</CardDescription>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search jobs..."
                className="w-full pl-8 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Date
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <div className="flex items-center">
                        <Map className="mr-1 h-4 w-4" />
                        Location
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        Duration
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{clients[job.client_id] || 'Unknown Client'}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(job.scheduled_at)}</TableCell>
                        <TableCell className="hidden md:table-cell">{job.location || 'Not specified'}</TableCell>
                        <TableCell className="hidden md:table-cell">{job.duration ? `${job.duration} hrs` : 'Not specified'}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewPhotos(job)} className="text-xs sm:text-sm">
                              Photos
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleViewNotes(job)} className="text-xs sm:text-sm">
                              Notes
                            </Button>
                            {isAdmin && (
                              <Button variant="default" size="sm" onClick={() => handleEditJob(job)} className="text-xs sm:text-sm">
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {searchTerm ? 'No jobs match your search' : 'No jobs found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <JobFormDialog
          isOpen={isJobFormOpen}
          onClose={() => setIsJobFormOpen(false)}
          initialData={selectedJob}
          onSuccess={fetchJobs}
        />
      )}

      {selectedJob && (
        <>
          <JobPhotosDialog
            isOpen={isPhotosDialogOpen}
            onClose={() => setIsPhotosDialogOpen(false)}
            jobId={selectedJob.id}
          />
          <JobNotesDialog
            isOpen={isNotesDialogOpen}
            onClose={() => setIsNotesDialogOpen(false)}
            jobId={selectedJob.id}
            currentNotes={selectedJob.notes}
          />
        </>
      )}
    </div>
  );
}
