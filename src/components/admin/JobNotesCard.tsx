
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type JobNote = {
  id: string;
  job_title: string;
  client_name: string;
  content: string;
  created_by_name: string;
  created_at: string;
};

export function JobNotesCard() {
  const [jobNotes, setJobNotes] = useState<JobNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobNotes();
  }, []);

  const fetchJobNotes = async () => {
    setIsLoading(true);
    try {
      const { data: notes, error } = await supabase
        .from('job_notes')
        .select(`
          id,
          content,
          created_by,
          created_at,
          jobs (
            title,
            clients (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notesWithProfiles = await Promise.all(
        (notes || []).map(async (note: any) => {
          let createdByName = 'Unknown User';
          try {
            const { data: profile } = await supabase
              .rpc('get_user_profile', { user_id: note.created_by });
            createdByName = profile?.[0]?.full_name || 'Unknown User';
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }

          return {
            id: note.id,
            job_title: note.jobs?.title || 'Unknown Job',
            client_name: note.jobs?.clients?.name || 'Unknown Client',
            content: note.content,
            created_by_name: createdByName,
            created_at: note.created_at
          };
        })
      );

      setJobNotes(notesWithProfiles);
    } catch (error) {
      console.error('Error fetching job notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes for Each Job</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobNotes.map((note) => (
              <TableRow key={note.id}>
                <TableCell className="font-medium">{note.job_title}</TableCell>
                <TableCell>{note.client_name}</TableCell>
                <TableCell className="max-w-md">
                  <div className="truncate" title={note.content}>
                    {note.content}
                  </div>
                </TableCell>
                <TableCell>{note.created_by_name}</TableCell>
                <TableCell>{format(new Date(note.created_at), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
