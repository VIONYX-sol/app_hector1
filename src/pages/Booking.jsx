import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { publicApi } from '@/api/client';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck, ArrowLeft, CheckCircle2, Users, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, addDays, eachDayOfInterval, isBefore, isAfter, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const EVENT_TYPES = [
  'Reunión corporativa',
  'Conferencia',
  'Taller / Workshop',
  'Celebración',
  'Sesión fotográfica',
  'Evento privado',
  'Otro',
];

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialVenueId = location.state?.venueId;

  const [step, setStep] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [contactForm, setContactForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    eventType: '',
    attendeeCount: '',
    notes: '',
  });
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  // Fetch venues
  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['booking-venues'],
    queryFn: () => publicApi.getVenues(),
  });

  // Pre-select venue if passed from VenueDetail
  React.useEffect(() => {
    if (initialVenueId && venues.length > 0 && !selectedVenue) {
      const venue = venues.find(v => v.id === initialVenueId);
      if (venue) {
        setSelectedVenue(venue);
        setStep(1);
      }
    }
  }, [initialVenueId, venues, selectedVenue]);

  // Fetch availability for selected venue
  const fromDate = format(new Date(), 'yyyy-MM-dd');
  const toDate = format(addDays(new Date(), 90), 'yyyy-MM-dd');

  const { data: availability = {} } = useQuery({
    queryKey: ['venue-availability', selectedVenue?.id, fromDate, toDate],
    queryFn: () => publicApi.getVenueAvailability(selectedVenue.id, fromDate, toDate),
    enabled: !!selectedVenue?.id,
  });

  // Calculate unavailable dates
  const unavailableDates = useMemo(() => {
    if (!availability.unavailable_dates) return new Set();
    return new Set(availability.unavailable_dates);
  }, [availability]);

  const isDateUnavailable = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return unavailableDates.has(dateStr);
  };

  // Create reservation mutation
  const createReservation = useMutation({
    mutationFn: (data) => publicApi.createReservation(data),
    onSuccess: (response) => {
      setConfirmationData(response);
      setConfirmed(true);
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error('Las fechas seleccionadas ya no están disponibles. Por favor, elige otras fechas.');
      } else {
        toast.error(error.message || 'Error al crear la reserva. Inténtalo de nuevo.');
      }
    },
  });

  const handleSubmit = () => {
    if (!selectedVenue || !dateRange.from || !dateRange.to) return;

    createReservation.mutate({
      venue_id: selectedVenue.id,
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
      full_name: contactForm.fullName,
      email: contactForm.email,
      phone: contactForm.phone,
      company: contactForm.company || null,
      event_type: contactForm.eventType,
      attendee_count: contactForm.attendeeCount ? parseInt(contactForm.attendeeCount) : null,
      notes: contactForm.notes || null,
    });
  };

  // Validation
  const canProceedStep0 = !!selectedVenue;
  const canProceedStep1 = !!dateRange.from && !!dateRange.to;
  const canProceedStep2 = 
    contactForm.fullName.trim() && 
    contactForm.email.trim() && 
    contactForm.phone.trim() &&
    contactForm.eventType;

  // Handle date selection for range
  const handleDateSelect = (date) => {
    if (!date) return;
    
    if (!dateRange.from || (dateRange.from && dateRange.to)) {
      // Start new selection
      setDateRange({ from: date, to: date });
    } else {
      // Complete the range
      if (isBefore(date, dateRange.from)) {
        setDateRange({ from: date, to: dateRange.from });
      } else {
        setDateRange({ from: dateRange.from, to: date });
      }
    }
  };

  // Check if any date in range is unavailable
  const hasUnavailableDatesInRange = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return false;
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.some(day => isDateUnavailable(day));
  }, [dateRange, unavailableDates]);

  // Confirmation screen
  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">¡Solicitud enviada!</h1>
            <p className="text-muted-foreground mt-2">
              Hemos recibido tu solicitud de reserva. Te contactaremos pronto en <strong>{contactForm.email}</strong>.
            </p>
          </div>
          <div className="bg-muted rounded-xl p-4 text-sm text-left space-y-1">
            {confirmationData?.reference && (
              <p><strong>Referencia:</strong> {confirmationData.reference}</p>
            )}
            <p><strong>Espacio:</strong> {selectedVenue?.name}</p>
            <p><strong>Fechas:</strong> {format(dateRange.from, "d 'de' MMMM", { locale: es })} - {format(dateRange.to, "d 'de' MMMM yyyy", { locale: es })}</p>
            <p><strong>Tipo de evento:</strong> {contactForm.eventType}</p>
          </div>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </Link>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Nueva reserva</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 mb-8">
          {['Espacio', 'Fechas', 'Datos', 'Confirmar'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-1.5 text-sm font-medium ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary/20 text-primary border border-primary' : 'bg-muted text-muted-foreground'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="hidden sm:block">{label}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-px ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 pb-12">
          <div className="lg:col-span-2">
            {/* Step 0: Select Venue */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Elige un espacio</h3>
                  <p className="text-sm text-muted-foreground">Selecciona el espacio que mejor se adapte a tu evento</p>
                </div>
                {venuesLoading ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                      <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {venues.map(venue => (
                      <button
                        key={venue.id}
                        onClick={() => setSelectedVenue(venue)}
                        className={cn(
                          "relative text-left rounded-xl border-2 p-4 transition-all hover:shadow-md",
                          selectedVenue?.id === venue.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        {selectedVenue?.id === venue.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        <div className="flex gap-3">
                          <img
                            src={venue.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80'}
                            alt={venue.name}
                            className="w-20 h-20 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-foreground">{venue.name}</h4>
                            {venue.capacity && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Users className="w-3 h-3" />
                                <span>Hasta {venue.capacity} personas</span>
                              </div>
                            )}
                            {venue.price_from && (
                              <p className="text-primary font-semibold text-sm mt-1">Desde {venue.price_from}€/día</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Select Dates */}
            {step === 1 && selectedVenue && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Selecciona las fechas</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en la fecha de inicio y después en la fecha de fin
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="border border-border rounded-xl p-4 bg-card">
                    <Calendar
                      mode="single"
                      selected={dateRange.to || dateRange.from}
                      onSelect={handleDateSelect}
                      locale={es}
                      disabled={(date) => {
                        return isBefore(date, new Date()) || isDateUnavailable(date);
                      }}
                      modifiers={{
                        selected: (date) => {
                          if (!dateRange.from) return false;
                          if (!dateRange.to) return isSameDay(date, dateRange.from);
                          return (
                            isSameDay(date, dateRange.from) ||
                            isSameDay(date, dateRange.to) ||
                            (isAfter(date, dateRange.from) && isBefore(date, dateRange.to))
                          );
                        },
                        rangeStart: (date) => dateRange.from && isSameDay(date, dateRange.from),
                        rangeEnd: (date) => dateRange.to && isSameDay(date, dateRange.to),
                      }}
                      modifiersClassNames={{
                        selected: 'bg-primary text-primary-foreground',
                        rangeStart: 'rounded-l-full',
                        rangeEnd: 'rounded-r-full',
                      }}
                      fromDate={new Date()}
                      toDate={addDays(new Date(), 90)}
                      className="mx-auto"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2">Leyenda</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-primary" />
                          <span>Fechas seleccionadas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-muted border border-border line-through opacity-50" />
                          <span>No disponible</span>
                        </div>
                      </div>
                    </div>
                    {dateRange.from && dateRange.to && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-1">Fechas seleccionadas</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(dateRange.from, "d 'de' MMMM", { locale: es })} - {format(dateRange.to, "d 'de' MMMM yyyy", { locale: es })}
                        </p>
                        {hasUnavailableDatesInRange && (
                          <p className="text-destructive text-xs mt-2">
                            ⚠️ El rango incluye fechas no disponibles
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Form */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Tus datos de contacto</h3>
                  <p className="text-sm text-muted-foreground">Para confirmar tu reserva necesitamos tus datos</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre completo *</Label>
                    <Input
                      value={contactForm.fullName}
                      onChange={e => setContactForm({ ...contactForm, fullName: e.target.value })}
                      placeholder="María García"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="maria@email.com"
                    />
                  </div>
                  <div>
                    <Label>Teléfono *</Label>
                    <Input
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="+34 600 000 000"
                    />
                  </div>
                  <div>
                    <Label>Empresa (opcional)</Label>
                    <Input
                      value={contactForm.company}
                      onChange={e => setContactForm({ ...contactForm, company: e.target.value })}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  <div>
                    <Label>Tipo de evento *</Label>
                    <Select 
                      value={contactForm.eventType} 
                      onValueChange={v => setContactForm({ ...contactForm, eventType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Número de asistentes (estimado)</Label>
                    <Input
                      type="number"
                      value={contactForm.attendeeCount}
                      onChange={e => setContactForm({ ...contactForm, attendeeCount: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notas adicionales</Label>
                  <Textarea
                    value={contactForm.notes}
                    onChange={e => setContactForm({ ...contactForm, notes: e.target.value })}
                    placeholder="Necesidades especiales, equipamiento extra, información sobre el evento..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Confirmar solicitud de reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{selectedVenue?.name}</p>
                        {selectedVenue?.location_text && (
                          <p className="text-muted-foreground">{selectedVenue.location_text}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
                      <p>
                        {format(dateRange.from, "EEEE, d 'de' MMMM", { locale: es })} - {format(dateRange.to, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-primary shrink-0" />
                      <p>{contactForm.eventType}{contactForm.attendeeCount ? ` · ${contactForm.attendeeCount} asistentes` : ''}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 space-y-1 text-sm">
                    <p><strong>Contacto:</strong> {contactForm.fullName}</p>
                    <p><strong>Email:</strong> {contactForm.email}</p>
                    <p><strong>Teléfono:</strong> {contactForm.phone}</p>
                    {contactForm.company && <p><strong>Empresa:</strong> {contactForm.company}</p>}
                    {contactForm.notes && <p><strong>Notas:</strong> {contactForm.notes}</p>}
                  </div>

                  <Button 
                    onClick={handleSubmit} 
                    className="w-full h-12 text-base"
                    disabled={createReservation.isPending}
                  >
                    {createReservation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>Enviar solicitud de reserva</>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Al enviar, aceptas que te contactemos para confirmar la disponibilidad y los detalles de tu reserva.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </Button>
              {step < 3 && (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={
                    (step === 0 && !canProceedStep0) ||
                    (step === 1 && (!canProceedStep1 || hasUnavailableDatesInRange)) ||
                    (step === 2 && !canProceedStep2)
                  }
                >
                  Siguiente
                </Button>
              )}
            </div>
          </div>

          {/* Summary sidebar */}
          {selectedVenue && step < 3 && (
            <div className="hidden lg:block">
              <div className="sticky top-24 p-4 bg-muted/40 rounded-xl border border-border space-y-3 text-sm">
                <p className="font-semibold text-foreground">Resumen</p>
                <div className="space-y-1 text-muted-foreground">
                  <p><strong className="text-foreground">Espacio:</strong> {selectedVenue.name}</p>
                  {dateRange.from && dateRange.to && (
                    <p>
                      <strong className="text-foreground">Fechas:</strong>{' '}
                      {format(dateRange.from, 'd MMM', { locale: es })} - {format(dateRange.to, 'd MMM yyyy', { locale: es })}
                    </p>
                  )}
                  {contactForm.eventType && (
                    <p><strong className="text-foreground">Evento:</strong> {contactForm.eventType}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
