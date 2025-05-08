import { useState } from 'react';
import { Bell, LogOut, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const {
    signOut,
    user
  } = useAuth();
  return <header className="bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-[24px] mx-[7px] bg-[#464c43]/0">
        <div className="flex items-center gap-x-4">
          {isSearchOpen ? <div className="w-full max-w-md">
              <Input type="search" placeholder="Search..." className="w-full" autoFocus onBlur={() => setIsSearchOpen(false)} />
            </div> : <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="lg:hidden">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>}

          <div className="hidden lg:block lg:max-w-md lg:flex-auto">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="pl-10" />
            </div>
          </div>
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
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>;
}