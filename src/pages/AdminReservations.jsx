import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, MoreHorizontal, Eye, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

export default function AdminReservations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['admin-all-reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 200),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Reservation.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-reservations'] });
      toast.success('Estado actualizado');
    },
  });

  const filtered = reservations.filter(r => {
    const matchSearch = !search || 
      r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      r.room_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reservas</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona todas las reservas del negocio</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, email o sala..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
                <TableHead>Cliente</TableHead>
                <TableHead>Sala</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Señal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No se encontraron reservas</TableCell></TableRow>
              ) : filtered.map(r => {
                const st = statusMap[r.status] || statusMap.confirmed;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{r.customer_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{r.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.room_name}</TableCell>
                    <TableCell className="text-sm">{r.date ? format(new Date(r.date), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.start_time} - {r.end_time}</TableCell>
                    <TableCell className="font-medium text-sm">{r.total_amount?.toFixed(2)}€</TableCell>
                    <TableCell className="text-sm">{r.deposit_paid ? '✓ Pagada' : r.deposit_amount?.toFixed(2) + '€'}</TableCell>
                    <TableCell><Badge className={`text-xs border-0 ${st.class}`}>{st.label}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: r.id, status: 'confirmed' })}>
                            Confirmar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: r.id, status: 'paid' })}>
                            Marcar pagada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: r.id, status: 'completed' })}>
                            Completar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => updateStatus.mutate({ id: r.id, status: 'cancelled' })}>
                            Cancelar
                          </DropdownMenuItem>
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
    </div>
  );
}