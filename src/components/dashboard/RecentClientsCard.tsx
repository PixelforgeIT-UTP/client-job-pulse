
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";

// Mock data for recent clients
const recentClients = [
  {
    id: 1,
    name: "Acme Corporation",
    email: "contact@acme.com",
    date: "Added May 28, 2025"
  },
  {
    id: 2,
    name: "Globex Industries",
    email: "info@globex.com",
    date: "Added May 25, 2025"
  },
  {
    id: 3,
    name: "Wayne Enterprises",
    email: "business@wayne.com",
    date: "Added May 20, 2025"
  }
];

export default function RecentClientsCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Recent Clients</CardTitle>
        <CardDescription>New clients added in the last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentClients.map((client) => (
          <div key={client.id} className="flex items-start space-x-4 rounded-md border p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {client.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <Link to="/clients" className="font-medium hover:underline">{client.name}</Link>
              <div className="text-sm text-muted-foreground">{client.email}</div>
              <div className="text-xs text-muted-foreground">{client.date}</div>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/clients">View All Clients</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
