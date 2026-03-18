import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import RoomSelector from '@/components/booking/RoomSelector';
import DateTimeSelector from '@/components/booking/DateTimeSelector';
import BookingSummary from '@/components/booking/BookingSummary';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Booking() {
  const [step, setStep] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [confirmed, setConfirmed] = useState(false);

  const createReservation = useMutation({
    mutationFn: (data) => base44.entities.Reservation.create(data),
    onSuccess: () => {
      setConfirmed(true);
    },
    onError: () => toast.error('Error al crear la reserva. Inténtalo de nuevo.'),
  });

  const handleConfirm = ({ subtotal, tax, total, depositAmount, hours }) => {
    createReservation.mutate({
      room_id: selectedRoom.id,
      room_name: selectedRoom.name,
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedStart,
      end_time: selectedEnd,
      duration_hours: hours,
      customer_name: contactForm.name,
      customer_email: contactForm.email,
      customer_phone: contactForm.phone,
      notes: contactForm.notes,
      subtotal_amount: subtotal,
      tax_amount: tax,
      total_amount: total,
      deposit_amount: depositAmount,
      deposit_paid: false,
      status: 'pending_deposit',
    });
  };

  const canProceedStep1 = !!selectedRoom;
  const canProceedStep2 = !!selectedDate && !!selectedStart && !!selectedEnd;
  const canProceedStep3 = contactForm.name.trim() && contactForm.email.trim();

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">¡Reserva enviada!</h1>
            <p className="text-muted-foreground mt-2">
              Hemos recibido tu solicitud. Te enviaremos un email de confirmación a <strong>{contactForm.email}</strong>.
            </p>
          </div>
          <div className="bg-muted rounded-xl p-4 text-sm text-left space-y-1">
            <p><strong>Sala:</strong> {selectedRoom?.name}</p>
            <p><strong>Fecha:</strong> {selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><strong>Horario:</strong> {selectedStart} – {selectedEnd}</p>
          </div>
          <Link to="/Home">
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
          <Link to="/Home" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
          {['Sala', 'Horario', 'Datos', 'Resumen'].map((label, i) => (
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
            {step === 0 && (
              <RoomSelector selectedRoom={selectedRoom} onSelect={room => { setSelectedRoom(room); }} />
            )}
            {step === 1 && selectedRoom && (
              <DateTimeSelector
                room={selectedRoom}
                selectedDate={selectedDate}
                selectedStart={selectedStart}
                selectedEnd={selectedEnd}
                onDateChange={setSelectedDate}
                onStartChange={setSelectedStart}
                onEndChange={setSelectedEnd}
              />
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Tus datos de contacto</h3>
                  <p className="text-sm text-muted-foreground">Para confirmar tu reserva necesitamos tus datos</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre y apellidos *</Label>
                    <Input
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
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
                    <Label>Teléfono</Label>
                    <Input
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notas adicionales</Label>
                  <Input
                    value={contactForm.notes}
                    onChange={e => setContactForm({ ...contactForm, notes: e.target.value })}
                    placeholder="Necesidades especiales, equipamiento extra..."
                  />
                </div>
              </div>
            )}
            {step === 3 && (
              <BookingSummary
                room={selectedRoom}
                date={selectedDate}
                startTime={selectedStart}
                endTime={selectedEnd}
                extras={[]}
                onConfirm={handleConfirm}
                isSubmitting={createReservation.isPending}
              />
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
                    (step === 0 && !canProceedStep1) ||
                    (step === 1 && !canProceedStep2) ||
                    (step === 2 && !canProceedStep3)
                  }
                >
                  Siguiente
                </Button>
              )}
            </div>
          </div>

          {/* Summary sidebar */}
          {selectedRoom && step < 3 && (
            <div className="hidden lg:block">
              <div className="sticky top-24 p-4 bg-muted/40 rounded-xl border border-border space-y-3 text-sm">
                <p className="font-semibold text-foreground">Resumen</p>
                <div className="space-y-1 text-muted-foreground">
                  <p><strong className="text-foreground">Sala:</strong> {selectedRoom.name}</p>
                  {selectedDate && (
                    <p><strong className="text-foreground">Fecha:</strong> {selectedDate.toLocaleDateString('es-ES')}</p>
                  )}
                  {selectedStart && selectedEnd && (
                    <p><strong className="text-foreground">Horario:</strong> {selectedStart} – {selectedEnd}</p>
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
