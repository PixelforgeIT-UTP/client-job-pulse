import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Plus, Search, Trash, CheckCircle, Pencil } from 'lucide-react';
import { InvoiceFormDialog } from '@/components/invoices/InvoiceFormDialog';
import { EditInvoiceDialog } from '@/components/invoices/EditInvoiceDialog';

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<any | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        amount,
        paid,
        due_date,
        job:jobs (
          title
        ),
        items:invoice_items (
          description,
          quantity,
          unit_price
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

  const filteredInvoices = invoices.filter((invoice) => {
    const title = invoice.job?.title || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
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
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Pending
          </Badge>
        );
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>;
      default:
        return null;
    }
  };

  const markAsPaid = async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ paid: true })
      .eq('id', invoiceId);
    if (!error) fetchInvoices();
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
    if (!error) fetchInvoices();
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
                placeholder="Search by job title..."
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
                  <TableHead>Job</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <>
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.job?.title || '—'}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(getStatusFromInvoice(invoice))}</TableCell>
                        <TableCell>${Number(invoice.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!invoice.paid && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => markAsPaid(invoice.id)}
                                title="Mark as Paid"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditInvoice(invoice)}
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteInvoice(invoice.id)}
                              title="Delete"
                            >
                              <Trash className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {invoice.items?.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div className="border rounded p-2 bg-muted space-y-2">
                              <p className="font-semibold">Line Items</p>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead>Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {invoice.items.map((item, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{item.description}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                                      <TableCell>
                                        ${(item.quantity * item.unit_price).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <InvoiceFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={fetchInvoices}
      />

      <EditInvoiceDialog
        isOpen={!!editInvoice}
        invoice={editInvoice}
        onClose={() => setEditInvoice(null)}
        onSuccess={fetchInvoices}
      />
    </div>
  );
}
