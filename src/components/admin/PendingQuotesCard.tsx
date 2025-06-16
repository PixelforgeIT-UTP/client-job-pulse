
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Check, X } from 'lucide-react';
import { format } from 'date-fns';

type PendingQuote = {
  id: string;
  client_name: string;
  job_description: string;
  amount: number;
  status: string;
  date: string;
  created_by_name: string;
};

export function PendingQuotesCard() {
  const [pendingQuotes, setPendingQuotes] = useState<PendingQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingQuotes();
  }, []);

  const fetchPendingQuotes = async () => {
    setIsLoading(true);
    try {
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('status', 'pending')
        .order('date', { ascending: false });

      if (error) throw error;

      const quotesWithProfiles = await Promise.all(
        (quotes || []).map(async (quote: any) => {
          let createdByName = 'Unknown User';
          if (quote.created_by) {
            try {
              const { data: profile } = await supabase
                .rpc('get_user_profile', { user_id: quote.created_by });
              createdByName = profile?.[0]?.full_name || 'Unknown User';
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
          }

          return {
            id: quote.id,
            client_name: quote.client_name,
            job_description: quote.job_description || 'No description',
            amount: quote.amount,
            status: quote.status,
            date: quote.date,
            created_by_name: createdByName
          };
        })
      );

      setPendingQuotes(quotesWithProfiles);
    } catch (error) {
      console.error('Error fetching pending quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuoteApproval = async (quoteId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', quoteId);

      if (error) throw error;

      fetchPendingQuotes(); // Refresh the list
    } catch (error) {
      console.error('Error updating quote status:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotes Pending Approval</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingQuotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">{quote.client_name}</TableCell>
                <TableCell className="max-w-md">
                  <div className="truncate" title={quote.job_description}>
                    {quote.job_description}
                  </div>
                </TableCell>
                <TableCell>${quote.amount.toFixed(2)}</TableCell>
                <TableCell>{quote.created_by_name}</TableCell>
                <TableCell>{format(new Date(quote.date), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleQuoteApproval(quote.id, 'approved')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleQuoteApproval(quote.id, 'rejected')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
