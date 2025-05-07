import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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

export default function RecentClientsCard() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentClients = async () => {
      setLoading(true);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching recent clients:", error);
      } else {
        setClients(data || []);
      }

      setLoading(false);
    };

    fetchRecentClients();
  }, []);

  const formatDate = (iso: string) => {
    return "Added " + new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Recent Clients</CardTitle>
        <CardDescription>New clients added in the last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : clients.length > 0 ? (
          clients.map((client) => (
            <div key={client.id} className="flex items-start space-x-4 rounded-md border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {client.name?.charAt(0)}
              </div>
              <div className="space-y-1">
                <Link to="/clients" className="font-medium hover:underline">
                  {client.name}
                </Link>
                <div className="text-sm text-muted-foreground">{client.email}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(client.created_at)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No recent clients found.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/clients">View All Clients</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
