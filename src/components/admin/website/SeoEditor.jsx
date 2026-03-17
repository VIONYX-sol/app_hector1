import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function SeoEditor({ form, updateField }) {
  const titleLen = (form.seo_title || '').length;
  const descLen = (form.seo_description || '').length;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO & Metadatos</CardTitle>
            <CardDescription>Cómo aparece tu sitio en Google</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Título SEO</Label>
                <Badge variant={titleLen > 60 ? 'destructive' : titleLen > 0 ? 'default' : 'secondary'} className="text-xs">
                  {titleLen}/60
                </Badge>
              </div>
              <Input
                value={form.seo_title || ''}
                onChange={e => updateField('seo_title', e.target.value)}
                placeholder="Mi Negocio - Reserva salas online"
                maxLength={70}
              />
              <p className="text-xs text-muted-foreground mt-1">Óptimo: 50-60 caracteres</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Meta descripción</Label>
                <Badge variant={descLen > 160 ? 'destructive' : descLen > 0 ? 'default' : 'secondary'} className="text-xs">
                  {descLen}/160
                </Badge>
              </div>
              <Textarea
                value={form.seo_description || ''}
                onChange={e => updateField('seo_description', e.target.value)}
                placeholder="Reserva salas de reuniones y espacios de trabajo profesionales. Disponibilidad en tiempo real y confirmación inmediata."
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">Óptimo: 120-160 caracteres</p>
            </div>
            <div>
              <Label>Imagen para redes sociales (URL)</Label>
              <Input
                value={form.seo_image || ''}
                onChange={e => updateField('seo_image', e.target.value)}
                placeholder="https://... (1200×630px recomendado)"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google preview */}
      <div className="sticky top-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Vista previa en Google</p>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-xs text-green-700">{form.website || 'www.minegocio.com'}</p>
              <p className="text-blue-700 text-base font-medium hover:underline cursor-pointer line-clamp-1">
                {form.seo_title || 'Mi Negocio - Reserva salas online'}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {form.seo_description || 'Reserva salas de reuniones y espacios de trabajo profesionales. Disponibilidad en tiempo real y confirmación inmediata.'}
              </p>
            </div>

            {/* Social card preview */}
            {form.seo_image && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-2">Vista previa al compartir en redes</p>
                <div className="border border-border rounded-xl overflow-hidden">
                  <img src={form.seo_image} alt="og preview" className="w-full h-40 object-cover" onError={e => e.target.style.display='none'} />
                  <div className="p-3 bg-muted">
                    <p className="text-xs text-muted-foreground uppercase">{form.website || 'minegocio.com'}</p>
                    <p className="text-sm font-semibold mt-0.5 line-clamp-1">{form.seo_title}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}