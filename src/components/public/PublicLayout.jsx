import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground text-lg">
              Venue Manager
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
            <Link to="/booking" className="hover:text-foreground transition-colors">Reservar</Link>
          </nav>

          <Button onClick={() => navigate('/booking')} size="sm">
            Reservar ahora
          </Button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Venue Manager. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
