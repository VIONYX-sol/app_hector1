import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CalendarCheck, ArrowRight, Users, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { data: companies = [] } = useQuery({
    queryKey: ['home-company'],
    queryFn: () => base44.entities.Company.list('name', 1),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['home-rooms'],
    queryFn: () => base44.entities.Room.filter({ status: 'active' }, 'sort_order', 6),
  });

  const company = companies[0] || {};
  const primaryColor = company.primary_color || '#2563eb';

  return (
    <div>
      {/* Hero section */}
      <section className="relative min-h-[540px] flex items-center overflow-hidden">
        <img
          src={company.hero_image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80'}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-black/20" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
            {company.seo_title || 'Reserva tu espacio ideal'}
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl leading-relaxed">
            {company.seo_description || 'Salas profesionales para tu equipo. Reserva en minutos, sin complicaciones.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/Booking">
              <Button size="lg" className="gap-2 h-12 px-8 text-base" style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
                <CalendarCheck className="w-5 h-5" />
                Reservar ahora
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Trust stats */}
          {(company.stat1_value || company.stat2_value || company.stat3_value) && (
            <div className="flex flex-wrap gap-8 mt-10">
              {company.stat1_value && (
                <div>
                  <p className="text-white text-2xl font-bold">{company.stat1_value}</p>
                  <p className="text-white/70 text-sm">{company.stat1_label}</p>
                </div>
              )}
              {company.stat2_value && (
                <div>
                  <p className="text-white text-2xl font-bold">{company.stat2_value}</p>
                  <p className="text-white/70 text-sm">{company.stat2_label}</p>
                </div>
              )}
              {company.stat3_value && (
                <div>
                  <p className="text-white text-2xl font-bold">{company.stat3_value}</p>
                  <p className="text-white/70 text-sm">{company.stat3_label}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Rooms section */}
      {rooms.length > 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground">Nuestros espacios</h2>
              <p className="text-muted-foreground mt-2">Espacios adaptados a cualquier tipo de evento o reunión</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map(room => (
                <div key={room.id} className="rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow bg-card">
                  <img
                    src={room.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80'}
                    alt={room.name}
                    className="w-full h-48 object-cover"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80'; }}
                  />
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-foreground">{room.name}</h3>
                    {room.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{room.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                      {room.capacity_max && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Hasta {room.capacity_max} personas
                        </span>
                      )}
                      {room.available_from && room.available_to && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {room.available_from} - {room.available_to}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-primary font-bold text-lg">{room.price_per_hour}€<span className="text-sm font-normal text-muted-foreground">/hora</span></p>
                      <Link to="/Booking">
                        <Button size="sm" variant="outline">Reservar</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact / address */}
      {(company.address || company.phone || company.email) && (
        <section className="py-12 bg-muted/30 border-t border-border">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Encuéntranos</h2>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              {company.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>{company.address}{company.city ? `, ${company.city}` : ''}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-primary font-semibold">Tel:</span>
                  <a href={`tel:${company.phone}`} className="hover:text-foreground">{company.phone}</a>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-2">
                  <span className="text-primary font-semibold">Email:</span>
                  <a href={`mailto:${company.email}`} className="hover:text-foreground">{company.email}</a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
