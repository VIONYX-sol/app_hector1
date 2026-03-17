import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const statusMap = {
  temporal_block: { label: 'Bloqueada', class: 'bg-muted text-muted-foreground' },
  pending_deposit: { label: 'Pend. señal', class: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmada', class: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Pagada', class: 'bg-green-100 text-green-800' },
  in_progress: { label: 'En curso', class: 'bg-primary/10 text-primary' },
  completed: { label: 'Completada', class: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelada', class: 'bg-red-100 text-red-800' },
  expired: { label: 'Expirada', class: 'bg-muted text-muted-foreground' },
  no_show: { label: 'No show', class: 'bg-red-50 text-red-600' },
};

export default function AdminRecentReservations({ reservations }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Últimas reservas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Importe</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay reservas
                </TableCell>
              </TableRow>
            ) : reservations.map(r => {
              const st = statusMap[r.status] || statusMap.confirmed;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.customer_name || r.customer_email || '—'}</TableCell>
                  <TableCell>{r.room_name || '—'}</TableCell>
                  <TableCell>{r.date ? format(new Date(r.date), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{r.start_time} - {r.end_time}</TableCell>
                  <TableCell className="font-medium">{r.total_amount?.toFixed(2)}€</TableCell>
                  <TableCell><Badge className={`text-xs border-0 ${st.class}`}>{st.label}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}