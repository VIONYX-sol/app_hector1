import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-muted text-muted-foreground',
};

const typeLabels = {
  deposit: 'Señal',
  balance: 'Resto',
  full: 'Completo',
  refund: 'Reembolso',
};

export default function AdminPayments() {
  const [search, setSearch] = useState('');

  const { data: payments = [] } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 200),
  });

  const filtered = payments.filter(p => {
    if (!search) return true;
    return p.reference?.toLowerCase().includes(search.toLowerCase()) ||
      p.reservation_id?.includes(search);
  });

  const totalCompleted = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
        <p className="text-muted-foreground text-sm mt-1">Control de cobros y pagos</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total cobrado</p>
            <p className="text-2xl font-bold mt-1">{totalCompleted.toFixed(2)}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pagos pendientes</p>
            <p className="text-2xl font-bold mt-1">{payments.filter(p => p.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Reembolsos</p>
            <p className="text-2xl font-bold mt-1">{payments.filter(p => p.type === 'refund').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por referencia..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No hay pagos registrados</TableCell></TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{format(new Date(p.created_date), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{typeLabels[p.type] || p.type}</Badge></TableCell>
                  <TableCell className="text-sm capitalize">{p.method || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.reference || '—'}</TableCell>
                  <TableCell className="font-medium">{p.amount?.toFixed(2)}€</TableCell>
                  <TableCell><Badge className={`text-xs border-0 ${statusColors[p.status]}`}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}