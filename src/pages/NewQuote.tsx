
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
import { Textarea } from '@/components/ui/textarea';

const services = [
  { name: 'Kitchen Renovation', price: 5200 },
  { name: 'Electrical Inspection', price: 750 },
  { name: 'Plumbing Repair', price: 1200 },
  { name: 'HVAC Installation', price: 3800 },
  { name: 'Office Remodel', price: 12500 },
];

export default function NewQuote() {
  const [clientName, setClientName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [jobDate, setJobDate] = useState('');
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
    if (!clientName || !customerAddress || !jobDate || selectedServices.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);

    const selectedItems = services.filter((s) =>
      selectedServices.includes(s.name)
    );

    const jobDescription = selectedItems.map((s) => s.name).join(', ');
    const amount = getTotal();

    const { error } = await supabase.from('quotes').insert([
      {
        client_name: clientName,
        customer_address: customerAddress,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        job_date: jobDate,
        job_description: jobDescription,
        amount,
        status: 'pending_supervisor_approval',
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

  const isFormValid = clientName && customerAddress && jobDate && selectedServices.length > 0;

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                required
              />
            </div>

            <div>
              <Label htmlFor="jobDate">Job Date *</Label>
              <Input
                id="jobDate"
                type="date"
                value={jobDate}
                onChange={(e) => setJobDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="customerAddress">Customer Address *</Label>
            <Textarea
              id="customerAddress"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Full customer address"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
          </div>

          <div>
            <Label>Services *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {services.map((service) => (
                <label
                  key={service.name}
                  className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedServices.includes(service.name)}
                    onCheckedChange={() => toggleService(service.name)}
                  />
                  <span className="flex-1">{service.name}</span>
                  <span className="font-medium">${service.price}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="text-right text-lg font-bold border-t pt-4">
            Total: ${getTotal().toLocaleString()}
          </div>

          <Button
            disabled={!isFormValid || submitting}
            onClick={handleSubmit}
            className="w-full"
          >
            {submitting ? 'Creating Quote...' : 'Create Quote'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
