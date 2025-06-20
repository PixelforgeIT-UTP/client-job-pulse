
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess: () => void;
}

export function SignatureDialog({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: SignatureDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSubmit = async () => {
    if (signatureRef.current?.isEmpty()) {
      toast({ title: 'Please provide a signature', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    const signatureData = signatureRef.current?.toDataURL();

    const { error } = await supabase
      .from('invoices')
      .update({
        signature_data: signatureData,
        status: 'approved',
      })
      .eq('id', invoice.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ 
        title: 'Signature collected! Job will be automatically created.',
        description: 'The invoice is now approved and a job has been generated.'
      });
      onSuccess();
      onClose();
    }

    setSubmitting(false);
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Client Signature Required</DialogTitle>
          <DialogDescription>
            Please have the client review and sign the invoice before starting work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Summary */}
          <div className="border rounded-md p-4 bg-muted space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Invoice Summary</h3>
              <Badge variant="outline">{invoice.status?.replace('_', ' ').toUpperCase()}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Customer:</span> {invoice.customer_name}</div>
              <div><span className="font-medium">Job Date:</span> {new Date(invoice.job_date).toLocaleDateString()}</div>
              <div className="col-span-2"><span className="font-medium">Address:</span> {invoice.customer_address}</div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Total Amount:</span>
              <span className="text-lg font-bold">${Number(invoice.amount).toFixed(2)}</span>
            </div>

            {invoice.supervisor_notes && (
              <div className="pt-2 border-t">
                <span className="font-medium text-sm">Supervisor Notes:</span>
                <p className="text-sm text-muted-foreground mt-1">{invoice.supervisor_notes}</p>
              </div>
            )}
          </div>

          {/* Signature Pad */}
          <div className="border rounded-md p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Client Signature</h3>
              <Button variant="outline" size="sm" onClick={clearSignature}>
                Clear Signature
              </Button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: 600,
                  height: 200,
                  className: 'signature-canvas w-full',
                }}
                backgroundColor="white"
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              Please have the customer sign above to authorize the work and confirm the invoice details.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Signature & Create Job'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
