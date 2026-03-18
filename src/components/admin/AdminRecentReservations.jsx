import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';

const statusMap = {
  pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmada', class: 'bg-blue-100 text-blue-800' },
  rejected: { label: 'Rechazada', class: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelada', class: 'bg-gray-100 text-gray-800' },
  owner_blocked: { label: 'Bloqueada', class: 'bg-purple-100 text-purple-800' },
};

export default function AdminRecentReservations({ reservations }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Últimas reservas</CardTitle>
        <Link to="/admin/reservations">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            Ver todas
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Espacio</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay reservas recientes
                </TableCell>
              </TableRow>
            ) : reservations.map(r => {
              const st = statusMap[r.status] || statusMap.pending;
              return (
                <TableRow key={r.id}>
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
                  <TableCell className="text-sm text-muted-foreground">{r.event_type || '—'}</TableCell>
                  <TableCell>
                    <Badge className={"text-xs border-0 " + st.class}>{st.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
