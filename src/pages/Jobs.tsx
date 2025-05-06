
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Search, DollarSign, MapPin, Clock, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { JobFormDialog } from '@/components/jobs/JobFormDialog';
import { JobPhotosDialog } from '@/components/jobs/JobPhotosDialog';

export default function Jobs() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [isPhotosDialogOpen, setIsPhotosDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  useEffect(() => {
    fetchJobs();
  }, []);

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
          cost,
          duration,
          client_id, 
          clients(name),
          assigned_to
        `)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching jobs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Filter jobs based on search term and active tab
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'in-progress') return matchesSearch && job.status === 'in_progress';
    if (activeTab === 'scheduled') return matchesSearch && job.status === 'scheduled';
    if (activeTab === 'completed') return matchesSearch && job.status === 'completed';
    
    return matchesSearch;
  });

  const formatScheduleDate = (dateString: string) => {
    if (!dateString) return 'No date set';

    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Today, ${timeString}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${timeString}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-500">Completed</Badge>;
      default:
        return null;
    }
  };

  function handleCreateJob() {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">Manage your service jobs and projects</p>
        </div>
        <Button onClick={handleCreateJob}>
          <Plus className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Job Board</CardTitle>
              <CardDescription>View and manage your jobs</CardDescription>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search jobs..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full md:w-auto justify-start">
              <TabsTrigger value="all">All Jobs</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">Loading jobs...</p>
                  </div>
                ) : filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onEdit={() => handleEditJob(job)}
                      onViewPhotos={() => handleViewPhotos(job)}
                      formatScheduleDate={formatScheduleDate}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">No jobs found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab content for other tabs */}
            <TabsContent value="in-progress" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">Loading jobs...</p>
                  </div>
                ) : filteredJobs.filter(job => job.status === 'in_progress').length > 0 ? (
                  filteredJobs.filter(job => job.status === 'in_progress').map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onEdit={() => handleEditJob(job)}
                      onViewPhotos={() => handleViewPhotos(job)}
                      formatScheduleDate={formatScheduleDate}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">No in-progress jobs found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">Loading jobs...</p>
                  </div>
                ) : filteredJobs.filter(job => job.status === 'scheduled').length > 0 ? (
                  filteredJobs.filter(job => job.status === 'scheduled').map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onEdit={() => handleEditJob(job)}
                      onViewPhotos={() => handleViewPhotos(job)}
                      formatScheduleDate={formatScheduleDate}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">No scheduled jobs found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">Loading jobs...</p>
                  </div>
                ) : filteredJobs.filter(job => job.status === 'completed').length > 0 ? (
                  filteredJobs.filter(job => job.status === 'completed').map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onEdit={() => handleEditJob(job)}
                      onViewPhotos={() => handleViewPhotos(job)}
                      formatScheduleDate={formatScheduleDate}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">No completed jobs found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Job Form Dialog */}
      <JobFormDialog 
        isOpen={isJobFormOpen}
        onClose={() => setIsJobFormOpen(false)}
        initialData={selectedJob}
        onSuccess={fetchJobs}
      />

      {/* Job Photos Dialog */}
      {selectedJob && (
        <JobPhotosDialog 
          isOpen={isPhotosDialogOpen}
          onClose={() => setIsPhotosDialogOpen(false)}
          jobId={selectedJob.id}
        />
      )}
    </div>
  );
}

interface JobCardProps {
  job: any;
  onEdit: () => void;
  onViewPhotos: () => void;
  formatScheduleDate: (date: string) => string;
  getStatusBadge: (status: string) => JSX.Element | null;
}

function JobCard({ job, onEdit, onViewPhotos, formatScheduleDate, getStatusBadge }: JobCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-base">{job.title}</CardTitle>
          <CardDescription>{job.clients?.name || "No client"}</CardDescription>
        </div>
        {getStatusBadge(job.status)}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{job.scheduled_at ? formatScheduleDate(job.scheduled_at) : 'No date set'}</span>
          </div>
          
          {job.location && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">{job.location}</span>
            </div>
          )}
          
          {job.cost && (
            <div className="flex items-start gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">${job.cost}</span>
            </div>
          )}
          
          {job.duration && (
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">{job.duration} hours</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onViewPhotos}>
            <Image className="mr-2 h-4 w-4" />
            Photos
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
