import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface JobNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: { id: string; title: string };
  onUpdate?: () => void;
}

export function JobNotesDialog({
  isOpen,
  onClose,
  job,
  onUpdate,
}: JobNotesDialogProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!job?.id) return;
    setLoading(true);
    supabase
      .from('jobs')
      .select('notes')
      .eq('id', job.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setNotes(data.notes || '');
      })
      .finally(() => setLoading(false));
  }, [job]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('jobs')
      .update({ notes })
      .eq('id', job.id);

    if (error) {
      toast({
        title: 'Error saving notes',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Notes updated' });
      onUpdate?.();
      onClose();
    }
    setSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg space-y-4">
        <DialogHeader>
          <DialogTitle>Notes for "{job.title}"</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading notes...</p>
        ) : (
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Enter or edit notes for this job..."
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
