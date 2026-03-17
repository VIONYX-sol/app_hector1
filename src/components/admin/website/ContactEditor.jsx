import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContactEditor({ form, updateField }) {
  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Teléfono</Label>
              <Input value={form.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="+34 600 000 000" />
            </div>
            <div>
              <Label>Email de contacto</Label>
              <Input value={form.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="hola@minegocio.com" />
            </div>
          </div>
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
              <Label>Provincia</Label>
              <Input value={form.province || ''} onChange={e => updateField('province', e.target.value)} placeholder="Madrid" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Textos legales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>URL Aviso legal</Label>
            <Input value={form.terms_url || ''} onChange={e => updateField('terms_url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>URL Política de privacidad</Label>
            <Input value={form.privacy_url || ''} onChange={e => updateField('privacy_url', e.target.value)} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}