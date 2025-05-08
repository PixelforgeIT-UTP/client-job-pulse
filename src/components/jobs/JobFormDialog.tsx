import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CalendarIcon, Clock, DollarSign, MapPin, Image, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClientSelector } from "./ClientSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface JobFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
}

export function JobFormDialog({ isOpen, onClose, onSuccess, initialData }: JobFormDialogProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(
    initialData?.scheduled_at ? new Date(initialData.scheduled_at) : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      title: initialData?.title || "",
      client_id: initialData?.client_id || "",
      description: initialData?.description || "",
      location: initialData?.location || "",
      cost: initialData?.cost || "",
      scheduled_time: initialData?.scheduled_time || "",
      duration: initialData?.duration || "",
    },
  });

  useEffect(() => {
    if (initialData?.id) {
      fetchJobPhotos(initialData.id);
    }
  }, [initialData]);

  async function fetchJobPhotos(jobId: string) {
    try {
      const { data, error } = await supabase.storage.from("job-photos").list(jobId);
      if (error) throw error;
      if (data && data.length > 0) {
        const photos = data.filter((item) => !item.name.endsWith("/"));
        setExistingPhotos(photos);
      }
    } catch (error) {
      console.error("Error fetching job photos:", error);
    }
  }

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    try {
      const scheduledDateTime = date ? new Date(date) : new Date();
      if (data.scheduled_time) {
        const [hours, minutes] = data.scheduled_time.split(":").map(Number);
        scheduledDateTime.setHours(hours, minutes);
      }

      const jobData = {
        title: data.title,
        client_id: data.client_id,
        description: data.description,
        location: data.location,
        cost: data.cost ? parseFloat(data.cost) : null,
        duration: data.duration,
        scheduled_at: scheduledDateTime.toISOString(),
        status: initialData?.status || "scheduled",
      };

      let jobId = initialData?.id;

      if (initialData?.id) {
        const { error } = await supabase.from("jobs").update(jobData).eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { data: jobResult, error } = await supabase
          .from("jobs")
          .insert(jobData)
          .select("id")
          .single();

        if (error) throw error;
        jobId = jobResult.id;
      }

      if (images.length > 0 && jobId) {
        for (const image of images) {
          const fileName = `${jobId}/${Date.now()}_${image.name}`;
          const { error: uploadError } = await supabase.storage.from("job-photos").upload(fileName, image);
          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            toast({
              title: "Warning",
              description: `Failed to upload ${image.name}`,
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: initialData ? "Job updated" : "Job created",
        description: initialData
          ? "Your job has been updated successfully."
          : "Your job has been created successfully.",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setImages(selectedFiles);
      const previews = selectedFiles.map((file) => URL.createObjectURL(file));
      setImagePreviewUrls(previews);
    }
  }

  function getPhotoUrl(jobId: string, fileName: string) {
    return `${supabase.storage.from("job-photos").getPublicUrl(`${jobId}/${fileName}`).data.publicUrl}`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl">{initialData ? "Edit Job" : "Create New Job"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Job Title*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter job title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="client_id" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Client*</FormLabel>
                <FormControl>
                  <ClientSelector value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter job description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> Location
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Job location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cost" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-4 w-4" /> Cost
                  </FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-1 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" /> Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </FormItem>

              <FormField control={form.control} name="scheduled_time" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" /> Time
                  </FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="duration" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Duration (hours)
                </FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. 2, 2.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormItem>
              <FormLabel className="text-sm flex items-center gap-1 text-muted-foreground">
                <Image className="h-4 w-4" /> Photos
              </FormLabel>
              <div className="space-y-3">
                <FormControl>
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 hover:border-primary">
                      <div className="text-center">
                        <Plus className="mx-auto h-6 w-6 text-muted-foreground" />
                        <span className="mt-2 block text-sm">Add photos</span>
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </label>
                </FormControl>

                {imagePreviewUrls.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">New Photos</p>
                    <div className="grid grid-cols-4 gap-2">
                      {imagePreviewUrls.map((url, index) => (
                        <Avatar key={index} className="h-16 w-16 rounded-md">
                          <AvatarImage src={url} alt={`Preview ${index}`} className="object-cover" />
                          <AvatarFallback className="rounded-md">IMG</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                )}

                {existingPhotos.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Existing Photos</p>
                    <div className="grid grid-cols-4 gap-2">
                      {existingPhotos.map((photo, index) => (
                        <Avatar key={index} className="h-16 w-16 rounded-md">
                          <AvatarImage
                            src={getPhotoUrl(initialData.id, photo.name)}
                            alt={`Job Photo ${index}`}
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded-md">IMG</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FormItem>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : initialData ? "Update Job" : "Create Job"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}