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
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0, billingType: 'flat', rateLabel: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [createNewJob, setCreateNewJob] = useState(false);

  const predefinedServices = [
    { label: 'Raking', billingType: 'flat', rate: 100 },
    { label: 'Needle', billingType: 'flat', rate: 375 },
    { label: 'Trucks & Trailers on Site', billingType: 'hourly', rate: 250 },
    { label: 'Bobcat on Site', billingType: 'hourly', rate: 350 },
    { label: 'Roll off Bin', billingType: 'flat', rate: 1500 },
    { label: 'Grass Cutting', billingType: 'unit', rate: 2, unitLabel: 'sq ft' },
  ];

  useEffect(() => {
    if (isOpen) {
      supabase.from('jobs').select('id, title').then(({ data }) => {
        if (data) setJobs(data);
      });
    }
  }, [isOpen]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, billingType: 'flat', rateLabel: '' }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = field === 'quantity' || field === 'unit_price' ? Number(value) : value;
    setItems(updated);
  };

  const handleServiceSelect = (index: number, label: string) => {
    const updated = [...items];

    if (label === 'Custom Service') {
      updated[index] = {
        ...updated[index],
        description: 'Custom Service',
        unit_price: 0,
        billingType: 'flat',
        rateLabel: '',
      };
    } else {
      const match = predefinedServices.find((s) => s.label === label);
      if (match) {
        updated[index] = {
          ...updated[index],
          description: match.label,
          unit_price: match.rate,
          billingType: match.billingType,
          rateLabel: match.unitLabel || '',
        };
      }
    }

    setItems(updated);
  };

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2);

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

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{ job_id: jobId, due_date: dueDate, amount: Number(calculateTotal()), paid: false }])
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
      <DialogContent className="max-w-3xl space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Invoice</DialogTitle>
          <DialogDescription>
            Fill out the invoice information and add your line items.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Job</label>
            {!createNewJob ? (
              <select
                className="w-full p-2 border rounded text-sm"
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
            <Button
              variant="link"
              className="text-xs mt-1 px-0 text-muted-foreground"
              onClick={() => setCreateNewJob(!createNewJob)}
            >
              {createNewJob ? 'Select existing job' : 'Create new job'}
            </Button>
          </div>
        </div>

        <div className="border rounded-md p-4 bg-muted space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Line Items</h3>

          {items.map((item, idx) => {
            const isCustom = item.description === 'Custom Service';

            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="text-xs mb-1 block">Service</label>
                  <select
                    className="w-full border p-2 text-sm"
                    value={isCustom ? 'Custom Service' : item.description}
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
                      placeholder="Custom service name"
                      value={item.description === 'Custom Service' ? '' : item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs mb-1 block">
                    {item.billingType === 'unit'
                      ? item.rateLabel || 'Units'
                      : item.billingType === 'hourly'
                      ? 'Hours'
                      : 'Qty'}
                  </label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block">Unit Price</label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                  />
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="secondary"
            onClick={handleAddItem}
            className="text-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Line Item
          </Button>
        </div>

        <div className="flex justify-between items-center pt-4 font-medium text-sm">
          <span className="text-muted-foreground">Total</span>
          <span>${calculateTotal()}</span>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Create Invoice'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
