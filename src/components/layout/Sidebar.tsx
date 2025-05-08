
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, FileText, CreditCard, Calendar, Clock, Home, Menu, X } from 'lucide-react';
type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};
const navigation: NavItem[] = [{
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
export default function Sidebar() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  return <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Toggle menu">
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar for mobile */}
      <div className={cn("fixed inset-0 z-30 transform transition-transform duration-300 ease-in-out lg:hidden", isMobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
        <div className="relative h-full w-64 bg-sidebar border-r border-sidebar-border shadow-xl">
          <div className="p-5">
            <h1 className="text-xl font-bold text-black">Job Pulse</h1>
          </div>
          <nav className="mt-5 px-2 space-y-1">
            {navigation.map(item => <Link key={item.name} to={item.href} onClick={() => setIsMobileOpen(false)} className={cn(item.href === location.pathname ? 'bg-sidebar-accent text-black' : 'text-black hover:bg-sidebar-accent/50 hover:text-black', 'group flex items-center px-3 py-2 text-sm font-medium rounded-md')}>
                <item.icon className={cn(item.href === location.pathname ? 'text-black' : 'text-black/80 group-hover:text-black', 'mr-3 h-5 w-5 flex-shrink-0')} aria-hidden="true" />
                {item.name}
              </Link>)}
          </nav>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-sidebar-border px-6 bg-[#e5ecf5]">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-black">Job Pulse</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-6 mx-[2px] my-0 bg-inherit">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map(item => <li key={item.name}>
                      <Link to={item.href} className={cn(item.href === location.pathname ? 'bg-sidebar-accent text-black' : 'text-black hover:bg-sidebar-accent/50 hover:text-black', 'group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold')}>
                        <item.icon className="h-5 w-5 shrink-0 text-black" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>)}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>;
}
