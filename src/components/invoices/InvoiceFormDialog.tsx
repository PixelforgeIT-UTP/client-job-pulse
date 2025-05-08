import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function InvoiceFormDialog({ isOpen, onClose, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase.from('jobs').select('id, title');
      if (error) {
        toast({ title: 'Error fetching jobs', description: error.message, variant: 'destructive' });
      } else {
        setJobs(data || []);
      }
    };

    if (isOpen) fetchJobs();
  }, [isOpen, toast]);

  const handleSubmit = async () => {
    if (!selectedJobId || !amount || !dueDate) {
      toast({ title: 'Validation error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('invoices').insert([
      {
        job_id: selectedJobId,
        amount: parseFloat(amount),
        due_date: dueDate,
        paid: false
      }
    ]);

    setSubmitting(false);

    if (error) {
      toast({ title: 'Error creating invoice', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Invoice created' });
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="block mb-1">Job</span>
            <select
              className="w-full border p-2 rounded"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              <option value="">Select a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block mb-1">Amount</span>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>

          <label className="block">
            <span className="block mb-1">Due Date</span>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>

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
