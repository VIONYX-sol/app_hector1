import React, { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DateTimeSelector({ room, selectedDate, selectedStart, selectedEnd, onDateChange, onStartChange, onEndChange }) {
  const { data: existingReservations = [] } = useQuery({
    queryKey: ['room-reservations', room?.id, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: () => base44.entities.Reservation.filter({
      room_id: room.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      status: ['temporal_block', 'pending_deposit', 'confirmed', 'paid', 'in_progress']
    }),
    enabled: !!room?.id && !!selectedDate,
  });

  const timeSlots = useMemo(() => {
    if (!room) return [];
    const from = parseInt(room.available_from?.split(':')[0] || '9');
    const to = parseInt(room.available_to?.split(':')[0] || '22');
    const slots = [];
    for (let h = from; h < to; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  }, [room]);

  const isSlotTaken = (slot) => {
    return existingReservations.some(r => {
      return slot >= r.start_time && slot < r.end_time;
    });
  };

  const endTimeSlots = useMemo(() => {
    if (!selectedStart) return [];
    const startIndex = timeSlots.indexOf(selectedStart);
    return timeSlots.filter((_, i) => i > startIndex);
  }, [selectedStart, timeSlots]);

  const availableDays = room?.available_days || [1,2,3,4,5];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Fecha y horario</h3>
        <p className="text-sm text-muted-foreground">Selecciona cuándo necesitas la sala</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Fecha</label>
          <div className="border border-border rounded-xl p-3 bg-card">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              locale={es}
              disabled={(date) => {
                const day = date.getDay();
                return date < new Date() || !availableDays.includes(day);
              }}
              fromDate={new Date()}
              toDate={addDays(new Date(), 90)}
              className="mx-auto"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Hora inicio</label>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {timeSlots.map(slot => {
                const taken = isSlotTaken(slot);
                return (
                  <Button
                    key={slot}
                    variant={selectedStart === slot ? "default" : "outline"}
                    size="sm"
                    disabled={taken}
                    onClick={() => {
                      onStartChange(slot);
                      onEndChange(null);
                    }}
                    className={cn("text-xs", taken && "opacity-40 line-through")}
                  >
                    {slot}
                  </Button>
                );
              })}
            </div>
          </div>

          {selectedStart && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Hora fin</label>
              <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {endTimeSlots.map(slot => {
                  const taken = isSlotTaken(slot);
                  return (
                    <Button
                      key={slot}
                      variant={selectedEnd === slot ? "default" : "outline"}
                      size="sm"
                      disabled={taken}
                      onClick={() => onEndChange(slot)}
                      className={cn("text-xs", taken && "opacity-40 line-through")}
                    >
                      {slot}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}