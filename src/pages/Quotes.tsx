
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
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
import { Plus, Search } from 'lucide-react';

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch user role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setUserRole(profileData?.role || null);
      }

      // Fetch quotes
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching quotes:', error);
      } else {
        setQuotes(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredQuotes = quotes.filter((quote) =>
    quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.job_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_supervisor_approval':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Needs Approval</Badge>;
      case 'pending_client_signature':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Needs Signature</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-500 border-red-500">Rejected</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getWorkflowInfo = (quote: any) => {
    const { status } = quote;
    
    if (status === 'pending_supervisor_approval') {
      return 'Waiting for supervisor to review and cost the job';
    } else if (status === 'pending_client_signature') {
      return 'Ready for client signature - tech can collect signature';
    } else if (status === 'approved') {
      return 'Quote approved - job will be automatically created';
    } else if (status === 'rejected') {
      return 'Quote rejected by supervisor';
    }
    
    return 'Quote created';
  };

  // Allow any authenticated user to create quotes
  const canCreateQuote = true;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Quotes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your client quotes and workflow</p>
        </div>
        {canCreateQuote && (
          <Button onClick={() => navigate('/quotes/new')} size="sm" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Quote
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl">Quote Management</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Track quotes through the approval workflow: Creation → Supervisor Approval → Client Signature → Job Creation
              </CardDescription>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search quotes..."
                className="w-full pl-8 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Job Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredQuotes.length > 0 ? (
                  filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.client_name}</TableCell>
                      <TableCell>{quote.job_description}</TableCell>
                      <TableCell>${quote.amount}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {quote.job_date ? new Date(quote.job_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm text-muted-foreground">
                          {getWorkflowInfo(quote)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/quotes/${quote.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No quotes found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Workflow Status Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Badge variant="outline" className="text-amber-500 border-amber-500 whitespace-nowrap">Needs Approval</Badge>
              <span className="text-muted-foreground">Tech created, awaiting supervisor review</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-500 border-blue-500">Needs Signature</Badge>
              <span>Approved, needs client signature</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-500 border-green-500">Approved</Badge>
              <span>Signed, job created automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-red-500 border-red-500">Rejected</Badge>
              <span>Returned to tech for revision</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
