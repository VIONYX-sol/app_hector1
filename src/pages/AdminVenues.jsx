import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Users, Trash2, Calendar, Image } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const defaultVenue = {
  name: '',
  slug: '',
  short_description: '',
  full_description: '',
  location_text: '',
  capacity: 50,
  price_from: 0,
  currency: 'EUR',
  is_active: true,
  sort_order: 0,
  images: [],
};

export default function AdminVenues() {
  const [editVenue, setEditVenue] = useState(null);
  const [formData, setFormData] = useState(defaultVenue);
  const [newImageUrl, setNewImageUrl] = useState('');
  const queryClient = useQueryClient();

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: () => adminApi.getVenues(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editVenue?.id) {
        return adminApi.updateVenue(editVenue.id, data);
      }
      return adminApi.createVenue(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      setEditVenue(null);
      toast.success(editVenue?.id ? 'Espacio actualizado' : 'Espacio creado');
    },
    onError: (err) => {
      toast.error(err.message || 'Error al guardar');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => adminApi.archiveVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      toast.success('Espacio archivado');
    },
    onError: (err) => {
      toast.error(err.message || 'Error al archivar');
    },
  });

  const openNew = () => { 
    setFormData(defaultVenue); 
    setEditVenue({}); 
  };
  
  const openEdit = (venue) => { 
    setFormData({ 
      ...defaultVenue, 
      ...venue,
      images: venue.images || [],
    }); 
    setEditVenue(venue); 
  };

  const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const addImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({ 
        ...prev, 
        images: [...(prev.images || []), newImageUrl.trim()] 
      }));
      setNewImageUrl('');
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    // Auto-generate slug if not provided
    const slug = formData.slug || formData.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    saveMutation.mutate({ ...formData, slug });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Espacios</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona los espacios disponibles para reservar</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo espacio
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-muted rounded-t-lg" />
              <CardContent className="pt-4 space-y-2">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map(venue => (
            <Card key={venue.id} className="hover:shadow-md transition-shadow">
              <div className="h-40 bg-muted rounded-t-lg overflow-hidden">
                <img 
                  src={venue.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80'} 
                  alt={venue.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{venue.name}</h3>
                  <Badge variant={venue.is_active ? 'default' : 'secondary'} className="text-xs">
                    {venue.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  {venue.capacity && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {venue.capacity} pers.
                    </span>
                  )}
                  {venue.price_from && (
                    <span>{venue.price_from}€/día</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(venue)} className="flex-1 gap-1">
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </Button>
                  <Link to={`/admin/venues/${venue.id}/blocks`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      if (confirm('¿Archivar este espacio?')) {
                        archiveMutation.mutate(venue.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {venues.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No hay espacios creados. Crea tu primer espacio para empezar a recibir reservas.</p>
                <Button onClick={openNew} className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Crear espacio
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={!!editVenue} onOpenChange={(open) => !open && setEditVenue(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editVenue?.id ? 'Editar espacio' : 'Nuevo espacio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input 
                value={formData.name} 
                onChange={e => updateField('name', e.target.value)} 
                placeholder="Sala de conferencias"
              />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input 
                value={formData.slug} 
                onChange={e => updateField('slug', e.target.value)} 
                placeholder="sala-conferencias"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se genera automáticamente si lo dejas vacío
              </p>
            </div>
            <div>
              <Label>Descripción corta</Label>
              <Input 
                value={formData.short_description} 
                onChange={e => updateField('short_description', e.target.value)} 
                placeholder="Espacio ideal para reuniones de equipo"
              />
            </div>
            <div>
              <Label>Descripción completa</Label>
              <Textarea 
                value={formData.full_description} 
                onChange={e => updateField('full_description', e.target.value)} 
                rows={4}
                placeholder="Descripción detallada del espacio, equipamiento, características..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ubicación</Label>
                <Input 
                  value={formData.location_text} 
                  onChange={e => updateField('location_text', e.target.value)} 
                  placeholder="Madrid Centro"
                />
              </div>
              <div>
                <Label>Capacidad máxima</Label>
                <Input 
                  type="number" 
                  value={formData.capacity} 
                  onChange={e => updateField('capacity', Number(e.target.value))} 
                />
              </div>
              <div>
                <Label>Precio desde (€/día)</Label>
                <Input 
                  type="number" 
                  value={formData.price_from} 
                  onChange={e => updateField('price_from', Number(e.target.value))} 
                />
              </div>
              <div>
                <Label>Orden de visualización</Label>
                <Input 
                  type="number" 
                  value={formData.sort_order} 
                  onChange={e => updateField('sort_order', Number(e.target.value))} 
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={v => updateField('is_active', v)} 
              />
              <Label>Activo (visible para el público)</Label>
            </div>
            
            {/* Images */}
            <div>
              <Label>Imágenes</Label>
              <div className="space-y-2 mt-2">
                {formData.images?.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <img src={url} alt="" className="w-12 h-12 object-cover rounded" />
                    <Input value={url} disabled className="flex-1 text-xs" />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeImage(i)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input 
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addImage}>
                    <Image className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVenue(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Guardando...' : editVenue?.id ? 'Guardar cambios' : 'Crear espacio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
