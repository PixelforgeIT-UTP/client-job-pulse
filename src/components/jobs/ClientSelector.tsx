
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';

interface ClientSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ClientSelector({ value, onChange }: ClientSelectorProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={isLoading ? "opacity-50" : ""} disabled={isLoading}>
        <SelectValue placeholder="Select a client" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>Loading clients...</SelectItem>
        ) : clients.length > 0 ? (
          <SelectGroup>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : (
          <SelectItem value="empty" disabled>No clients found</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
