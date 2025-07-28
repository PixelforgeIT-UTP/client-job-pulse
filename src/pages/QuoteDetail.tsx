
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SupervisorApprovalDialog from '@/components/quotes/SupervisorApprovalDialog';
import SignatureDialog from '@/components/quotes/SignatureDialog';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showSupervisorDialog, setShowSupervisorDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch quote
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (quoteError) {
        console.error(quoteError);
      } else {
        setQuote(quoteData);
      }

      // Fetch user role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setUserRole(profileData?.role || null);
      }

      setLoading(false);
    };

    if (id) fetchData();
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_supervisor_approval':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending Supervisor Approval</Badge>;
      case 'pending_client_signature':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Pending Client Signature</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-500 border-red-500">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const canSupervisorApprove = userRole === 'supervisor' || userRole === 'admin';
  const canCollectSignature = quote?.status === 'pending_client_signature';
  const showSupervisorApproval = quote?.status === 'pending_supervisor_approval' && canSupervisorApprove;

  const refreshQuote = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!error) {
      setQuote(data);
    }
  };

  if (loading) return <div className="p-6">Loading quote...</div>;
  if (!quote) return <div className="p-6">Quote not found.</div>;

  return (
    <div className="max-w-4xl mx-auto mt-4 sm:mt-8 space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Quote #{quote.id.slice(-8)}</h1>
        {getStatusBadge(quote.status)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <strong>Client:</strong> {quote.client_name}
            </div>
            <div>
              <strong>Job Date:</strong> {quote.job_date ? new Date(quote.job_date).toLocaleDateString() : 'N/A'}
            </div>
            <div className="sm:col-span-2">
              <strong>Address:</strong> {quote.customer_address}
            </div>
            <div>
              <strong>Phone:</strong> {quote.customer_phone || 'N/A'}
            </div>
            <div>
              <strong>Email:</strong> {quote.customer_email || 'N/A'}
            </div>
            <div>
              <strong>Amount:</strong> ${quote.amount}
            </div>
            <div>
              <strong>Created:</strong> {new Date(quote.date).toLocaleDateString()}
            </div>
          </div>

          <div>
            <strong>Services:</strong>
            <ul className="list-disc ml-6 mt-2">
              {quote.items?.map((item: any, index: number) => (
                <li key={index}>{item.name} - ${item.price}</li>
              ))}
            </ul>
          </div>

          {quote.supervisor_notes && (
            <div className="p-3 bg-blue-50 rounded">
              <strong>Supervisor Notes:</strong>
              <p className="mt-1">{quote.supervisor_notes}</p>
            </div>
          )}

          {quote.signature_data && (
            <div className="p-3 bg-green-50 rounded">
              <strong>Client Signature:</strong>
              <div className="mt-2">
                {quote.signature_data.startsWith('data:image') ? (
                  <img src={quote.signature_data} alt="Client Signature" className="border max-w-xs" />
                ) : (
                  <div className="italic font-signature text-lg">{quote.signature_data}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {showSupervisorApproval && (
          <Button onClick={() => setShowSupervisorDialog(true)}>
            Review & Approve Quote
          </Button>
        )}

        {canCollectSignature && (
          <Button onClick={() => setShowSignatureDialog(true)}>
            Get Client Signature
          </Button>
        )}

        <Button variant="outline" onClick={() => navigate('/quotes')}>
          Back to Quotes
        </Button>
      </div>

      <SupervisorApprovalDialog
        quote={quote}
        open={showSupervisorDialog}
        onOpenChange={setShowSupervisorDialog}
        onSuccess={refreshQuote}
      />

      <SignatureDialog
        quote={quote}
        open={showSignatureDialog}
        onOpenChange={setShowSignatureDialog}
        onSuccess={refreshQuote}
      />
    </div>
  );
}
