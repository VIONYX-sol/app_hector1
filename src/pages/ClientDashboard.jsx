import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, ArrowLeft, CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusMap = {
  temporal_block: { label: 'Bloqueada', class: 'bg-muted text-muted-foreground' },
  pending_deposit: { label: 'Pend. señal', class: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmada', class: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Pagada', class: 'bg-green-100 text-green-800' },
  completed: { label: 'Completada', class: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelada', class: 'bg-red-100 text-red-800' },
  expired: { label: 'Expirada', class: 'bg-muted text-muted-foreground' },
  no_show: { label: 'No show', class: 'bg-red-50 text-red-600' },
};

export default function ClientDashboard() {
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['client-reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 50),
  });

  const upcomingReservations = reservations.filter(r =>
    ['pending_deposit', 'confirmed', 'paid'].includes(r.status)
  );

  const pastReservations = reservations.filter(r =>
    ['completed', 'cancelled', 'expired', 'no_show'].includes(r.status)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/Home" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Inicio</span>
          </Link>
          <span className="font-semibold text-foreground">Mis reservas</span>
          <Link to="/Booking">
            <Button size="sm" className="gap-2">
              <CalendarCheck className="w-4 h-4" />
              Nueva reserva
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Upcoming */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Próximas reservas</h2>
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Cargando...</div>
          ) : upcomingReservations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tienes reservas próximas</p>
                <Link to="/Booking">
                  <Button className="mt-4" variant="outline">Hacer una reserva</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map(r => (
                <ReservationCard key={r.id} reservation={r} />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        {pastReservations.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Historial</h2>
            <div className="space-y-3">
              {pastReservations.map(r => (
                <ReservationCard key={r.id} reservation={r} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ReservationCard({ reservation: r }) {
  const st = statusMap[r.status] || statusMap.confirmed;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">{r.room_name || 'Sala'}</span>
              <Badge className={`text-xs border-0 ml-1 ${st.class}`}>{st.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {r.date && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {format(new Date(r.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </span>
              )}
              {r.start_time && r.end_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {r.start_time} – {r.end_time}
                </span>
              )}
            </div>
          </div>
          {r.total_amount != null && (
            <div className="text-right shrink-0">
              <p className="font-bold text-foreground">{r.total_amount.toFixed(2)}€</p>
              {r.deposit_required && !r.deposit_paid && (
                <p className="text-xs text-amber-600">Señal: {r.deposit_amount?.toFixed(2)}€</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
