
import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  full_name: string | null;
  role: string | null;
}

interface UserSelectorProps {
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
}

export function UserSelector({ selectedUserIds, onSelectionChange }: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedUserIds.length === 0
              ? "Select users..."
              : `${selectedUserIds.length} user(s) selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandEmpty>
              {isLoading ? "Loading users..." : "No users found."}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleUserToggle(user.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span>{user.full_name || 'Unknown User'}</span>
                    <Badge variant="outline" className="text-xs">
                      {user.role || 'tech'}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              {user.full_name || 'Unknown User'}
              <button
                type="button"
                onClick={() => handleUserToggle(user.id)}
                className="ml-1 hover:bg-red-100 rounded-full"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
