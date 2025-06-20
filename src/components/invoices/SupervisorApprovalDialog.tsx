
import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SupervisorApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess: () => void;
}

export function SupervisorApprovalDialog({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: SupervisorApprovalDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(invoice?.amount || 0);
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    setSubmitting(true);

    const { error } = await supabase
      .from('invoices')
      .update({
        amount: Number(amount),
        supervisor_notes: supervisorNotes,
        status: 'pending_client_signature',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Invoice approved and sent back to tech for client signature' });
      onSuccess();
      onClose();
    }

    setSubmitting(false);
  };

  const handleReject = async () => {
    if (!supervisorNotes.trim()) {
      toast({ title: 'Please provide notes for rejection', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('invoices')
      .update({
        supervisor_notes: supervisorNotes,
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Invoice rejected and returned to tech' });
      onSuccess();
      onClose();
    }

    setSubmitting(false);
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supervisor Review - Invoice #{invoice.id?.slice(-8)}</DialogTitle>
          <DialogDescription>
            Review and approve the invoice details. You can adjust the total amount and add notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="border rounded-md p-4 bg-muted space-y-3">
            <h3 className="font-medium">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {invoice.customer_name}
              </div>
              <div>
                <span className="font-medium">Job Date:</span> {new Date(invoice.job_date).toLocaleDateString()}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Address:</span> {invoice.customer_address}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {invoice.customer_phone || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {invoice.customer_email || 'N/A'}
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="border rounded-md p-4 bg-muted space-y-3">
            <h3 className="font-medium">Services</h3>
            <div className="space-y-2">
              {invoice.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <span className="font-medium">{item.description}</span>
                    <span className="text-muted-foreground ml-2">
                      ({item.quantity} × ${item.unit_price})
                    </span>
                  </div>
                  <span>${(item.quantity * item.unit_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Adjustment */}
          <div className="border rounded-md p-4 bg-yellow-50 space-y-3">
            <h3 className="font-medium">Cost Review</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Original Total</label>
                <div className="p-2 bg-gray-100 rounded">
                  ${Number(invoice.amount).toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Approved Total</label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">Supervisor Notes</label>
              <Textarea
                value={supervisorNotes}
                onChange={(e) => setSupervisorNotes(e.target.value)}
                placeholder="Add notes about cost adjustments, approvals, or rejection reasons..."
                rows={3}
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge variant="outline">{invoice.status?.replace('_', ' ').toUpperCase()}</Badge>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={submitting}
          >
            {submitting ? 'Rejecting...' : 'Reject'}
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={submitting}
          >
            {submitting ? 'Approving...' : 'Approve & Send for Signature'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
