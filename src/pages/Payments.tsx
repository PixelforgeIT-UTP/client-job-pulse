
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
import { Search } from 'lucide-react';
import { PaymentReceiptDialog } from '@/components/payments/PaymentReceiptDialog';

// Mock payment data
const payments = [
  { id: 1, client: "Acme Corporation", invoice: "INV-001", amount: "$5,200", date: "May 10, 2025", method: "Credit Card" },
  { id: 2, client: "Globex Industries", invoice: "INV-002", amount: "$750", date: "May 12, 2025", method: "Bank Transfer" },
  { id: 3, client: "Wayne Enterprises", invoice: "INV-003", amount: "$1,200", date: "May 15, 2025", method: "Check" },
  { id: 4, client: "Stark Industries", invoice: "INV-004", amount: "$3,800", date: "May 18, 2025", method: "Credit Card" },
  { id: 5, client: "Umbrella Corporation", invoice: "INV-005", amount: "$12,500", date: "May 20, 2025", method: "Bank Transfer" },
];

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => 
    payment.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.invoice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleViewReceipt(payment: any) {
    setSelectedPayment(payment);
    setIsReceiptDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Track and manage client payments</p>
        </div>
        <Button>
          Record Payment
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View all payment transactions</CardDescription>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search payments..."
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.client}</TableCell>
                    <TableCell>{payment.invoice}</TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell className="hidden md:table-cell">{payment.date}</TableCell>
                    <TableCell className="hidden md:table-cell">{payment.method}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewReceipt(payment)}
                      >
                        Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No payments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PaymentReceiptDialog
        isOpen={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
        payment={selectedPayment}
      />
    </div>
  );
}
