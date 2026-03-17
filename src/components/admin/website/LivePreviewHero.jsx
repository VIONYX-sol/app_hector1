import React from 'react';
import { CalendarCheck, ArrowRight } from 'lucide-react';

export default function LivePreviewHero({ form }) {
  return (
    <div className="sticky top-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Vista previa</p>
      <div className="rounded-2xl border border-border overflow-hidden shadow-lg bg-white scale-100">
        {/* Fake navbar */}
        <div className="bg-white border-b border-border px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {form.logo_url ? (
              <img src={form.logo_url} alt="logo" className="h-5 w-auto object-contain" />
            ) : (
              <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                <CalendarCheck className="w-3 h-3 text-white" />
              </div>
            )}
            <span className="text-xs font-bold text-foreground">{form.name || 'Mi Negocio'}</span>
          </div>
          <div
            className="text-xs px-2 py-1 rounded text-white font-medium"
            style={{ backgroundColor: form.primary_color || '#2563eb' }}
          >
            Reservar
          </div>
        </div>

        {/* Hero preview */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={form.hero_image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'}
            alt="hero"
            className="w-full h-full object-cover"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <p className="text-white font-bold text-sm leading-tight mb-1">
              {form.seo_title || 'Reserva tu espacio ideal'}
            </p>
            <p className="text-white/80 text-xs leading-snug line-clamp-2 mb-3">
              {form.seo_description || 'Salas profesionales para tu equipo.'}
            </p>
            <div
              className="inline-flex items-center gap-1 text-white text-xs px-3 py-1.5 rounded-lg font-medium w-fit"
              style={{ backgroundColor: form.primary_color || '#2563eb' }}
            >
              <CalendarCheck className="w-3 h-3" />
              Reservar ahora
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Stats preview */}
        <div className="bg-white px-6 py-4 flex items-center justify-around border-t border-border">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{form.stat1_value || '100%'}</p>
            <p className="text-xs text-muted-foreground">{form.stat1_label || 'Online'}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{form.stat2_value || '24/7'}</p>
            <p className="text-xs text-muted-foreground">{form.stat2_label || 'Disponible'}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{form.stat3_value || '0€'}</p>
            <p className="text-xs text-muted-foreground">{form.stat3_label || 'Coste setup'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}