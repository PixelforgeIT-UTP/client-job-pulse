
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2, Plus, User, Clock } from "lucide-react";

type JobNote = {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  user_profile?: {
    full_name: string | null;
    role: string | null;
  };
};

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
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
      fetchCurrentUser();
    }
  }, [isOpen, jobId]);

  const fetchCurrentUser = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user?.id) {
        setCurrentUserId(user.user.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.user.id)
          .single();
        
        setUserRole(profile?.role || null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_notes')
        .select(`
          id,
          content,
          created_at,
          created_by
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each note
      const notesWithProfiles = await Promise.all(
        (data || []).map(async (note) => {
          try {
            const { data: profile } = await supabase
              .rpc('get_user_profile', { user_id: note.created_by });
            
            return {
              ...note,
              user_profile: profile?.[0] || { full_name: 'Unknown User', role: 'user' }
            };
          } catch (error) {
            console.error('Error fetching profile for note:', error);
            return {
              ...note,
              user_profile: { full_name: 'Unknown User', role: 'user' }
            };
          }
        })
      );

      setNotes(notesWithProfiles);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('job_notes')
        .insert({
          job_id: jobId,
          content: newNote,
          created_by: currentUserId,
        });
      
      if (error) throw error;
      
      toast.success('Note added successfully');
      setNewNote('');
      fetchNotes(); // Refresh the notes list
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('job_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
      
      toast.success('Note deleted successfully');
      fetchNotes(); // Refresh the notes list
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy at h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Job Notes</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Legacy notes from job.notes field */}
          {currentNotes && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-amber-700 border-amber-300">
                    Legacy Note
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : notes.length > 0 ? (
              notes.map((note) => (
                <Card key={note.id} className="border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {note.user_profile?.full_name || 'Unknown User'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {note.user_profile?.role || 'user'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatDate(note.created_at)}
                        </div>
                        {userRole === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 text-gray-500">
                No notes yet. Add the first note below.
              </div>
            )}
          </div>

          {/* Add new note */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add New Note</span>
            </div>
            <Textarea
              placeholder="Enter your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={handleAddNote} 
                disabled={isSaving || !newNote.trim()}
              >
                {isSaving ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
