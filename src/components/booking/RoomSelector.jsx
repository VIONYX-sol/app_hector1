import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function RoomSelector({ selectedRoom, onSelect }) {
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['booking-rooms'],
    queryFn: () => base44.entities.Room.filter({ status: 'active' }, 'sort_order', 50),
  });

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {[1,2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Elige una sala</h3>
        <p className="text-sm text-muted-foreground">Selecciona el espacio que mejor se adapte a tu evento</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {rooms.map(room => (
          <button
            key={room.id}
            onClick={() => onSelect(room)}
            className={cn(
              "relative text-left rounded-xl border-2 p-4 transition-all hover:shadow-md",
              selectedRoom?.id === room.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/30"
            )}
          >
            {selectedRoom?.id === room.id && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className="flex gap-3">
              <img
                src={room.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80'}
                alt={room.name}
                className="w-20 h-20 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-semibold text-foreground">{room.name}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Users className="w-3 h-3" />
                  <span>Hasta {room.capacity_max || '?'} personas</span>
                </div>
                <p className="text-primary font-semibold text-sm mt-1">{room.price_per_hour}€/h</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}