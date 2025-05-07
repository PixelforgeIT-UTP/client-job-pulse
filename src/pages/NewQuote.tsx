import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const services = [
  { name: 'Kitchen Renovation', price: 5200 },
  { name: 'Electrical Inspection', price: 750 },
  { name: 'Plumbing Repair', price: 1200 },
  { name: 'HVAC Installation', price: 3800 },
  { name: 'Office Remodel', price: 12500 },
];

export default function NewQuote() {
  const [clientName, setClientName] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const toggleService = (serviceName: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const getTotal = () => {
    return services
      .filter((s) => selectedServices.includes(s.name))
      .reduce((acc, s) => acc + s.price, 0);
  };

  const handleSubmit = async () => {
    if (!clientName || selectedServices.length === 0) return;
    setSubmitting(true);

    const selectedItems = services.filter((s) =>
      selectedServices.includes(s.name)
    );

    const jobDescription = selectedItems.map((s) => s.name).join(', ');
    const amount = getTotal();

    const { error } = await supabase.from('quotes').insert([
      {
        client_name: clientName,
        job_description: jobDescription,
        amount,
        status: 'pending',
        items: selectedItems,
      },
    ]);

    setSubmitting(false);

    if (!error) {
      navigate('/quotes');
    } else {
      alert('Error creating quote. Check console.');
      console.error(error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              required
            />
          </div>

          <div>
            <Label>Services</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <label
                  key={service.name}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedServices.includes(service.name)}
                    onCheckedChange={() => toggleService(service.name)}
                  />
                  {service.name} (${service.price})
                </label>
              ))}
            </div>
          </div>

          <div className="text-right text-lg font-bold">
            Total: ${getTotal()}
          </div>

          <Button
            disabled={!clientName || selectedServices.length === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting...' : 'Create Quote'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
