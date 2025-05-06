
import { useState } from 'react';
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

// Mock invoice data
const invoices = [
  { id: 1, client: "Acme Corporation", job: "Kitchen Renovation", amount: "$5,200", dueDate: "June 15, 2025", status: "paid" },
  { id: 2, client: "Globex Industries", job: "Electrical Inspection", amount: "$750", dueDate: "June 18, 2025", status: "pending" },
  { id: 3, client: "Wayne Enterprises", job: "Plumbing Repair", amount: "$1,200", dueDate: "June 20, 2025", status: "overdue" },
  { id: 4, client: "Stark Industries", job: "HVAC Installation", amount: "$3,800", dueDate: "June 22, 2025", status: "pending" },
  { id: 5, client: "Umbrella Corporation", job: "Office Remodel", amount: "$12,500", dueDate: "June 25, 2025", status: "paid" },
];

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice => 
    invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.job.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Button>
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
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.client}</TableCell>
                    <TableCell>{invoice.job}</TableCell>
                    <TableCell>{invoice.amount}</TableCell>
                    <TableCell className="hidden md:table-cell">{invoice.dueDate}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredInvoices.length === 0 && (
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
    </div>
  );
}
