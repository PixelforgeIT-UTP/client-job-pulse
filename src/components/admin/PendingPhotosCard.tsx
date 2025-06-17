
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
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPhotos();
  }, []);

  const fetchPendingPhotos = async () => {
    setIsLoading(true);
    try {
      // For now, return empty array since photo_approval_requests table might not be created yet
      console.log('Photo approval requests functionality will be available once the table is created');
      setPendingPhotos([]);
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
    try {
      // This will be implemented once the photo_approval_requests table is available
      console.log(`Would ${status} photo ${photoId}`);
      
      toast({
        title: "Info",
        description: "Photo approval functionality will be available once the database table is created",
      });
    } catch (error) {
      console.error('Error updating photo status:', error);
      toast({
        title: "Error",
        description: "Failed to update photo status",
        variant: "destructive",
      });
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
          <div className="text-center py-8 text-muted-foreground">
            Photo approval functionality will be available once the database is properly set up
          </div>
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
