
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

// Mock quote data
const quotes = [
  { id: 1, client: "Acme Corporation", job: "Kitchen Renovation", amount: "$5,200", date: "May 15, 2025", status: "pending" },
  { id: 2, client: "Globex Industries", job: "Electrical Inspection", amount: "$750", date: "May 18, 2025", status: "approved" },
  { id: 3, client: "Wayne Enterprises", job: "Plumbing Repair", amount: "$1,200", date: "May 20, 2025", status: "pending" },
  { id: 4, client: "Stark Industries", job: "HVAC Installation", amount: "$3,800", date: "May 22, 2025", status: "rejected" },
  { id: 5, client: "Umbrella Corporation", job: "Office Remodel", amount: "$12,500", date: "May 25, 2025", status: "approved" },
];

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter quotes based on search term
  const filteredQuotes = quotes.filter(quote => 
    quote.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.job.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-500 border-red-500">Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">Manage your client quotes</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Quote
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Quote Management</CardTitle>
              <CardDescription>View and manage your quotes</CardDescription>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search quotes..."
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
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.client}</TableCell>
                    <TableCell>{quote.job}</TableCell>
                    <TableCell>{quote.amount}</TableCell>
                    <TableCell className="hidden md:table-cell">{quote.date}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredQuotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No quotes found
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
