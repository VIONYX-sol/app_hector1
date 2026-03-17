import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LivePreviewHero from './LivePreviewHero';

export default function HeroEditor({ form, updateField }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Titular principal</CardTitle>
            <CardDescription>El mensaje más importante de tu portada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título del Hero</Label>
              <Input
                value={form.seo_title || ''}
                onChange={e => updateField('seo_title', e.target.value)}
                placeholder="Ej: Reserva tu espacio ideal"
              />
            </div>
            <div>
              <Label>Subtítulo / descripción</Label>
              <Textarea
                value={form.seo_description || ''}
                onChange={e => updateField('seo_description', e.target.value)}
                placeholder="Ej: Salas profesionales para tu equipo..."
                rows={3}
              />
            </div>
            <div>
              <Label>Imagen de fondo (URL)</Label>
              <Input
                value={form.hero_image || ''}
                onChange={e => updateField('hero_image', e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
              <p className="text-xs text-muted-foreground mt-1">Puedes usar imágenes de Unsplash u otras URLs públicas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métricas de confianza</CardTitle>
            <CardDescription>Datos que aparecen debajo de los botones</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Valor 1</Label>
              <Input value={form.stat1_value || ''} onChange={e => updateField('stat1_value', e.target.value)} placeholder="100%" />
              <Input className="mt-1" value={form.stat1_label || ''} onChange={e => updateField('stat1_label', e.target.value)} placeholder="Online" />
            </div>
            <div>
              <Label className="text-xs">Valor 2</Label>
              <Input value={form.stat2_value || ''} onChange={e => updateField('stat2_value', e.target.value)} placeholder="24/7" />
              <Input className="mt-1" value={form.stat2_label || ''} onChange={e => updateField('stat2_label', e.target.value)} placeholder="Disponible" />
            </div>
            <div>
              <Label className="text-xs">Valor 3</Label>
              <Input value={form.stat3_value || ''} onChange={e => updateField('stat3_value', e.target.value)} placeholder="0€" />
              <Input className="mt-1" value={form.stat3_label || ''} onChange={e => updateField('stat3_label', e.target.value)} placeholder="Coste setup" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live preview */}
      <LivePreviewHero form={form} />
    </div>
  );
}