import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CalendarDays, Users, CreditCard, FileText, 
  Receipt, BarChart3, Settings, DoorOpen, LogOut, ChevronLeft, ChevronRight, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/Admin' },
  { label: 'Reservas', icon: CalendarDays, path: '/AdminReservations' },
  { label: 'Salas', icon: DoorOpen, path: '/AdminRooms' },
  { label: 'Clientes', icon: Users, path: '/AdminCustomers' },
  { label: 'Pagos', icon: CreditCard, path: '/AdminPayments' },
  { label: 'Facturas', icon: FileText, path: '/AdminInvoices' },
  { label: 'Gastos', icon: Receipt, path: '/AdminExpenses' },
  { label: 'Analítica', icon: BarChart3, path: '/AdminAnalytics' },
  { label: 'Sitio web', icon: Globe, path: '/AdminWebsite' },
  { label: 'Configuración', icon: Settings, path: '/AdminSettings' },
];

export default function AdminSidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-40 transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <Link to="/Admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
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
          const isActive = location.pathname === item.path;
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

      <div className="p-2 border-t border-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <DoorOpen className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Ver web pública</span>}
        </Link>
        <button
          onClick={() => base44.auth.logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}