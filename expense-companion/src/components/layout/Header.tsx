import { Wallet, LayoutDashboard, Receipt, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { keycloak, logout } = useAuth();
  const userName = keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.name || 'User';
  const userEmail = keycloak.tokenParsed?.email || '';

  return (
    <header className={className}>
      <div className="container flex items-center justify-between h-16 px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Expenses<span className="text-income">Monitor</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={Receipt} label="Transactions" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 h-auto py-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{userName}</p>
                {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}
              </div>
              <div className="h-9 w-9 rounded-full bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

function NavItem({ icon: Icon, label, active }: NavItemProps) {
  return (
    <button
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
        ${active 
          ? 'bg-primary text-primary-foreground' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }
      `}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
