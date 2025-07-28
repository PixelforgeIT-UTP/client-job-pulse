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
import { Plus, X } from 'lucide-react';

const presetServices = [
  { name: 'Kitchen Renovation', price: 5200 },
  { name: 'Electrical Inspection', price: 750 },
  { name: 'Plumbing Repair', price: 1200 },
  { name: 'HVAC Installation', price: 3800 },
  { name: 'Office Remodel', price: 12500 },
];

type CustomItem = {
  id: string;
  name: string;
  price: number;
};

export default function NewQuote() {
  const [clientName, setClientName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [jobDate, setJobDate] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    } else if (clientName.length > 100) {
      newErrors.clientName = 'Client name must be less than 100 characters';
    }

    if (!customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!validateEmail(customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }

    if (!customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (!validatePhone(customerPhone)) {
      newErrors.customerPhone = 'Please enter a valid phone number';
    }

    if (!customerAddress.trim()) {
      newErrors.customerAddress = 'Address is required';
    } else if (customerAddress.length > 500) {
      newErrors.customerAddress = 'Address must be less than 500 characters';
    }

    if (!jobDate) {
      newErrors.jobDate = 'Job date is required';
    } else {
      const selectedDate = new Date(jobDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.jobDate = 'Job date cannot be in the past';
      }
    }

    const totalAmount = getTotal();
    if (totalAmount <= 0) {
      newErrors.services = 'Please select at least one service or add custom items';
    } else if (totalAmount > 1000000) {
      newErrors.services = 'Total amount cannot exceed $1,000,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleService = (serviceName: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const addCustomItem = () => {
    if (customItemName && customItemPrice) {
      const newItem: CustomItem = {
        id: Date.now().toString(),
        name: customItemName,
        price: parseFloat(customItemPrice) || 0,
      };
      setCustomItems([...customItems, newItem]);
      setCustomItemName('');
      setCustomItemPrice('');
    }
  };

  const removeCustomItem = (id: string) => {
    setCustomItems(customItems.filter(item => item.id !== id));
  };

  const getTotal = () => {
    const presetTotal = presetServices
      .filter((s) => selectedServices.includes(s.name))
      .reduce((acc, s) => acc + s.price, 0);
    
    const customTotal = customItems.reduce((acc, item) => acc + item.price, 0);
    
    return presetTotal + customTotal;
  };

  const findOrCreateCustomer = async (name: string, email: string, phone: string, address: string) => {
    // First, try to find existing customer by name and email
    const { data: existingCustomer, error: searchError } = await supabase
      .from('clients')
      .select('id')
      .or(`name.ilike.%${name}%,email.ilike.%${email}%`)
      .limit(1)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for customer:', searchError);
      return null;
    }

    if (existingCustomer) {
      console.log('Found existing customer:', existingCustomer.id);
      return existingCustomer.id;
    }

    // Create new customer
    const { data: newCustomer, error: createError } = await supabase
      .from('clients')
      .insert([{
        name: clientName,
        email: customerEmail || null,
        phone: customerPhone || null,
        address: customerAddress,
      }])
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating customer:', createError);
      return null;
    }

    console.log('Created new customer:', newCustomer.id);
    return newCustomer.id;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);

    try {
      // Find or create customer
      const customerId = await findOrCreateCustomer(
        clientName,
        customerEmail,
        customerPhone,
        customerAddress
      );

      const selectedPresetItems = presetServices.filter((s) =>
        selectedServices.includes(s.name)
      );

      const allItems = [...selectedPresetItems, ...customItems];
      const jobDescription = allItems.map((s) => s.name).join(', ');
      const amount = getTotal();

      const { data: newQuote, error } = await supabase.from('quotes').insert([
        {
          client_name: clientName,
          customer_id: customerId,
          customer_address: customerAddress,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          job_date: jobDate,
          job_description: jobDescription,
          amount,
          status: 'pending_supervisor_approval',
          items: allItems,
        },
      ]).select().single();

      if (error) {
        throw error;
      }

      // Trigger notification for supervisors
      if (newQuote) {
        try {
          const { data: supervisors } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['supervisor', 'admin']);

          if (supervisors && supervisors.length > 0) {
            const userIds = supervisors.map(s => s.id);

            await supabase.functions.invoke('send-push-notification', {
              body: {
                userIds,
                title: 'New Quote Requires Approval',
                body: `Quote #${newQuote.id.slice(-8)} from ${clientName} is awaiting supervisor approval`,
                data: {
                  type: 'quote_approval',
                  quoteId: newQuote.id,
                  url: `/quotes/${newQuote.id}`
                }
              }
            });
          }
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }
      }

      navigate('/quotes');
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error creating quote. Check console.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = clientName && customerAddress && jobDate && (selectedServices.length > 0 || customItems.length > 0);

  return (
    <div className="max-w-3xl mx-auto mt-4 sm:mt-8 px-4 sm:px-0">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Create New Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  if (errors.clientName) {
                    setErrors(prev => ({ ...prev, clientName: '' }));
                  }
                }}
                placeholder="e.g. Acme Corporation"
                required
                className={errors.clientName ? 'border-destructive' : ''}
              />
              {errors.clientName && (
                <p className="text-sm text-destructive mt-1">{errors.clientName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="jobDate">Job Date *</Label>
              <Input
                id="jobDate"
                type="date"
                value={jobDate}
                onChange={(e) => {
                  setJobDate(e.target.value);
                  if (errors.jobDate) {
                    setErrors(prev => ({ ...prev, jobDate: '' }));
                  }
                }}
                required
                className={errors.jobDate ? 'border-destructive' : ''}
              />
              {errors.jobDate && (
                <p className="text-sm text-destructive mt-1">{errors.jobDate}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="customerAddress">Customer Address *</Label>
            <Textarea
              id="customerAddress"
              value={customerAddress}
              onChange={(e) => {
                setCustomerAddress(e.target.value);
                if (errors.customerAddress) {
                  setErrors(prev => ({ ...prev, customerAddress: '' }));
                }
              }}
              placeholder="Full customer address"
              required
              className={errors.customerAddress ? 'border-destructive' : ''}
            />
            {errors.customerAddress && (
              <p className="text-sm text-destructive mt-1">{errors.customerAddress}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerPhone">Customer Phone *</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (errors.customerPhone) {
                    setErrors(prev => ({ ...prev, customerPhone: '' }));
                  }
                }}
                placeholder="(555) 123-4567"
                required
                className={errors.customerPhone ? 'border-destructive' : ''}
              />
              {errors.customerPhone && (
                <p className="text-sm text-destructive mt-1">{errors.customerPhone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customerEmail">Customer Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  if (errors.customerEmail) {
                    setErrors(prev => ({ ...prev, customerEmail: '' }));
                  }
                }}
                placeholder="customer@example.com"
                required
                className={errors.customerEmail ? 'border-destructive' : ''}
              />
              {errors.customerEmail && (
                <p className="text-sm text-destructive mt-1">{errors.customerEmail}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Preset Services</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {presetServices.map((service) => (
                <label
                  key={service.name}
                  className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedServices.includes(service.name)}
                    onCheckedChange={() => {
                      toggleService(service.name);
                      if (errors.services) {
                        setErrors(prev => ({ ...prev, services: '' }));
                      }
                    }}
                  />
                  <span className="flex-1">{service.name}</span>
                  <span className="font-medium">${service.price}</span>
                </label>
              ))}
            </div>
            {errors.services && (
              <p className="text-sm text-destructive mt-1">{errors.services}</p>
            )}
          </div>

          <div>
            <Label>Custom Line Items</Label>
            <div className="space-y-4 mt-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Service name"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="w-32"
                />
                <Button type="button" onClick={addCustomItem} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {customItems.length > 0 && (
                <div className="space-y-2">
                  {customItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1">{item.name}</span>
                      <span className="font-medium">${item.price}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
