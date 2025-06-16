import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Eye, Check, X, Upload } from 'lucide-react';

type PhotoRequest = {
  id: string;
  job_id: string;
  photo_url: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  created_by: string;
  job?: {
    title: string;
    client?: {
      name: string;
    };
  };
  user_profile?: {
    full_name: string;
  };
};

export default function SupervisorApproval() {
  const [photoRequests, setPhotoRequests] = useState<PhotoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotoRequests();
  }, []);

  const fetchPhotoRequests = async () => {
    setIsLoading(true);
    try {
      // Using type assertion to work around missing types
      const { data, error } = await (supabase as any)
        .from('photo_approval_requests')
        .select(`
          *,
          jobs (
            title,
            clients (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each request
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request: any) => {
          try {
            const { data: profile } = await supabase
              .rpc('get_user_profile', { user_id: request.created_by });
            
            return {
              ...request,
              user_profile: profile?.[0] || { full_name: 'Unknown User' }
            };
          } catch (error) {
            console.error('Error fetching profile:', error);
            return {
              ...request,
              user_profile: { full_name: 'Unknown User' }
            };
          }
        })
      );

      setPhotoRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching photo requests:', error);
      toast.error('Failed to load photo requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      // Using type assertion to work around missing types
      const { error } = await (supabase as any)
        .from('photo_approval_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Photo ${status} successfully`);
      fetchPhotoRequests(); // Refresh the list
    } catch (error) {
      console.error('Error updating photo status:', error);
      toast.error('Failed to update photo status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Supervisor Approval</h1>
        <p className="text-muted-foreground">Review and approve photo submissions from team members.</p>
      </div>

      {photoRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No photo requests</h3>
            <p className="text-muted-foreground text-center">
              When team members upload photos for review, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {photoRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {request.job?.title || 'Unknown Job'}
                  </CardTitle>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {request.job?.client?.name || 'Unknown Client'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedPhoto(request.photo_url)}
                >
                  <img 
                    src={request.photo_url} 
                    alt="Uploaded photo"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm">{request.description}</p>
                  <div className="text-xs text-muted-foreground">
                    <p>By: {request.user_profile?.full_name}</p>
                    <p>Submitted: {format(new Date(request.created_at), 'MMM d, yyyy at h:mm a')}</p>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproval(request.id, 'approved')}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleApproval(request.id, 'rejected')}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img 
              src={selectedPhoto} 
              alt="Full size photo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
