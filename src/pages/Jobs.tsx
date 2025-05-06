
import { useState } from 'react';
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
import { CalendarIcon, Plus, Search } from 'lucide-react';

// Mock job data
const jobs = [
  { 
    id: 1, 
    title: "Kitchen Renovation", 
    client: "Acme Corp", 
    dueDate: "Today, 2:00 PM", 
    status: "in-progress",
    address: "123 Main St",
    team: ["John D.", "Emma S."]
  },
  { 
    id: 2, 
    title: "Electrical Inspection", 
    client: "Globex Industries", 
    dueDate: "Tomorrow, 9:00 AM", 
    status: "scheduled",
    address: "456 Park Ave",
    team: ["Robert T."]
  },
  { 
    id: 3, 
    title: "Plumbing Repair", 
    client: "Wayne Enterprises", 
    dueDate: "Wed, Jun 5 - 11:30 AM", 
    status: "scheduled",
    address: "789 Broadway",
    team: ["Sarah M.", "Chris B."]
  },
  { 
    id: 4, 
    title: "HVAC Maintenance", 
    client: "Stark Industries", 
    dueDate: "Thu, Jun 6 - 3:00 PM", 
    status: "scheduled",
    address: "1010 Tech Drive",
    team: ["Michael R."]
  },
  { 
    id: 5, 
    title: "Office Remodel", 
    client: "Umbrella Corporation", 
    dueDate: "Completed on May 28", 
    status: "completed",
    address: "500 Corporate Way",
    team: ["John D.", "Emma S.", "Robert T."]
  },
  { 
    id: 6, 
    title: "Security System", 
    client: "Cyberdyne Systems", 
    dueDate: "Completed on May 25", 
    status: "completed",
    address: "600 Innovation Blvd",
    team: ["Sarah M."]
  },
];

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Filter jobs based on search term and active tab
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'in-progress') return matchesSearch && job.status === 'in-progress';
    if (activeTab === 'scheduled') return matchesSearch && job.status === 'scheduled';
    if (activeTab === 'completed') return matchesSearch && job.status === 'completed';
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-500">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">Manage your service jobs and projects</p>
        </div>
        <Button>
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
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {filteredJobs.length === 0 && (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">No jobs found</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="in-progress" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.filter(job => job.status === 'in-progress').map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {filteredJobs.filter(job => job.status === 'in-progress').length === 0 && (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">No in-progress jobs found</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="scheduled" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.filter(job => job.status === 'scheduled').map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {filteredJobs.filter(job => job.status === 'scheduled').length === 0 && (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">No scheduled jobs found</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.filter(job => job.status === 'completed').map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {filteredJobs.filter(job => job.status === 'completed').length === 0 && (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-muted-foreground">No completed jobs found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface Job {
  id: number;
  title: string;
  client: string;
  dueDate: string;
  status: string;
  address: string;
  team: string[];
}

function JobCard({ job }: { job: Job }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-500">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-base">{job.title}</CardTitle>
          <CardDescription>{job.client}</CardDescription>
        </div>
        {getStatusBadge(job.status)}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{job.dueDate}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mt-0.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-muted-foreground">{job.address}</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {job.team.slice(0, 3).map((member, index) => (
              <div key={index} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-white ring-2 ring-white">
                {member.split(' ')[0][0]}{member.split(' ')[1]?.[0] || ''}
              </div>
            ))}
            {job.team.length > 3 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs ring-2 ring-white">
                +{job.team.length - 3}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm">View</Button>
        </div>
      </CardContent>
    </Card>
  );
}
