import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Search, User, Mail, Phone, Building, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => adminApi.getCustomers({ limit: 200 }),
  });

  const { data: customerReservations = [] } = useQuery({
    queryKey: ['admin-customer-reservations', selected?.id],
    queryFn: () => adminApi.getReservations({ customer_id: selected.id }),
    enabled: !!selected?.id,
  });

  const filtered = customers.filter(c => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.phone?.toLowerCase().includes(searchLower) ||
      c.company?.toLowerCase().includes(searchLower)
    );
  });

  const statusMap = {
    pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmada', class: 'bg-blue-100 text-blue-800' },
    rejected: { label: 'Rechazada', class: 'bg-red-100 text-red-800' },
    cancelled: { label: 'Cancelada', class: 'bg-gray-100 text-gray-800' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">Base de datos de clientes que han realizado reservas</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nombre, email, teléfono..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-10" 
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Reservas</TableHead>
                <TableHead>Registrado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                  </TableCell>
                </TableRow>
              ) : filtered.map(c => (
                <TableRow 
                  key={c.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(c)}
                >
                  <TableCell className="font-medium">{c.full_name}</TableCell>
                  <TableCell className="text-sm">{c.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.phone || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.company || '—'}</TableCell>
                  <TableCell className="text-sm">{c.reservation_count || 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.created_at ? format(new Date(c.created_at), 'dd/MM/yy') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalle del cliente</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selected.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliente desde {selected.created_at ? format(new Date(selected.created_at), "MMMM yyyy", { locale: es }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={"mailto:" + selected.email} className="text-primary hover:underline">
                    {selected.email}
                  </a>
                </div>
                {selected.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={"tel:" + selected.phone} className="hover:underline">
                      {selected.phone}
                    </a>
                  </div>
                )}
                {selected.company && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span>{selected.company}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Historial de reservas
                </h4>
                {customerReservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay reservas registradas</p>
                ) : (
                  <div className="space-y-2">
                    {customerReservations.map(r => {
                      const st = statusMap[r.status] || statusMap.pending;
                      return (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{r.venue?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.start_date && format(new Date(r.start_date), "d MMM yyyy", { locale: es })}
                            </p>
                          </div>
                          <Badge className={"text-xs border-0 " + st.class}>{st.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
