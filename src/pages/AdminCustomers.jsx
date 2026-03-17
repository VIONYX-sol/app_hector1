import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, User, Mail, Phone, CalendarDays, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => base44.entities.Customer.list('-created_date', 200),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['customer-reservations', selected?.id],
    queryFn: () => base44.entities.Reservation.filter({ customer_email: selected.email }, '-date', 50),
    enabled: !!selected,
  });

  const filtered = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.full_name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.phone?.includes(s) ||
      c.nif?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CRM - Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">Registro completo de clientes</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, email, teléfono o NIF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Reservas</TableHead>
                <TableHead>Gasto total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No se encontraron clientes</TableCell></TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(c)}>
                  <TableCell className="font-medium">{c.full_name || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-sm">{c.phone || '—'}</TableCell>
                  <TableCell>{c.total_bookings || 0}</TableCell>
                  <TableCell className="font-medium">{(c.total_spent || 0).toFixed(2)}€</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {c.status === 'active' ? 'Activo' : c.status === 'blocked' ? 'Bloqueado' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ficha de cliente</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selected.full_name || 'Sin nombre'}</h3>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><span>{selected.phone || '—'}</span></div>
                <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" /><span>NIF: {selected.nif || '—'}</span></div>
                <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" /><span>{selected.total_bookings || 0} reservas</span></div>
                <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" /><span>{(selected.total_spent || 0).toFixed(2)}€ gastado</span></div>
              </div>

              {selected.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Notas internas</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{selected.notes}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-3">Últimas reservas</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin reservas</p>
                  ) : reservations.slice(0, 5).map(r => (
                    <div key={r.id} className="flex justify-between items-center p-2 bg-muted rounded-lg text-sm">
                      <div>
                        <span className="font-medium">{r.room_name}</span>
                        <span className="text-muted-foreground ml-2">{r.date}</span>
                      </div>
                      <span className="font-medium">{r.total_amount?.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}