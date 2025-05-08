
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type JobNotesDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  currentNotes: string | null;
};

export function JobNotesDialog({ 
  isOpen, 
  onClose, 
  jobId, 
  currentNotes 
}: JobNotesDialogProps) {
  const [notes, setNotes] = useState(currentNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ notes })
        .eq('id', jobId);
      
      if (error) throw error;
      
      toast.success('Notes saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
    
    // Use Promise.then().finally() pattern instead of just .finally()
    // This fixes the TypeScript error
    Promise.resolve().then(() => {
      setIsSaving(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Job Notes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Enter notes about this job..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={10}
            className="resize-none"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
