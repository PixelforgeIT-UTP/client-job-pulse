
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

type PendingPhoto = {
  id: string;
  job_id: string;
  employee_id: string;
  photo_url: string;
  description: string | null;
  status: string;
  created_at: string;
  employee_name: string;
  job_title: string;
};

export function PendingPhotosCard() {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [updatingPhoto, setUpdatingPhoto] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPhotos();
  }, []);

  const fetchPendingPhotos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('photo_approval_requests')
        .select(`
          id,
          job_id,
          employee_id,
          photo_url,
          description,
          status,
          created_at,
          profiles!employee_id (full_name),
          jobs (title)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const photosWithNames = (data || []).map((photo: any) => ({
        id: photo.id,
        job_id: photo.job_id,
        employee_id: photo.employee_id,
        photo_url: photo.photo_url,
        description: photo.description,
        status: photo.status,
        created_at: photo.created_at,
        employee_name: photo.profiles?.full_name || 'Unknown Employee',
        job_title: photo.jobs?.title || 'Unknown Job'
      }));

      setPendingPhotos(photosWithNames);
    } catch (error) {
      console.error('Error fetching pending photos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending photos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (photoId: string, status: 'approved' | 'rejected') => {
    setUpdatingPhoto(photoId);
    try {
      const { error } = await supabase
        .from('photo_approval_requests')
        .update({
          status,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Photo ${status} successfully`,
      });

      // Remove the photo from the pending list
      setPendingPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } catch (error) {
      console.error('Error updating photo status:', error);
      toast({
        title: "Error",
        description: "Failed to update photo status",
        variant: "destructive",
      });
    } finally {
      setUpdatingPhoto(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Photos</CardTitle>
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Photos Pending Approval ({pendingPhotos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPhotos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No photos pending approval
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPhotos.map((photo) => (
                  <TableRow key={photo.id}>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPhoto(photo.photo_url)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {photo.job_title}
                    </TableCell>
                    <TableCell>
                      {photo.employee_name}
                    </TableCell>
                    <TableCell>
                      {photo.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(photo.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproval(photo.id, 'approved')}
                          disabled={updatingPhoto === photo.id}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproval(photo.id, 'rejected')}
                          disabled={updatingPhoto === photo.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
    </>
  );
}
