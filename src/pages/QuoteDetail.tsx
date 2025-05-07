import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signatureType, setSignatureType] = useState<'draw' | 'text'>('draw');
  const [textSignature, setTextSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setQuote(data);
      }
      setLoading(false);
    };

    if (id) fetchQuote();
  }, [id]);

  const approveOrReject = async (status: 'approved' | 'rejected') => {
    setSubmitting(true);

    let signatureData = null;
    if (signatureType === 'draw') {
      signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    } else {
      signatureData = textSignature;
    }

    const { error } = await supabase
      .from('quotes')
      .update({ status, signature: signatureData })
      .eq('id', id);

    setSubmitting(false);

    if (!error) {
      navigate('/quotes');
    } else {
      alert('Error updating quote.');
      console.error(error);
    }
  };

  if (loading) return <div className="p-6">Loading quote...</div>;
  if (!quote) return <div className="p-6">Quote not found.</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Quote Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p><strong>Client:</strong> {quote.client_name}</p>
          <p><strong>Job:</strong> {quote.job_description}</p>
          <p><strong>Total:</strong> ${quote.amount}</p>
          <p><strong>Status:</strong> {quote.status}</p>
          <p><strong>Date:</strong> {new Date(quote.date).toLocaleDateString()}</p>
          <div>
            <strong>Items:</strong>
            <ul className="list-disc ml-6">
              {quote.items?.map((item: any, index: number) => (
                <li key={index}>{item.name} - ${item.price}</li>
              ))}
            </ul>
          </div>

          {quote.status === 'pending' && (
            <>
              <div className="space-y-2">
                <div className="flex gap-4">
                  <Button
                    variant={signatureType === 'draw' ? 'default' : 'outline'}
                    onClick={() => setSignatureType('draw')}
                  >
                    Draw Signature
                  </Button>
                  <Button
                    variant={signatureType === 'text' ? 'default' : 'outline'}
                    onClick={() => setSignatureType('text')}
                  >
                    Text Signature
                  </Button>
                </div>

                {signatureType === 'draw' && (
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ className: "border w-full h-32 rounded" }}
                  />
                )}

                {signatureType === 'text' && (
                  <input
                    type="text"
                    className="border p-2 w-full rounded"
                    placeholder="Type your name"
                    value={textSignature}
                    onChange={(e) => setTextSignature(e.target.value)}
                  />
                )}
              </div>

              <div className="flex gap-4 mt-4">
                <Button
                  onClick={() => approveOrReject('approved')}
                  disabled={submitting}
                >
                  Approve Quote
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => approveOrReject('rejected')}
                  disabled={submitting}
                >
                  Reject Quote
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
