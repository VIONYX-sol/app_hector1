import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Filter, MoreHorizontal, Eye, CalendarDays, User, Mail, Phone, Building } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const statusMap = {
  pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmada', class: 'bg-blue-100 text-blue-800' },
  rejected: { label: 'Rechazada', class: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelada', class: 'bg-gray-100 text-gray-800' },
  owner_blocked: { label: 'Bloqueada', class: 'bg-purple-100 text-purple-800' },
};

export default function AdminReservations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['admin-all-reservations'],
    queryFn: () => adminApi.getReservations({ limit: 200 }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, internal_notes }) => 
      adminApi.updateReservation(id, { status, internal_notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-reservations'] });
      setStatusChangeDialog(null);
      setSelectedReservation(null);
      toast.success('Reserva actualizada');
    },
    onError: (err) => {
      toast.error(err.message || 'Error al actualizar la reserva');
    },
  });

  const handleStatusChange = () => {
    if (!statusChangeDialog || !newStatus) return;
    updateStatus.mutate({
      id: statusChangeDialog.id,
      status: newStatus,
      internal_notes: internalNotes || undefined,
    });
  };

  const openStatusDialog = (reservation, status) => {
    setStatusChangeDialog(reservation);
    setNewStatus(status);
    setInternalNotes(reservation.internal_notes || '');
  };

  const filtered = reservations.filter(r => {
    const matchSearch = !search || 
      r.customer_name_snapshot?.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_email_snapshot?.toLowerCase().includes(search.toLowerCase()) ||
      r.venue?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.public_reference?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reservas</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona todas las solicitudes de reserva</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente, email, espacio o referencia..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusMap).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referencia</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Espacio</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No se encontraron reservas
                  </TableCell>
                </TableRow>
              ) : filtered.map(r => {
                const st = statusMap[r.status] || statusMap.pending;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.public_reference || r.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{r.customer_name_snapshot || '—'}</p>
                        <p className="text-xs text-muted-foreground">{r.customer_email_snapshot}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.venue?.name || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {r.start_date && r.end_date ? (
                        <span>
                          {format(new Date(r.start_date), 'd MMM', { locale: es })} - {format(new Date(r.end_date), 'd MMM', { locale: es })}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.event_type || '—'}
                      {r.attendee_count && <span className="ml-1">({r.attendee_count}p)</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs border-0 ${st.class}`}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.created_at ? format(new Date(r.created_at), 'dd/MM/yy HH:mm') : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedReservation(r)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          {r.status !== 'confirmed' && (
                            <DropdownMenuItem onClick={() => openStatusDialog(r, 'confirmed')}>
                              Confirmar
                            </DropdownMenuItem>
                          )}
                          {r.status !== 'rejected' && (
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => openStatusDialog(r, 'rejected')}
                            >
                              Rechazar
                            </DropdownMenuItem>
                          )}
                          {r.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => openStatusDialog(r, 'cancelled')}>
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reservation Detail Sheet */}
      <Sheet open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalle de reserva</SheetTitle>
          </SheetHeader>
          {selectedReservation && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Referencia</span>
                <span className="font-mono text-sm">{selectedReservation.public_reference || selectedReservation.id.slice(0, 8)}</span>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Cliente</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedReservation.customer_name_snapshot}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedReservation.customer_email_snapshot}`} className="text-primary hover:underline">
                      {selectedReservation.customer_email_snapshot}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedReservation.customer_phone_snapshot}`} className="hover:underline">
                      {selectedReservation.customer_phone_snapshot}
                    </a>
                  </div>
                  {selectedReservation.customer_company_snapshot && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedReservation.customer_company_snapshot}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Reserva</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Espacio</span>
                    <span>{selectedReservation.venue?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fechas</span>
                    <span>
                      {format(new Date(selectedReservation.start_date), "d 'de' MMMM", { locale: es })} - {format(new Date(selectedReservation.end_date), "d 'de' MMMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de evento</span>
                    <span>{selectedReservation.event_type}</span>
                  </div>
                  {selectedReservation.attendee_count && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asistentes</span>
                      <span>{selectedReservation.attendee_count}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado</span>
                    <Badge className={`text-xs border-0 ${statusMap[selectedReservation.status]?.class}`}>
                      {statusMap[selectedReservation.status]?.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedReservation.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Notas del cliente</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {selectedReservation.notes}
                  </p>
                </div>
              )}

              {selectedReservation.internal_notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Notas internas</h3>
                  <p className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-lg">
                    {selectedReservation.internal_notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedReservation.status !== 'confirmed' && (
                  <Button 
                    className="flex-1" 
                    onClick={() => openStatusDialog(selectedReservation, 'confirmed')}
                  >
                    Confirmar
                  </Button>
                )}
                {selectedReservation.status !== 'rejected' && (
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => openStatusDialog(selectedReservation, 'rejected')}
                  >
                    Rechazar
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Status Change Dialog */}
      <Dialog open={!!statusChangeDialog} onOpenChange={() => setStatusChangeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cambiar estado a: {statusMap[newStatus]?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de cambiar el estado de la reserva de{' '}
              <strong>{statusChangeDialog?.customer_name_snapshot}</strong>?
            </p>
            <div>
              <Label>Notas internas (opcional)</Label>
              <Textarea
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                placeholder="Añade notas internas sobre este cambio..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeDialog(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleStatusChange}
              disabled={updateStatus.isPending}
              variant={newStatus === 'rejected' ? 'destructive' : 'default'}
            >
              {updateStatus.isPending ? 'Guardando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}