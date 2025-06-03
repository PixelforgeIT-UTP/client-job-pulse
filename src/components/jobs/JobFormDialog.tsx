
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CalendarIcon, Clock, DollarSign, MapPin, Plus } from "lucide-react";
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

interface JobFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
}

const predefinedServices = [
  { label: "Raking", billingType: "flat", rate: 100 },
  { label: "Needle", billingType: "flat", rate: 375 },
  { label: "Trucks & Trailers on Site", billingType: "hourly", rate: 250 },
  { label: "Bobcat on Site", billingType: "hourly", rate: 350 },
  { label: "Roll off Bin", billingType: "flat", rate: 1500 },
  { label: "Grass Cutting", billingType: "unit", rate: 2, unitLabel: "sq ft" },
];

export function JobFormDialog({ isOpen, onClose, onSuccess, initialData }: JobFormDialogProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(
    initialData?.scheduled_at ? new Date(initialData.scheduled_at) : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [items, setItems] = useState([
    { description: "", quantity: 1, unit_price: 0, billingType: "flat", rateLabel: "" },
  ]);

  const form = useForm({
    defaultValues: {
      title: initialData?.title || "",
      client_id: initialData?.client_id || "",
      notes: initialData?.notes || "",
      location: initialData?.location || "",
      scheduled_time: initialData?.scheduled_time || "",
      duration: initialData?.duration || "",
      labor_cost: initialData?.labor_cost || "",
      material_cost: initialData?.material_cost || "",
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id || null);
    };
    fetchUser();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, billingType: "flat", rateLabel: "" }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = field === "quantity" || field === "unit_price" ? Number(value) : value;
    setItems(updated);
  };

  const handleServiceSelect = (index: number, label: string) => {
    const updated = [...items];
    if (label === "Custom Service") {
      updated[index] = {
        ...updated[index],
        description: "Custom Service",
        unit_price: 0,
        billingType: "flat",
        rateLabel: "",
      };
    } else {
      const match = predefinedServices.find((s) => s.label === label);
      if (match) {
        updated[index] = {
          ...updated[index],
          description: match.label,
          unit_price: match.rate,
          billingType: match.billingType,
          rateLabel: match.unitLabel || "",
        };
      }
    }
    setItems(updated);
  };

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2);

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
        notes: data.notes,
        location: data.location,
        duration: data.duration,
        cost: parseFloat(calculateTotal()),
        labor_cost: parseFloat(data.labor_cost) || 0,
        material_cost: parseFloat(data.material_cost) || 0,
        scheduled_at: scheduledDateTime.toISOString(),
        status: initialData?.status || "scheduled",
        created_by: userId,
      };

      let jobId = initialData?.id;

      if (jobId) {
        const { error } = await supabase.from("jobs").update(jobData).eq("id", jobId);
        if (error) throw error;
      } else {
        const { data: jobResult, error } = await supabase.from("jobs").insert(jobData).select("id").maybeSingle();
        if (error) throw error;
        if (!jobResult) throw new Error("Job creation failed.");
        jobId = jobResult.id;

        // Add initial note if provided
        if (data.notes && data.notes.trim()) {
          const { error: noteError } = await supabase.from("job_notes").insert({
            job_id: jobId,
            content: data.notes,
            created_by: userId,
          });
          if (noteError) console.error("Error creating initial note:", noteError);
        }
      }

      const lineItems = items.map((item) => ({
        job_id: jobId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { error: itemsError } = await supabase.from("job_items").insert(lineItems);
      if (itemsError) throw itemsError;

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add initial job notes..." {...field} />
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
                      <MapPin className="inline mr-2 h-4 w-4" />
                      Location
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
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Clock className="inline mr-2 h-4 w-4" />
                      Duration (hours)
                    </FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g. 2.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="labor_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <DollarSign className="inline mr-2 h-4 w-4" />
                      Labor Cost
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="material_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <DollarSign className="inline mr-2 h-4 w-4" />
                      Material Cost
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>
                  <CalendarIcon className="inline mr-2 h-4 w-4" />
                  Date
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
                      <Clock className="inline mr-2 h-4 w-4" />
                      Time
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-md p-4 bg-muted space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Service Items</h3>

              {items.map((item, idx) => {
                const isCustom = item.description === "Custom Service";

                return (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="text-xs mb-1 block">Service</label>
                      <select
                        className="w-full border p-2 text-sm"
                        value={isCustom ? "Custom Service" : item.description}
                        onChange={(e) => handleServiceSelect(idx, e.target.value)}
                      >
                        <option value="">Choose a service</option>
                        {predefinedServices.map((service) => (
                          <option key={service.label} value={service.label}>
                            {service.label}
                          </option>
                        ))}
                        <option value="Custom Service">Custom Service</option>
                      </select>

                      {isCustom && (
                        <Input
                          placeholder="Custom name"
                          value={item.description === "Custom Service" ? "" : item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-xs mb-1 block">
                        {item.billingType === "unit"
                          ? item.rateLabel || "Units"
                          : item.billingType === "hourly"
                          ? "Hours"
                          : "Qty"}
                      </label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-xs mb-1 block">Unit Price</label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}

              <Button type="button" variant="secondary" onClick={handleAddItem} className="text-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>

            <div className="flex justify-between items-center pt-4 font-medium text-sm">
              <span className="text-muted-foreground">Proposed Total</span>
              <span>${calculateTotal()}</span>
            </div>

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
