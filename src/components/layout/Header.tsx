
import { Bell, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { signOut, user, isAdmin } = useAuth();

  const handleProfileClick = () => {
    if (!isAdmin) {
      // For non-admin users, show a message or do nothing
      console.log('Profile functionality coming soon');
    }
  };

  const handleSettingsClick = () => {
    if (!isAdmin) {
      // For non-admin users, show a message or do nothing
      console.log('Settings functionality coming soon');
    }
  };

  return (
    <header className="bg-gray-50 shadow-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-[24px] mx-[7px]">
        <div className="flex items-center gap-x-4">
          {/* Company name only */}
          <h2 className="text-lg font-semibold text-gray-800">Job Pulse</h2>
        </div>

        <div className="flex items-center gap-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">View notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-6 w-6" />
                <span className="sr-only">Open user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.email || 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin ? (
                <>
                  <DropdownMenuItem onClick={handleProfileClick}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSettingsClick}>
                    Settings
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleProfileClick} disabled>
                    Profile (Coming Soon)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSettingsClick} disabled>
                    Settings (Coming Soon)
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
