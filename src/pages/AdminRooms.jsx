import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const defaultRoom = {
  name: '', description: '', short_description: '', capacity_min: 1, capacity_max: 10,
  size_sqm: 0, price_per_hour: 0, deposit_required: true, deposit_type: 'percentage',
  deposit_amount: 30, available_from: '09:00', available_to: '22:00', buffer_minutes: 15,
  min_booking_hours: 1, max_booking_hours: 12, status: 'active',
  available_days: [1,2,3,4,5,6], equipment: [], services: [], images: [],
};

export default function AdminRooms() {
  const [editRoom, setEditRoom] = useState(null);
  const [formData, setFormData] = useState(defaultRoom);
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['admin-rooms'],
    queryFn: () => base44.entities.Room.list('sort_order', 50),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editRoom?.id) {
        return base44.entities.Room.update(editRoom.id, data);
      }
      return base44.entities.Room.create({ ...data, company_id: 'default' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      setEditRoom(null);
      toast.success(editRoom?.id ? 'Sala actualizada' : 'Sala creada');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Room.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      toast.success('Sala eliminada');
    },
  });

  const openNew = () => { setFormData(defaultRoom); setEditRoom({}); };
  const openEdit = (room) => { setFormData({ ...defaultRoom, ...room }); setEditRoom(room); };

  const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Salas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona los espacios de tu negocio</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Nueva sala</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <Card key={room.id} className="hover:shadow-md transition-shadow">
            <div className="h-40 bg-muted rounded-t-lg overflow-hidden">
              <img src={room.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80'} alt={room.name} className="w-full h-full object-cover" />
            </div>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{room.name}</h3>
                <Badge variant={room.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {room.status === 'active' ? 'Activa' : room.status === 'maintenance' ? 'Mantenimiento' : 'Inactiva'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{room.capacity_max} pers.</span>
                <span>{room.price_per_hour}€/h</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(room)} className="flex-1 gap-1">
                  <Pencil className="w-3.5 h-3.5" />Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(room.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {rooms.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No hay salas creadas. Crea tu primera sala para empezar a recibir reservas.</p>
              <Button onClick={openNew} className="mt-4 gap-2"><Plus className="w-4 h-4" />Crear sala</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!editRoom} onOpenChange={(open) => !open && setEditRoom(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRoom?.id ? 'Editar sala' : 'Nueva sala'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nombre</Label>
                <Input value={formData.name} onChange={e => updateField('name', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Descripción</Label>
                <Textarea value={formData.description} onChange={e => updateField('description', e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Capacidad máxima</Label>
                <Input type="number" value={formData.capacity_max} onChange={e => updateField('capacity_max', Number(e.target.value))} />
              </div>
              <div>
                <Label>Tamaño (m²)</Label>
                <Input type="number" value={formData.size_sqm} onChange={e => updateField('size_sqm', Number(e.target.value))} />
              </div>
              <div>
                <Label>Precio/hora (€)</Label>
                <Input type="number" value={formData.price_per_hour} onChange={e => updateField('price_per_hour', Number(e.target.value))} />
              </div>
              <div>
                <Label>Buffer entre reservas (min)</Label>
                <Input type="number" value={formData.buffer_minutes} onChange={e => updateField('buffer_minutes', Number(e.target.value))} />
              </div>
              <div>
                <Label>Hora apertura</Label>
                <Input value={formData.available_from} onChange={e => updateField('available_from', e.target.value)} placeholder="09:00" />
              </div>
              <div>
                <Label>Hora cierre</Label>
                <Input value={formData.available_to} onChange={e => updateField('available_to', e.target.value)} placeholder="22:00" />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch checked={formData.deposit_required} onCheckedChange={v => updateField('deposit_required', v)} />
                <Label>Requiere señal</Label>
              </div>
              {formData.deposit_required && (
                <div>
                  <Label>Señal (%)</Label>
                  <Input type="number" value={formData.deposit_amount} onChange={e => updateField('deposit_amount', Number(e.target.value))} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoom(null)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
              {editRoom?.id ? 'Guardar cambios' : 'Crear sala'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}