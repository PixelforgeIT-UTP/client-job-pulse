
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SignatureCanvas from 'react-signature-canvas';
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

interface SignatureDialogProps {
  quote: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function SignatureDialog({
  quote,
  open,
  onOpenChange,
  onSuccess,
}: SignatureDialogProps) {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [signatureType, setSignatureType] = useState<'draw' | 'text'>('draw');
  const [textSignature, setTextSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    let signatureData = null;
    
    if (signatureType === 'draw') {
      if (!sigCanvas.current?.isEmpty()) {
        signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
      }
    } else {
      signatureData = textSignature;
    }

    if (!signatureData) {
      alert('Please provide a signature before submitting');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('quotes')
      .update({
        signature_data: signatureData,
        status: 'approved',
      })
      .eq('id', quote.id);

    setSubmitting(false);

    if (!error) {
      onSuccess();
      onOpenChange(false);
    } else {
      alert('Error saving signature. Check console.');
      console.error(error);
    }
  };

  const clearSignature = () => {
    if (signatureType === 'draw') {
      sigCanvas.current?.clear();
    } else {
      setTextSignature('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Client Signature Required - Quote #{quote?.id?.slice(-8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Client:</strong> {quote?.client_name}
              </div>
              <div>
                <strong>Final Amount:</strong> ${quote?.amount}
              </div>
              <div>
                <strong>Job Date:</strong> {quote?.job_date ? new Date(quote.job_date).toLocaleDateString() : 'N/A'}
              </div>
              <div>
                <strong>Status:</strong> Ready for signature
              </div>
            </div>
            {quote?.supervisor_notes && (
              <div className="mt-2 pt-2 border-t">
                <strong>Supervisor Notes:</strong> {quote.supervisor_notes}
              </div>
            )}
          </div>

          <div>
            <Label>Signature Method</Label>
            <div className="flex gap-4 mt-2">
              <Button
                variant={signatureType === 'draw' ? 'default' : 'outline'}
                onClick={() => setSignatureType('draw')}
                size="sm"
              >
                Draw Signature
              </Button>
              <Button
                variant={signatureType === 'text' ? 'default' : 'outline'}
                onClick={() => setSignatureType('text')}
                size="sm"
              >
                Type Signature
              </Button>
            </div>
          </div>

          {signatureType === 'draw' && (
            <div>
              <Label>Draw your signature below:</Label>
              <div className="border-2 border-dashed border-gray-300 rounded mt-2">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{ 
                    className: "w-full h-32 rounded",
                    style: { width: '100%', height: '128px' }
                  }}
                />
              </div>
            </div>
          )}

          {signatureType === 'text' && (
            <div>
              <Label htmlFor="textSignature">Type your full name:</Label>
              <Input
                id="textSignature"
                value={textSignature}
                onChange={(e) => setTextSignature(e.target.value)}
                placeholder="Enter your full name as signature"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={clearSignature}>
            Clear Signature
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Processing...' : 'Submit Signature & Approve Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
