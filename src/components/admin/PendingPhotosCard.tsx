
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Check, X } from 'lucide-react';
import { format } from 'date-fns';

type PendingPhoto = {
  id: string;
  job_title: string;
  client_name: string;
  employee_name: string;
  photo_url: string;
  description: string;
  created_at: string;
  status: string;
};

export function PendingPhotosCard() {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingPhotos();
  }, []);

  const fetchPendingPhotos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('photo_approval_requests')
        .select(`
          *,
          jobs (
            title,
            clients (name)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const photosWithProfiles = await Promise.all(
        (data || []).map(async (photo: any) => {
          let employeeName = 'Unknown Employee';
          try {
            const { data: profile } = await supabase
              .rpc('get_user_profile', { user_id: photo.created_by });
            employeeName = profile?.[0]?.full_name || 'Unknown Employee';
          } catch (error) {
            console.error('Error fetching employee profile:', error);
          }

          return {
            id: photo.id,
            job_title: photo.jobs?.title || 'Unknown Job',
            client_name: photo.jobs?.clients?.name || 'Unknown Client',
            employee_name: employeeName,
            photo_url: photo.photo_url,
            description: photo.description || 'No description',
            created_at: photo.created_at,
            status: photo.status
          };
        })
      );

      setPendingPhotos(photosWithProfiles);
    } catch (error) {
      console.error('Error fetching pending photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (photoId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await (supabase as any)
        .from('photo_approval_requests')
        .update({ status })
        .eq('id', photoId);

      if (error) throw error;

      fetchPendingPhotos(); // Refresh the list
    } catch (error) {
      console.error('Error updating photo status:', error);
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
          <CardTitle>Photos Pending Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPhotos.map((photo) => (
                <TableRow key={photo.id}>
                  <TableCell className="font-medium">{photo.job_title}</TableCell>
                  <TableCell>{photo.client_name}</TableCell>
                  <TableCell>{photo.employee_name}</TableCell>
                  <TableCell>{photo.description}</TableCell>
                  <TableCell>{format(new Date(photo.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPhoto(photo.photo_url)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproval(photo.id, 'approved')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApproval(photo.id, 'rejected')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
    </>
  );
}
