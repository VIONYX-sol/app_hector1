import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BookingSummary({ room, date, startTime, endTime, extras, onConfirm, isSubmitting }) {
  if (!room || !date || !startTime || !endTime) return null;

  const startH = parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1]) / 60;
  const endH = parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1]) / 60;
  const hours = endH - startH;
  const subtotal = hours * (room.price_per_hour || 0);
  
  const extrasTotal = (extras || []).reduce((sum, e) => sum + (e.price * (e.quantity || 1)), 0);
  const preTax = subtotal + extrasTotal;
  const taxRate = 0.21;
  const tax = preTax * taxRate;
  const total = preTax + tax;
  
  const depositAmount = room.deposit_required
    ? room.deposit_type === 'fixed'
      ? room.deposit_amount || 0
      : total * ((room.deposit_amount || 30) / 100)
    : 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Resumen de reserva</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium">{room.name}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            <span>{format(date, "EEEE, d 'de' MMMM yyyy", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>{startTime} - {endTime} ({hours}h)</span>
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sala ({hours}h × {room.price_per_hour}€)</span>
            <span>{subtotal.toFixed(2)}€</span>
          </div>
          {extras?.map((e, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-muted-foreground">{e.name}</span>
              <span>{(e.price * (e.quantity || 1)).toFixed(2)}€</span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA (21%)</span>
            <span>{tax.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t border-border pt-2">
            <span>Total</span>
            <span>{total.toFixed(2)}€</span>
          </div>
          {room.deposit_required && (
            <div className="flex justify-between text-primary font-medium">
              <span className="flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                Señal a pagar ahora
              </span>
              <span>{depositAmount.toFixed(2)}€</span>
            </div>
          )}
        </div>

        <Button 
          onClick={() => onConfirm({ subtotal, extrasTotal, tax, total, depositAmount, hours })} 
          className="w-full h-12 text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>Confirmar reserva</>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Al confirmar aceptas las condiciones de reserva y la política de cancelación
        </p>
      </CardContent>
    </Card>
  );
}