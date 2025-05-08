
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash, Plus } from 'lucide-react';

export function EditInvoiceDialog({ isOpen, onClose, invoice, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (invoice) {
      setDueDate(invoice.due_date?.split('T')[0] || '');
      setItems(invoice.items || []);
    }
  }, [invoice]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = field === 'quantity' || field === 'unit_price' ? Number(value) : value;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    // Update invoice base fields
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        due_date: dueDate,
        amount: Number(calculateTotal())
      })
      .eq('id', invoice.id);

    if (updateError) {
      toast({ title: 'Error updating invoice', description: updateError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Delete existing line items
    await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);

    // Reinsert updated line items
    const updatedItems = items.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const { error: itemError } = await supabase.from('invoice_items').insert(updatedItems);

    if (itemError) {
      toast({ title: 'Error saving items', description: itemError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Invoice updated successfully' });
      onSuccess();
      onClose();
    }

    setSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="block mb-1">Due Date</span>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-sm">Description</label>
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm">Qty</label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm">Unit Price</label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                  />
                </div>
                <div>
                  <Button variant="destructive" onClick={() => handleRemoveItem(idx)}>
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddItem} className="mt-2">
              <Plus className="mr-1 w-4 h-4" /> Add Line Item
            </Button>
          </div>

          <div className="flex justify-between font-medium text-right pt-4">
            <span>Total:</span>
            <span>${calculateTotal()}</span>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Update Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
