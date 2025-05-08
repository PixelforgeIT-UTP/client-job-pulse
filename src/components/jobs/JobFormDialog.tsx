import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CalendarIcon, Clock, DollarSign, MapPin, Image, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
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
  const [userId, setUserId] = useState<string | null>(null);

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
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id || null);
    };

    fetchUser();

    if (initialData?.id) {
      fetchJobPhotos(initialData.id);
    }
  }, [initialData]);

  async function fetchJobPhotos(jobId: string) {
    try {
      const { data, error } = await supabase.storage.from("job-photos").list(jobId);
      if (error) throw error;

      const photos = data.filter((item) => !item.name.endsWith("/"));
      setExistingPhotos(photos);
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
        created_by: userId,
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
          .maybeSingle();

        if (error) throw error;
        if (!jobResult) throw new Error("Job creation failed: no ID returned.");

        jobId = jobResult.id;
      }

      if (images.length > 0 && jobId) {
        for (const image of images) {
          const fileName = `${jobId}/${Date.now()}_${image.name}`;
          const { error: uploadError } = await supabase.storage
            .from("job-photos")
            .upload(fileName, image);

          if (uploadError) {
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Job" : "Create New Job"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter job title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client*</FormLabel>
                  <FormControl>
                    <ClientSelector value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter job description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Location
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter job location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Cost
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter job cost" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem className="flex flex-col">
                <FormLabel>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Date
                  </div>
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full pl-3 text-left font-normal", !date && "text-muted-foreground")}
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

              <FormField
                control={form.control}
                name="scheduled_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        Time
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Duration (hours)
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g. 2, 2.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>
                <div className="flex items-center">
                  <Image className="mr-2 h-4 w-4" />
                  Photos
                </div>
              </FormLabel>
              <div className="space-y-3">
                <FormControl>
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 hover:border-primary">
                      <div className="text-center">
                        <Plus className="mx-auto h-6 w-6 text-muted-foreground" />
                        <span className="mt-2 block text-sm font-medium text-muted-foreground">Add photos</span>
                      </div>
                      <Input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                    </div>
                  </label>
                </FormControl>

                {imagePreviewUrls.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">New Photos</h4>
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

                {existingPhotos.length > 0 && initialData?.id && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Existing Photos</h4>
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
              <FormMessage />
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
