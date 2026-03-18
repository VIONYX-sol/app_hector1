import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, CalendarX } from 'lucide-react';
import { toast } from 'sonner';
import { format, eachDayOfInterval, isSameDay, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminVenueBlocks() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [reason, setReason] = useState('');

  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['admin-venue', id],
    queryFn: () => adminApi.getVenue(id),
  });

  const { data: blocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['admin-venue-blocks', id],
    queryFn: () => adminApi.getVenueBlocks(id),
    enabled: !!id,
  });

  const createBlock = useMutation({
    mutationFn: (data) => adminApi.createVenueBlock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venue-blocks', id] });
      setShowAddDialog(false);
      setDateRange({ from: null, to: null });
      setReason('');
      toast.success('Bloqueo creado');
    },
    onError: (err) => {
      toast.error(err.message || 'Error al crear el bloqueo');
    },
  });

  const deleteBlock = useMutation({
    mutationFn: (blockId) => adminApi.deleteVenueBlock(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venue-blocks', id] });
      toast.success('Bloqueo eliminado');
    },
    onError: (err) => {
      toast.error(err.message || 'Error al eliminar el bloqueo');
    },
  });

  const handleDateSelect = (date) => {
    if (!date) return;
    
    if (!dateRange.from || (dateRange.from && dateRange.to)) {
      setDateRange({ from: date, to: date });
    } else {
      if (isBefore(date, dateRange.from)) {
        setDateRange({ from: date, to: dateRange.from });
      } else {
        setDateRange({ from: dateRange.from, to: date });
      }
    }
  };

  const handleCreateBlock = () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error('Selecciona las fechas a bloquear');
      return;
    }
    createBlock.mutate({
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
      reason: reason || undefined,
    });
  };

  // Get all blocked dates for calendar display
  const blockedDates = blocks.flatMap(block => {
    const start = new Date(block.start_date);
    const end = new Date(block.end_date);
    return eachDayOfInterval({ start, end });
  });

  if (venueLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Espacio no encontrado</p>
        <Link to="/admin/venues">
          <Button variant="link">Volver a espacios</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/venues">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Fechas bloqueadas</h1>
          <p className="text-muted-foreground text-sm mt-1">{venue.name}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo bloqueo
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vista del calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              locale={es}
              modifiers={{
                blocked: (date) => blockedDates.some(d => isSameDay(d, date)),
              }}
              modifiersClassNames={{
                blocked: 'bg-destructive/20 text-destructive',
              }}
              className="mx-auto"
            />
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/20" />
                <span>Fechas bloqueadas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blocks List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lista de bloqueos</CardTitle>
          </CardHeader>
          <CardContent>
            {blocksLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : blocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarX className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay fechas bloqueadas</p>
                <p className="text-sm mt-1">Los clientes pueden reservar cualquier fecha disponible</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.map(block => (
                    <TableRow key={block.id}>
                      <TableCell className="text-sm">
                        {format(new Date(block.start_date), "d 'de' MMM", { locale: es })} - {format(new Date(block.end_date), "d 'de' MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {block.reason || '—'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm('¿Eliminar este bloqueo?')) {
                              deleteBlock.mutate(block.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Block Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear fechas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona el rango de fechas que quieres bloquear. Los clientes no podrán reservar durante estas fechas.
            </p>
            <div className="border border-border rounded-lg p-3">
              <Calendar
                mode="single"
                selected={dateRange.to || dateRange.from}
                onSelect={handleDateSelect}
                locale={es}
                disabled={(date) => isBefore(date, new Date())}
                modifiers={{
                  selected: (date) => {
                    if (!dateRange.from) return false;
                    if (!dateRange.to || isSameDay(dateRange.from, dateRange.to)) {
                      return isSameDay(date, dateRange.from);
                    }
                    return (
                      isSameDay(date, dateRange.from) ||
                      isSameDay(date, dateRange.to) ||
                      (isAfter(date, dateRange.from) && isBefore(date, dateRange.to))
                    );
                  },
                }}
                modifiersClassNames={{
                  selected: 'bg-destructive text-destructive-foreground',
                }}
                fromDate={new Date()}
                className="mx-auto"
              />
            </div>
            {dateRange.from && dateRange.to && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <strong>Fechas seleccionadas:</strong>{' '}
                {format(dateRange.from, "d 'de' MMMM", { locale: es })} - {format(dateRange.to, "d 'de' MMMM yyyy", { locale: es })}
              </div>
            )}
            <div>
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Mantenimiento, evento privado, vacaciones..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateBlock}
              disabled={!dateRange.from || !dateRange.to || createBlock.isPending}
              variant="destructive"
            >
              {createBlock.isPending ? 'Bloqueando...' : 'Bloquear fechas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
