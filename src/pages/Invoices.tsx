
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Plus, Search, Trash, CheckCircle, FileSignature, Eye } from 'lucide-react';
import { InvoiceFormDialog } from '@/components/invoices/InvoiceFormDialog';
import { SupervisorApprovalDialog } from '@/components/invoices/SupervisorApprovalDialog';
import { SignatureDialog } from '@/components/invoices/SignatureDialog';

export default function Invoices() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [supervisorApprovalInvoice, setSupervisorApprovalInvoice] = useState<any | null>(null);
  const [signatureInvoice, setSignatureInvoice] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      // Get user role
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        if (data) setUserRole(data.role);
      });
    }
  }, [user]);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        customer_name,
        customer_address,
        customer_phone,
        customer_email,
        job_date,
        amount,
        status,
        signature_data,
        supervisor_notes,
        reviewed_at,
        due_date,
        created_at,
        items:invoice_items (
          description,
          quantity,
          unit_price
        )
      `)
      .order('created_at', { ascending: false });

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
    const customerName = invoice.customer_name || '';
    return customerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_supervisor_approval':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Pending Supervisor</Badge>;
      case 'pending_client_signature':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Awaiting Signature</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
    if (!error) fetchInvoices();
  };

  const canCreateInvoice = userRole === 'tech' || userRole === 'admin';
  const canApproveInvoices = userRole === 'admin' || userRole === 'supervisor';
  const canDeleteInvoices = userRole === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            {canCreateInvoice && "Create invoices for customer approval"}
            {canApproveInvoices && "Review and approve technician invoices"}
            {!canCreateInvoice && !canApproveInvoices && "View invoice status"}
          </p>
        </div>
        {canCreateInvoice && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Invoice Workflow</CardTitle>
              <CardDescription>Track invoices through the approval process</CardDescription>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by customer name..."
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Job Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
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
                        <div>
                          <div>{invoice.customer_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {invoice.customer_address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.job_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>${Number(invoice.amount).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Supervisor Approval Action */}
                          {canApproveInvoices && invoice.status === 'pending_supervisor_approval' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSupervisorApprovalInvoice(invoice)}
                              title="Review & Approve"
                            >
                              <CheckCircle className="w-4 h-4 text-orange-600" />
                            </Button>
                          )}
                          
                          {/* Signature Collection Action */}
                          {canCreateInvoice && invoice.status === 'pending_client_signature' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSignatureInvoice(invoice)}
                              title="Collect Signature"
                            >
                              <FileSignature className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          
                          {/* View Details Action */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              // You could implement a view-only dialog here
                              console.log('View invoice details:', invoice);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {/* Delete Action (Admin only) */}
                          {canDeleteInvoices && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteInvoice(invoice.id)}
                              title="Delete"
                            >
                              <Trash className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
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

      {/* Dialogs */}
      <InvoiceFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={fetchInvoices}
      />

      <SupervisorApprovalDialog
        isOpen={!!supervisorApprovalInvoice}
        invoice={supervisorApprovalInvoice}
        onClose={() => setSupervisorApprovalInvoice(null)}
        onSuccess={fetchInvoices}
      />

      <SignatureDialog
        isOpen={!!signatureInvoice}
        invoice={signatureInvoice}
        onClose={() => setSignatureInvoice(null)}
        onSuccess={fetchInvoices}
      />
    </div>
  );
}
