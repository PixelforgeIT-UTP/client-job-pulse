
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CalendarIcon, Clock, DollarSign, MapPin, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
        // Update existing job
        const { error } = await supabase
          .from("jobs")
          .update(jobData)
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        // Create new job
        const { data: jobResult, error } = await supabase
          .from("jobs")
          .insert(jobData)
          .select('id')
          .single();

        if (error) throw error;
        jobId = jobResult.id;
      }

      // Handle image uploads if any
      if (images.length > 0 && jobId) {
        for (const image of images) {
          const fileName = `${jobId}/${Date.now()}_${image.name}`;
          const { error: uploadError } = await supabase.storage
            .from("job-photos")
            .upload(fileName, image);

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
          }
        }
      }

      toast({
        title: initialData ? "Job updated" : "Job created",
        description: initialData ? "Your job has been updated successfully." : "Your job has been created successfully.",
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
      setImages(Array.from(e.target.files));
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
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
                    <Input placeholder="Select client" {...field} />
                    {/* Note: In a real implementation, this would be a dropdown/select component with client options */}
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
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
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
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageChange} 
                />
              </FormControl>
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
