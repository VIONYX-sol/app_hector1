import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  draft: 'bg-muted text-muted-foreground',
  issued: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const fiscalColors = {
  draft: 'bg-muted text-muted-foreground',
  ready_to_issue: 'bg-yellow-100 text-yellow-800',
  issued: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rectified: 'bg-muted text-muted-foreground',
};

export default function AdminInvoices() {
  const [search, setSearch] = useState('');

  const { data: invoices = [] } = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 200),
  });

  const filtered = invoices.filter(i => {
    if (!search) return true;
    return i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      i.customer_name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facturación</h1>
          <p className="text-muted-foreground text-sm mt-1">Facturas emitidas y documentos fiscales</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <FileText className="w-3 h-3" />
            VERI*FACTU preparado
          </Badge>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Facturas emitidas</p>
            <p className="text-2xl font-bold mt-1">{invoices.filter(i => i.status === 'issued' || i.status === 'paid').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total facturado</p>
            <p className="text-2xl font-bold mt-1">{invoices.filter(i => i.status !== 'draft' && i.status !== 'cancelled').reduce((s, i) => s + (i.total || 0), 0).toFixed(2)}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Borradores</p>
            <p className="text-2xl font-bold mt-1">{invoices.filter(i => i.status === 'draft').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por número o cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Factura</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fiscal</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No hay facturas</TableCell></TableRow>
              ) : filtered.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.series}-{inv.invoice_number}</TableCell>
                  <TableCell className="text-sm capitalize">{inv.type}</TableCell>
                  <TableCell className="text-sm">{inv.customer_name || '—'}</TableCell>
                  <TableCell className="text-sm">{inv.issue_date ? format(new Date(inv.issue_date), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell className="font-medium">{inv.total?.toFixed(2)}€</TableCell>
                  <TableCell><Badge className={`text-xs border-0 ${statusColors[inv.status]}`}>{inv.status}</Badge></TableCell>
                  <TableCell><Badge className={`text-xs border-0 ${fiscalColors[inv.fiscal_status]}`}>{inv.fiscal_status}</Badge></TableCell>
                  <TableCell>
                    {inv.pdf_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}