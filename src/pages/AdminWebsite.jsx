import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Globe, Palette, Image, MapPin, Search, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import BrandingEditor from '@/components/admin/website/BrandingEditor';
import HeroEditor from '@/components/admin/website/HeroEditor';
import ContactEditor from '@/components/admin/website/ContactEditor';
import SeoEditor from '@/components/admin/website/SeoEditor';

export default function AdminWebsite() {
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['admin-website-company'],
    queryFn: () => base44.entities.Company.list('name', 1),
  });

  const company = companies[0] || {};
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!isLoading) {
      setForm(company);
    }
  }, [isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (company.id) {
        return base44.entities.Company.update(company.id, data);
      }
      return base44.entities.Company.create({ ...data, status: 'active' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-website-company'] });
      queryClient.invalidateQueries({ queryKey: ['home-company'] });
      queryClient.invalidateQueries({ queryKey: ['public-company'] });
      toast.success('Cambios guardados y publicados');
    },
    onError: () => toast.error('Error al guardar los cambios'),
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
          <h1 className="text-2xl font-bold text-foreground">Sitio web</h1>
          <p className="text-muted-foreground text-sm mt-1">Personaliza la apariencia y contenido de tu web pública</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/Home', '_blank')}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            Ver web
          </Button>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            className="gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publicar cambios
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="w-4 h-4" />
            Marca
          </TabsTrigger>
          <TabsTrigger value="hero" className="gap-2">
            <Image className="w-4 h-4" />
            Portada
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <MapPin className="w-4 h-4" />
            Contacto
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="w-4 h-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="mt-6">
          <BrandingEditor form={form} updateField={updateField} />
        </TabsContent>

        <TabsContent value="hero" className="mt-6">
          <HeroEditor form={form} updateField={updateField} />
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <ContactEditor form={form} updateField={updateField} />
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <SeoEditor form={form} updateField={updateField} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
