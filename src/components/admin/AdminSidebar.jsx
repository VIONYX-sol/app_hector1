import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { 
  LayoutDashboard, CalendarDays, Users, DoorOpen,
  ChevronLeft, ChevronRight, LogOut, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Reservas', icon: CalendarDays, path: '/admin/reservations' },
  { label: 'Espacios', icon: DoorOpen, path: '/admin/venues' },
  { label: 'Clientes', icon: Users, path: '/admin/customers' },
];

export default function AdminSidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-40 transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Admin</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className="shrink-0">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
      
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border space-y-1">
        <Link
          to="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <Globe className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Ver web pública</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}