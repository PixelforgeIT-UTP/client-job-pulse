
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JobPhotosDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
}

export function JobPhotosDialog({ isOpen, onClose, jobId }: JobPhotosDialogProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Array<{ url: string; name: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [isSubmittingForApproval, setIsSubmittingForApproval] = useState(false);

  useEffect(() => {
    if (isOpen && jobId) {
      fetchPhotos();
    }
  }, [isOpen, jobId]);

  async function fetchPhotos() {
    try {
      const { data, error } = await supabase.storage
        .from("job-photos")
        .list(jobId);

      if (error) throw error;

      if (data) {
        const photoUrls = await Promise.all(
          data.map(async (item) => {
            const { data: url } = supabase.storage
              .from("job-photos")
              .getPublicUrl(`${jobId}/${item.name}`);
            
            return {
              name: item.name,
              url: url.publicUrl,
            };
          })
        );
        
        setPhotos(photoUrls);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setNewPhotos(Array.from(e.target.files));
    }
  }

  async function uploadPhotos() {
    if (newPhotos.length === 0) return;

    setIsUploading(true);
    try {
      for (const photo of newPhotos) {
        const fileName = `${jobId}/${Date.now()}_${photo.name}`;
        const { error } = await supabase.storage
          .from("job-photos")
          .upload(fileName, photo);

        if (error) throw error;
      }

      toast({
        title: "Photos uploaded",
        description: `Successfully uploaded ${newPhotos.length} photo(s)`,
      });

      setNewPhotos([]);
      fetchPhotos();
    } catch (error: any) {
      toast({
        title: "Error uploading photos",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function submitForApproval() {
    if (newPhotos.length === 0) {
      toast({
        title: "No photos selected",
        description: "Please select photos to submit for approval",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingForApproval(true);
    try {
      // First upload the photos
      const uploadedUrls = [];
      for (const photo of newPhotos) {
        const fileName = `${jobId}/${Date.now()}_${photo.name}`;
        const { error: uploadError } = await supabase.storage
          .from("job-photos")
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("job-photos")
          .getPublicUrl(fileName);
        
        uploadedUrls.push(urlData.publicUrl);
      }

      // Then create approval requests
      for (const url of uploadedUrls) {
        const { error } = await supabase
          .from('photo_approval_requests')
          .insert({
            job_id: jobId,
            photo_url: url,
            description: description || 'Photo submission for approval',
            status: 'pending',
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      }

      toast({
        title: "Photos submitted for approval",
        description: `Successfully submitted ${newPhotos.length} photo(s) for supervisor approval`,
      });

      setNewPhotos([]);
      setDescription("");
      fetchPhotos();
    } catch (error: any) {
      toast({
        title: "Error submitting for approval",
        description: error.message || "An error occurred during submission",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingForApproval(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Job Photos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handlePhotoChange}
              />
            </div>
            <Button 
              onClick={uploadPhotos} 
              disabled={isUploading || newPhotos.length === 0}
            >
              <Camera className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>

          {newPhotos.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {newPhotos.length} new photo(s) selected
              </div>
              <Textarea
                placeholder="Add a description for supervisor approval (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
              <Button 
                onClick={submitForApproval}
                disabled={isSubmittingForApproval || newPhotos.length === 0}
                variant="outline"
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmittingForApproval ? "Submitting..." : "Submit for Supervisor Approval"}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative h-40 rounded-md overflow-hidden">
                <img 
                  src={photo.url} 
                  alt={`Job photo ${index + 1}`}
                  className="w-full h-full object-cover" 
                />
              </div>
            ))}
            {photos.length === 0 && !isUploading && (
              <div className="col-span-full p-8 text-center text-muted-foreground">
                No photos available for this job
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
