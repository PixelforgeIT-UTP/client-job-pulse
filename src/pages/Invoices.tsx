import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';
import { InvoiceFormDialog } from '@/components/invoices/InvoiceFormDialog';

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        amount,
        paid,
        due_date,
        jobs (
          client_name,
          job_description
        )
      `)
      .order('due_date', { ascending: true });

    console.log("📦 Supabase Invoices Response:", data);
    if (error) {
      console.error("❌ Supabase Error:", error);
    }

    if (data) {
      setInvoices(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const client = invoice.jobs?.client_name || '';
    const job = invoice.jobs?.job_description || '';
    return (
      client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusFromInvoice = (invoice: any) => {
    if (invoice.paid) return 'paid';
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    return dueDate < today ? 'overdue' : 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage your client invoices</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>View and manage your invoices</CardDescription>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search invoices..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.jobs?.client_name || '—'}
                      </TableCell>
                      <TableCell>{invoice.jobs?.job_description || '—'}</TableCell>
                      <TableCell>${Number(invoice.amount).toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(getStatusFromInvoice(invoice))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InvoiceFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={fetchInvoices}
      />
    </div>
  );
}
