
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash } from 'lucide-react';

export function InvoiceFormDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('');
  
  // Customer information
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [jobDate, setJobDate] = useState('');
  
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0, billingType: 'flat', rateLabel: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const predefinedServices = [
    { label: 'Raking', billingType: 'flat', rate: 100 },
    { label: 'Needle', billingType: 'flat', rate: 375 },
    { label: 'Trucks & Trailers on Site', billingType: 'hourly', rate: 250 },
    { label: 'Bobcat on Site', billingType: 'hourly', rate: 350 },
    { label: 'Roll off Bin', billingType: 'flat', rate: 1500 },
    { label: 'Grass Cutting', billingType: 'unit', rate: 2, unitLabel: 'sq ft' },
  ];

  useEffect(() => {
    if (isOpen && user) {
      // Get user role
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        if (data) setUserRole(data.role);
      });
    }
  }, [isOpen, user]);

  // Only allow techs to create invoices
  if (userRole && userRole !== 'tech') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              Only technicians can create invoices.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, billingType: 'flat', rateLabel: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const updated = [...items];
      updated.splice(index, 1);
      setItems(updated);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = field === 'quantity' || field === 'unit_price' ? Number(value) : value;
    setItems(updated);
  };

  const handleServiceSelect = (index: number, label: string) => {
    const updated = [...items];

    if (label === 'Custom Service') {
      updated[index] = {
        ...updated[index],
        description: 'Custom Service',
        unit_price: 0,
        billingType: 'flat',
        rateLabel: '',
      };
    } else {
      const match = predefinedServices.find((s) => s.label === label);
      if (match) {
        updated[index] = {
          ...updated[index],
          description: match.label,
          unit_price: match.rate,
          billingType: match.billingType,
          rateLabel: match.unitLabel || '',
        };
      }
    }

    setItems(updated);
  };

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2);

  const handleSubmit = async () => {
    if (!customerName || !customerAddress || !jobDate || items.length === 0) {
      toast({
        title: 'Validation error',
        description: 'Customer name, address, job date, and at least one service item are required.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    // Create invoice with workflow status
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{ 
        customer_name: customerName,
        customer_address: customerAddress,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        job_date: jobDate,
        amount: Number(calculateTotal()),
        status: 'pending_supervisor_approval'
      }])
      .select()
      .single();

    if (invoiceError) {
      toast({ title: 'Invoice error', description: invoiceError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    const lineItems = items.map((item) => ({
      invoice_id: invoiceData.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems);
    if (itemsError) {
      toast({ title: 'Items error', description: itemsError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    toast({ title: 'Invoice created and sent for supervisor approval' });
    setSubmitting(false);
    onClose();
    onSuccess();
    
    // Reset form
    setCustomerName('');
    setCustomerAddress('');
    setCustomerPhone('');
    setCustomerEmail('');
    setJobDate('');
    setItems([{ description: '', quantity: 1, unit_price: 0, billingType: 'flat', rateLabel: '' }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Invoice</DialogTitle>
          <DialogDescription>
            Fill out the customer information and itemized services. This will be sent to supervisor for approval.
          </DialogDescription>
        </DialogHeader>

        {/* Customer Information Section */}
        <div className="border rounded-md p-4 bg-muted space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Customer Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Customer Name *</label>
              <Input 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">Job Date *</label>
              <Input 
                type="date" 
                value={jobDate} 
                onChange={(e) => setJobDate(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Customer Address *</label>
            <Textarea 
              value={customerAddress} 
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Enter full customer address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Phone</label>
              <Input 
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Customer phone number"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <Input 
                type="email"
                value={customerEmail} 
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Customer email address"
              />
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="border rounded-md p-4 bg-muted space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Services</h3>

          {items.map((item, idx) => {
            const isCustom = item.description === 'Custom Service';

            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className="text-xs mb-1 block">Service</label>
                  <select
                    className="w-full border p-2 text-sm rounded"
                    value={isCustom ? 'Custom Service' : item.description}
                    onChange={(e) => handleServiceSelect(idx, e.target.value)}
                  >
                    <option value="">Choose a service</option>
                    {predefinedServices.map((service) => (
                      <option key={service.label} value={service.label}>
                        {service.label}
                      </option>
                    ))}
                    <option value="Custom Service">Custom Service</option>
                  </select>

                  {isCustom && (
                    <Input
                      placeholder="Custom service name"
                      value={item.description === 'Custom Service' ? '' : item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs mb-1 block">
                    {item.billingType === 'unit'
                      ? item.rateLabel || 'Units'
                      : item.billingType === 'hourly'
                      ? 'Hours'
                      : 'Qty'}
                  </label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block">Unit Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs mb-1 block">Total</label>
                  <div className="p-2 bg-gray-100 rounded text-sm">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="secondary"
            onClick={handleAddItem}
            className="text-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Service Item
          </Button>
        </div>

        <div className="flex justify-between items-center pt-4 font-medium text-lg border-t">
          <span>Total Amount</span>
          <span>${calculateTotal()}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
