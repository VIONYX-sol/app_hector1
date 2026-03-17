import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const categories = {
  electricity: 'Electricidad', water: 'Agua', rent: 'Alquiler', internet: 'Internet',
  maintenance: 'Mantenimiento', cleaning: 'Limpieza', insurance: 'Seguros', taxes: 'Impuestos',
  supplies: 'Material', marketing: 'Marketing', software: 'Software', other: 'Otros',
};

export default function AdminExpenses() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'other', amount: 0, tax_amount: 0, total: 0, supplier: '', date: '', status: 'pending' });
  const queryClient = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ['admin-expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create({ ...data, company_id: 'default' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
      setShowForm(false);
      toast.success('Gasto registrado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
      toast.success('Gasto eliminado');
    },
  });

  const totalExpenses = expenses.reduce((s, e) => s + (e.total || e.amount || 0), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + (e.total || e.amount || 0), 0);

  const filtered = expenses.filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.supplier?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
          <p className="text-muted-foreground text-sm mt-1">Control de gastos del negocio</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Nuevo gasto</Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total gastos</p><p className="text-2xl font-bold mt-1">{totalExpenses.toFixed(2)}€</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-2xl font-bold mt-1">{pendingExpenses.toFixed(2)}€</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Registros</p><p className="text-2xl font-bold mt-1">{expenses.length}</p></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar gasto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No hay gastos registrados</TableCell></TableRow>
              ) : filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{categories[e.category] || e.category}</Badge></TableCell>
                  <TableCell className="text-sm">{e.supplier || '—'}</TableCell>
                  <TableCell className="text-sm">{e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell className="font-medium">{(e.total || e.amount || 0).toFixed(2)}€</TableCell>
                  <TableCell><Badge className={`text-xs border-0 ${e.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{e.status === 'paid' ? 'Pagado' : 'Pendiente'}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo gasto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(categories).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Proveedor</Label><Input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Importe (€)</Label><Input type="number" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value), total: Number(e.target.value) + form.tax_amount})} /></div>
              <div><Label>Fecha</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}