import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/api/client';
import { Button } from '@/components/ui/button';
import { CalendarCheck, ArrowRight, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { data: venues = [] } = useQuery({
    queryKey: ['public-venues'],
    queryFn: () => publicApi.getVenues(),
  });

  return (
    <div>
      {/* Hero section */}
      <section className="relative min-h-[540px] flex items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-black/20" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
            Reserva tu espacio ideal
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl leading-relaxed">
            Espacios profesionales para tu equipo. Reserva en minutos, sin complicaciones.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/booking">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                <CalendarCheck className="w-5 h-5" />
                Reservar ahora
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Trust stats */}
          <div className="flex flex-wrap gap-8 mt-10">
            <div>
              <p className="text-white text-2xl font-bold">500+</p>
              <p className="text-white/70 text-sm">Eventos realizados</p>
            </div>
            <div>
              <p className="text-white text-2xl font-bold">98%</p>
              <p className="text-white/70 text-sm">Satisfacción</p>
            </div>
            <div>
              <p className="text-white text-2xl font-bold">{venues.length}</p>
              <p className="text-white/70 text-sm">Espacios disponibles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Venues section */}
      {venues.length > 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground">Nuestros espacios</h2>
              <p className="text-muted-foreground mt-2">Espacios adaptados a cualquier tipo de evento o reunión</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map(venue => (
                <Link 
                  key={venue.id} 
                  to={`/venues/${venue.slug}`}
                  className="rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow bg-card block"
                >
                  <img
                    src={venue.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80'}
                    alt={venue.name}
                    className="w-full h-48 object-cover"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80'; }}
                  />
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-foreground">{venue.name}</h3>
                    {venue.short_description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{venue.short_description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                      {venue.capacity && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Hasta {venue.capacity} personas
                        </span>
                      )}
                      {venue.location_text && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {venue.location_text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      {venue.price_from && (
                        <p className="text-primary font-bold text-lg">
                          Desde {venue.price_from}€
                          <span className="text-sm font-normal text-muted-foreground">/día</span>
                        </p>
                      )}
                      <Button size="sm" variant="outline">Ver detalles</Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {venues.length === 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground">Próximamente</h2>
            <p className="text-muted-foreground mt-2">Estamos preparando nuestros espacios. Vuelve pronto.</p>
          </div>
        </section>
      )}

      {/* Contact section */}
      <section className="py-12 bg-muted/30 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Contacto</h2>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-primary font-semibold">Email:</span>
              <a href="mailto:info@example.com" className="hover:text-foreground">info@example.com</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
