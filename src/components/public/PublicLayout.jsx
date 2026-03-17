import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicLayout() {
  const navigate = useNavigate();

  const { data: companies = [] } = useQuery({
    queryKey: ['public-company'],
    queryFn: () => base44.entities.Company.list('name', 1),
  });

  const company = companies[0] || {};
  const primaryColor = company.primary_color || 'hsl(var(--primary))';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/Home" className="flex items-center gap-2">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name || 'Logo'}
                className="h-8 w-auto object-contain"
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <CalendarCheck className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-bold text-foreground text-lg">
              {company.name || 'Mi Negocio'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/Home" className="hover:text-foreground transition-colors">Inicio</Link>
            <Link to="/Booking" className="hover:text-foreground transition-colors">Reservar</Link>
          </nav>

          <Button onClick={() => navigate('/Booking')} size="sm">
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
          &copy; {new Date().getFullYear()} {company.name || 'Mi Negocio'}.
          {company.terms_url && (
            <>
              {' '}
              <a href={company.terms_url} className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                Aviso legal
              </a>
            </>
          )}
          {company.privacy_url && (
            <>
              {' · '}
              <a href={company.privacy_url} className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                Privacidad
              </a>
            </>
          )}
        </p>
      </footer>
    </div>
  );
}
