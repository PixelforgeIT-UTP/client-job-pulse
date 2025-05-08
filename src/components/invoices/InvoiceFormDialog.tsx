import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

export function InvoiceFormDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [createNewJob, setCreateNewJob] = useState(false);

  const predefinedServices = [
    { label: 'Consultation', unit_price: 100 },
    { label: 'Repair', unit_price: 150 },
    { label: 'Maintenance', unit_price: 75 },
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase.from('jobs').select('id, title');
      if (!error) setJobs(data || []);
    };

    if (isOpen) fetchJobs();
  }, [isOpen]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = field === 'quantity' || field === 'unit_price' ? Number(value) : value;
    setItems(updated);
  };

  const handleServiceSelect = (index: number, label: string) => {
    const service = predefinedServices.find((s) => s.label === label);
    if (service) {
      const updated = [...items];
      updated[index].description = service.label;
      updated[index].unit_price = service.unit_price;
      setItems(updated);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!dueDate || items.length === 0) {
      toast({
        title: 'Validation error',
        description: 'Missing required fields.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    let jobId = selectedJobId;

    if (createNewJob && newJobTitle.trim()) {
      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({ title: newJobTitle })
        .select()
        .single();
      if (error) {
        toast({ title: 'Error creating job', description: error.message, variant: 'destructive' });
        setSubmitting(false);
        return;
      }
      jobId = newJob.id;
    }

    const totalAmount = Number(calculateTotal());

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{ job_id: jobId, due_date: dueDate, amount: totalAmount, paid: false }])
      .select()
      .single();

    if (invoiceError) {
      toast({ title: 'Invoice error', description: invoiceError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    const lineItems = items.map((item) => ({
      invoice_id: invoiceData.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems);
    if (itemsError) {
      toast({ title: 'Items error', description: itemsError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    toast({ title: 'Invoice created' });
    setSubmitting(false);
    onClose();
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Fill out the form below to generate a new invoice with line items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="block mb-1">Due Date</span>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>

          <div className="space-y-2">
            <label className="block mb-1">Job</label>
            {!createNewJob ? (
              <select
                className="w-full border rounded p-2"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                <option value="">Select a job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="New Job Title"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
              />
            )}
            <Button variant="link" className="text-sm px-0" onClick={() => setCreateNewJob(!createNewJob)}>
              {createNewJob ? 'Select Existing Job' : 'Create New Job'}
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-sm">Description</label>
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    placeholder="Service name"
                  />
                  <select
                    className="mt-1 w-full border p-1 text-sm"
                    onChange={(e) => handleServiceSelect(idx, e.target.value)}
                  >
                    <option value="">Pick predefined</option>
                    {predefinedServices.map((service) => (
                      <option key={service.label} value={service.label}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Qty</label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm">Unit Price</label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddItem} className="mt-2">
              <Plus className="mr-1 w-4 h-4" /> Add Line Item
            </Button>
          </div>

          <div className="flex justify-between font-medium text-right pt-4">
            <span>Total:</span>
            <span>${calculateTotal()}</span>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
