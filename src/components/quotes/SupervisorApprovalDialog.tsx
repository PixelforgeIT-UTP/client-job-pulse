
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface SupervisorApprovalDialogProps {
  quote: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function SupervisorApprovalDialog({
  quote,
  open,
  onOpenChange,
  onSuccess,
}: SupervisorApprovalDialogProps) {
  const [amount, setAmount] = useState(quote?.amount || 0);
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showLocalNotification } = usePushNotifications();

  const handleApprove = async () => {
    setSubmitting(true);

    const { error } = await supabase
      .from('quotes')
      .update({
        amount: parseFloat(amount.toString()),
        supervisor_notes: supervisorNotes,
        status: 'pending_client_signature',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', quote.id);

    if (!error) {
      // Send notification to the quote creator
      try {
        const { error: notificationError } = await supabase.functions.invoke('send-push-notification', {
          body: {
            userIds: [quote.created_by],
            title: 'Quote Approved',
            body: `Quote #${quote.id.slice(-8)} has been approved and is ready for client signature`,
            data: {
              type: 'quote_approved',
              quoteId: quote.id,
              url: `/quotes/${quote.id}`
            }
          }
        });

        if (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }

        // Also show local notification
        showLocalNotification({
          title: 'Quote Approved',
          body: `Quote #${quote.id.slice(-8)} has been approved and is ready for client signature`,
          data: {
            type: 'quote_approved',
            quoteId: quote.id,
            url: `/quotes/${quote.id}`
          }
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }

      onSuccess();
      onOpenChange(false);
    } else {
      alert('Error approving quote. Check console.');
      console.error(error);
    }

    setSubmitting(false);
  };

  const handleReject = async () => {
    setSubmitting(true);

    const { error } = await supabase
      .from('quotes')
      .update({
        supervisor_notes: supervisorNotes,
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', quote.id);

    setSubmitting(false);

    if (!error) {
      onSuccess();
      onOpenChange(false);
    } else {
      alert('Error rejecting quote. Check console.');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Supervisor Approval - Quote #{quote?.id?.slice(-8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
            <div>
              <strong>Client:</strong> {quote?.client_name}
            </div>
            <div>
              <strong>Job Date:</strong> {quote?.job_date ? new Date(quote.job_date).toLocaleDateString() : 'N/A'}
            </div>
            <div className="col-span-2">
              <strong>Address:</strong> {quote?.customer_address}
            </div>
            <div>
              <strong>Phone:</strong> {quote?.customer_phone || 'N/A'}
            </div>
            <div>
              <strong>Email:</strong> {quote?.customer_email || 'N/A'}
            </div>
          </div>

          <div>
            <strong>Services:</strong>
            <ul className="list-disc ml-6 mt-2">
              {quote?.items?.map((item: any, index: number) => (
                <li key={index}>{item.name} - ${item.price}</li>
              ))}
            </ul>
          </div>

          <div>
            <Label htmlFor="amount">Final Quote Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter final quote amount"
            />
          </div>

          <div>
            <Label htmlFor="notes">Supervisor Notes</Label>
            <Textarea
              id="notes"
              value={supervisorNotes}
              onChange={(e) => setSupervisorNotes(e.target.value)}
              placeholder="Add any notes about pricing adjustments or special considerations..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={submitting}
          >
            Reject Quote
          </Button>
          <Button
            onClick={handleApprove}
            disabled={submitting || !amount}
          >
            {submitting ? 'Processing...' : 'Approve & Send for Signature'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
