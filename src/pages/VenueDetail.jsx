import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, CalendarCheck, Users, MapPin, Check,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export default function VenueDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: venue, isLoading, error } = useQuery({
    queryKey: ['venue', slug],
    queryFn: () => publicApi.getVenue(slug),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Espacio no encontrado</h1>
          <p className="text-muted-foreground mb-4">El espacio que buscas no existe o ha sido eliminado.</p>
          <Link to="/">
            <Button variant="outline">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = venue.images?.length > 0 
    ? venue.images 
    : ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'];

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  const handleReserve = () => {
    navigate('/booking', { state: { venueId: venue.id, venueSlug: venue.slug } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </Link>
          <Button onClick={handleReserve} className="gap-2">
            <CalendarCheck className="w-4 h-4" />
            Reservar
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
              <img
                src={images[currentImageIndex]}
                alt={venue.name}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'; }}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`aspect-[4/3] rounded-lg overflow-hidden ${
                      i === currentImageIndex ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${venue.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{venue.name}</h1>
              {venue.location_text && (
                <p className="text-muted-foreground flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4" />
                  {venue.location_text}
                </p>
              )}
            </div>

            {/* Quick info */}
            <div className="flex flex-wrap gap-4">
              {venue.capacity && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Capacidad</p>
                    <p className="text-muted-foreground">Hasta {venue.capacity} personas</p>
                  </div>
                </div>
              )}
              {venue.price_from && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-bold">€</span>
                  </div>
                  <div>
                    <p className="font-medium">Precio</p>
                    <p className="text-muted-foreground">Desde {venue.price_from}€/día</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {venue.full_description && (
              <div>
                <h2 className="font-semibold text-foreground mb-2">Descripción</h2>
                <p className="text-muted-foreground whitespace-pre-line">{venue.full_description}</p>
              </div>
            )}

            {/* Features/amenities */}
            {venue.features?.length > 0 && (
              <div>
                <h2 className="font-semibold text-foreground mb-3">Características</h2>
                <div className="flex flex-wrap gap-2">
                  {venue.features.map((feature, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      <Check className="w-3 h-3" />
                      {feature.name || feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="pt-4 border-t border-border">
              <Button onClick={handleReserve} size="lg" className="w-full gap-2 h-12">
                <CalendarCheck className="w-5 h-5" />
                Solicitar reserva
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Selecciona las fechas disponibles y envía tu solicitud de reserva
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
