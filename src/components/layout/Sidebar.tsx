
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, FileText, CreditCard, Calendar, Clock, Home, Menu, X, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

const userNavigation: NavItem[] = [{
  name: 'Dashboard',
  href: '/',
  icon: Home
}, {
  name: 'Clients',
  href: '/clients',
  icon: Users
}, {
  name: 'Jobs',
  href: '/jobs',
  icon: Briefcase
}, {
  name: 'Quotes',
  href: '/quotes',
  icon: FileText
}, {
  name: 'Invoices',
  href: '/invoices',
  icon: FileText
}, {
  name: 'Payments',
  href: '/payments',
  icon: CreditCard
}, {
  name: 'Schedule',
  href: '/schedule',
  icon: Calendar
}, {
  name: 'Time Tracking',
  href: '/time-tracking',
  icon: Clock
}];

const adminNavigation: NavItem[] = [{
  name: 'Admin Console',
  href: '/admin-dashboard',
  icon: Settings
}];

export default function Sidebar() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAdmin } = useAuth();

  const navigation = isAdmin ? adminNavigation : userNavigation;

  return <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Toggle menu">
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Backdrop overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-30 backdrop-blur-sm bg-black/20 lg:hidden" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* Sidebar for mobile */}
      <div className={cn(
        "fixed top-0 left-0 z-40 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden border-r border-gray-200",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-5">
          <h1 className="text-xl font-bold text-gray-800">Job Pulse</h1>
        </div>
        <nav className="mt-5 px-2 space-y-1">
          {navigation.map(item => (
            <Link 
              key={item.name} 
              to={item.href} 
              onClick={() => setIsMobileOpen(false)} 
              className={cn(
                item.href === location.pathname 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900', 
                'group flex items-center px-3 py-2 text-sm font-medium rounded-l-md'
              )}
            >
              <item.icon 
                className={cn(
                  item.href === location.pathname 
                    ? 'text-blue-600' 
                    : 'text-gray-400 group-hover:text-gray-600', 
                  'mr-3 h-5 w-5 flex-shrink-0'
                )} 
                aria-hidden="true" 
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 px-6 bg-white">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-gray-800">Job Pulse</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-6 mx-[2px] my-0 bg-inherit">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map(item => (
                    <li key={item.name}>
                      <Link 
                        to={item.href} 
                        className={cn(
                          item.href === location.pathname 
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900', 
                          'group flex items-center gap-x-3 rounded-l-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        <item.icon 
                          className={cn(
                            item.href === location.pathname 
                              ? 'text-blue-600' 
                              : 'text-gray-400 group-hover:text-gray-600',
                            'h-5 w-5 shrink-0'
                          )} 
                          aria-hidden="true" 
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>;
}
