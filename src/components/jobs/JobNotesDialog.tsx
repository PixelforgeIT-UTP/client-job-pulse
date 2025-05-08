import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function JobNotesDialog({ isOpen, onClose, job, onUpdate }: {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onUpdate?: () => void;
}) {
  const { toast } = useToast();
  const [notes, setNotes] = useState(job.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('jobs').update({ notes }).eq('id', job.id);
    if (error) {
      toast({
        title: 'Error saving notes',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Notes updated' });
      if (onUpdate) onUpdate();
      onClose();
    }
    setSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg space-y-4">
        <DialogHeader>
          <DialogTitle>Job Notes</DialogTitle>
        </DialogHeader>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Enter or edit notes for this job..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
