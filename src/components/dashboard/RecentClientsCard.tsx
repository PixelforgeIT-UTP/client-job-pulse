
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Mock data for recent clients
const recentClients = [
  { id: 1, name: "Acme Corporation", email: "contact@acme.com", jobs: 3, status: "active" },
  { id: 2, name: "Globex Industries", email: "info@globex.com", jobs: 1, status: "new" },
  { id: 3, name: "Wayne Enterprises", email: "business@wayne.com", jobs: 5, status: "active" },
  { id: 4, name: "Stark Industries", email: "hello@stark.com", jobs: 2, status: "active" },
];

export default function RecentClientsCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Recent Clients</CardTitle>
          <CardDescription>Your newest client relationships</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/clients">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentClients.map((client) => (
            <div key={client.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{client.jobs} jobs</span>
                <Badge variant={client.status === 'new' ? "secondary" : "default"}>
                  {client.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
