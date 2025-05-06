
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera } from "lucide-react";
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
            <div className="text-sm text-muted-foreground">
              {newPhotos.length} new photo(s) selected
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
