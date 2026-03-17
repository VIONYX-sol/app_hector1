import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function BrandingEditor({ form, updateField }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidad visual</CardTitle>
            <CardDescription>Logo, colores y nombre del negocio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre del negocio</Label>
              <Input value={form.name || ''} onChange={e => updateField('name', e.target.value)} placeholder="Mi Negocio" />
            </div>
            <div>
              <Label>URL del logo</Label>
              <Input value={form.logo_url || ''} onChange={e => updateField('logo_url', e.target.value)} placeholder="https://..." />
              {form.logo_url && (
                <div className="mt-2 p-3 bg-muted rounded-lg flex items-center justify-center">
                  <img src={form.logo_url} alt="logo preview" className="h-12 object-contain" onError={e => e.target.style.display='none'} />
                </div>
              )}
            </div>
            <div>
              <Label>Color principal de la marca</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={form.primary_color || '#2563eb'}
                  onChange={e => updateField('primary_color', e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border border-input"
                />
                <Input
                  value={form.primary_color || '#2563eb'}
                  onChange={e => updateField('primary_color', e.target.value)}
                  placeholder="#2563eb"
                  className="flex-1 font-mono"
                />
              </div>
              <div className="mt-3 rounded-lg overflow-hidden">
                <div className="h-8 w-full" style={{ backgroundColor: form.primary_color || '#2563eb' }} />
                <p className="text-xs text-muted-foreground text-center py-1">Vista previa del color</p>
              </div>
            </div>
            <div>
              <Label>Descripción del negocio</Label>
              <Textarea value={form.description || ''} onChange={e => updateField('description', e.target.value)} rows={3} placeholder="Describe tu negocio..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Redes sociales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Instagram</Label>
              <Input value={form.social_instagram || ''} onChange={e => updateField('social_instagram', e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input value={form.social_facebook || ''} onChange={e => updateField('social_facebook', e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input value={form.social_linkedin || ''} onChange={e => updateField('social_linkedin', e.target.value)} placeholder="https://linkedin.com/..." />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live brand preview */}
      <div className="sticky top-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Vista previa de marca</p>
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Navbar preview */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Barra de navegación</p>
              <div className="border border-border rounded-lg px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="logo" className="h-6 w-auto object-contain" onError={e => e.target.style.display='none'} />
                  ) : (
                    <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                         style={{ backgroundColor: form.primary_color || '#2563eb' }}>
                      {(form.name || 'M')[0]}
                    </div>
                  )}
                  <span className="text-sm font-bold">{form.name || 'Mi Negocio'}</span>
                </div>
                <div className="text-xs px-3 py-1 rounded text-white font-medium"
                     style={{ backgroundColor: form.primary_color || '#2563eb' }}>
                  Reservar ahora
                </div>
              </div>
            </div>

            {/* Button preview */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Botones de acción</p>
              <div className="flex gap-2">
                <div className="px-4 py-2 rounded-lg text-sm text-white font-medium"
                     style={{ backgroundColor: form.primary_color || '#2563eb' }}>
                  Reservar ahora
                </div>
                <div className="px-4 py-2 rounded-lg text-sm font-medium border border-input">
                  Ver espacios
                </div>
              </div>
            </div>

            {/* Color palette */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Paleta de color</p>
              <div className="flex gap-2">
                {[1, 0.8, 0.6, 0.2, 0.1].map(opacity => (
                  <div key={opacity} className="flex-1 h-8 rounded"
                       style={{ backgroundColor: form.primary_color || '#2563eb', opacity }} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}