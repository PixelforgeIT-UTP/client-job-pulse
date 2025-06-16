
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type UserProfile = {
  id: string;
  full_name: string | null;
  role: string | null;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export function UserManagementCard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get all profiles with user data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get corresponding auth user data
      const usersWithAuth = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            // Use RPC function to get user data safely
            const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
            return {
              id: profile.id,
              full_name: profile.full_name,
              role: profile.role,
              email: authData.user?.email || 'Unknown',
              created_at: profile.created_at || '',
              last_sign_in_at: authData.user?.last_sign_in_at || null
            };
          } catch (error) {
            console.error('Error fetching auth data for user:', profile.id, error);
            return {
              id: profile.id,
              full_name: profile.full_name,
              role: profile.role,
              email: 'Unknown',
              created_at: profile.created_at || '',
              last_sign_in_at: null
            };
          }
        })
      );

      setUsers(usersWithAuth);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingUser(userId);
    try {
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      // Refresh the users list
      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
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
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.full_name || 'No name set'}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role || 'tech'}
                  </span>
                </TableCell>
                <TableCell>
                  {user.last_sign_in_at 
                    ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy')
                    : 'Never'
                  }
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role || 'tech'}
                    onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                    disabled={updatingUser === user.id}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tech">Tech</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
