import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Building2, Clock, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const timezones = [
  'Europe/Madrid', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'America/New_York', 'America/Los_Angeles', 'America/Mexico_City',
];

const currencies = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'Dólar ($)' },
  { value: 'GBP', label: 'Libra (£)' },
  { value: 'MXN', label: 'Peso mexicano (MXN)' },
];

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['admin-company-settings'],
    queryFn: () => base44.entities.Company.list('name', 1),
  });

  const company = companies[0] || {};
  const [form, setForm] = useState({});

  useEffect(() => {
    if (company.id) {
      setForm(company);
    }
  }, [company.id]);
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (company.id) {
        return base44.entities.Company.update(company.id, data);
      }
      return base44.entities.Company.create({ ...data, status: 'active' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-company-settings'] });
      toast.success('Configuración guardada');
    },
    onError: () => toast.error('Error al guardar la configuración'),
  });

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground text-sm mt-1">Ajustes generales del negocio</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="w-4 h-4" />
            Datos del negocio
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-2">
            <Settings className="w-4 h-4" />
            Datos fiscales
          </TabsTrigger>
          <TabsTrigger value="regional" className="gap-2">
            <Clock className="w-4 h-4" />
            Regional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del negocio</CardTitle>
              <CardDescription>Datos básicos que aparecen en la web pública y en las comunicaciones con clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre del negocio</Label>
                  <Input value={form.name || ''} onChange={e => updateField('name', e.target.value)} placeholder="Mi Negocio" />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input value={form.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="+34 600 000 000" />
                </div>
                <div>
                  <Label>Email de contacto</Label>
                  <Input value={form.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="hola@minegocio.com" />
                </div>
                <div>
                  <Label>Sitio web</Label>
                  <Input value={form.website || ''} onChange={e => updateField('website', e.target.value)} placeholder="https://minegocio.com" />
                </div>
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={form.description || ''}
                  onChange={e => updateField('description', e.target.value)}
                  rows={3}
                  placeholder="Descripción breve del negocio..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dirección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Dirección</Label>
                <Input value={form.address || ''} onChange={e => updateField('address', e.target.value)} placeholder="Calle Principal, 1" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Ciudad</Label>
                  <Input value={form.city || ''} onChange={e => updateField('city', e.target.value)} placeholder="Madrid" />
                </div>
                <div>
                  <Label>Código postal</Label>
                  <Input value={form.postal_code || ''} onChange={e => updateField('postal_code', e.target.value)} placeholder="28001" />
                </div>
                <div>
                  <Label>País</Label>
                  <Input value={form.country || ''} onChange={e => updateField('country', e.target.value)} placeholder="España" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Política de cancelación</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.cancellation_policy_text || ''}
                onChange={e => updateField('cancellation_policy_text', e.target.value)}
                rows={4}
                placeholder="Describe las condiciones de cancelación..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos fiscales</CardTitle>
              <CardDescription>Aparecerán en las facturas generadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Razón social</Label>
                  <Input value={form.legal_name || ''} onChange={e => updateField('legal_name', e.target.value)} placeholder="Mi Negocio S.L." />
                </div>
                <div>
                  <Label>NIF / CIF</Label>
                  <Input value={form.nif || ''} onChange={e => updateField('nif', e.target.value)} placeholder="B12345678" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración regional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Moneda</Label>
                  <Select value={form.currency || 'EUR'} onValueChange={v => updateField('currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Zona horaria</Label>
                  <Select value={form.timezone || 'Europe/Madrid'} onValueChange={v => updateField('timezone', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
