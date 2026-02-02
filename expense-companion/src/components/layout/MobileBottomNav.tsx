import { LayoutDashboard, Receipt, Settings } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg">
      <div className="flex justify-around items-center h-16 px-2">
        <MobileNavItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          to="/" 
          active={location.pathname === '/'} 
        />
        <MobileNavItem 
          icon={Receipt} 
          label="Transactions" 
          to="/transactions" 
          active={location.pathname === '/transactions'} 
        />
        <MobileNavItem 
          icon={Settings} 
          label="Settings" 
          to="/settings" 
          active={location.pathname === '/settings'} 
        />
      </div>
    </nav>
  );
}

interface MobileNavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  active?: boolean;
}

function MobileNavItem({ icon: Icon, label, to, active }: MobileNavItemProps) {
  return (
    <Link
      to={to}
      className={`
        flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg min-w-[70px] transition-all
        ${active 
          ? 'text-primary' 
          : 'text-muted-foreground'
        }
      `}
    >
      <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
      <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
        {label}
      </span>
    </Link>
  );
}
