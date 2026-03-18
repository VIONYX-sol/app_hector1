import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, DoorOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { format, startOfMonth, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminRecentReservations from '../components/admin/AdminRecentReservations';

export default function Admin() {
  const { data: reservations = [] } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: () => adminApi.getReservations({ limit: 100 }),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: () => adminApi.getVenues(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => adminApi.getCustomers({ limit: 100 }),
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  
  // Calculate stats
  const monthReservations = reservations.filter(r => new Date(r.created_at) >= monthStart);
  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed');
  const upcomingReservations = reservations.filter(r => 
    ['pending', 'confirmed'].includes(r.status) && 
    isAfter(new Date(r.start_date), now)
  );
  const activeVenues = venues.filter(v => v.is_active);

  const stats = [
    { 
      title: 'Reservas pendientes', 
      value: pendingReservations.length, 
      icon: AlertCircle, 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    { 
      title: 'Confirmadas', 
      value: confirmedReservations.length, 
      icon: CheckCircle, 
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    { 
      title: 'Próximas', 
      value: upcomingReservations.length, 
      icon: CalendarDays, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    { 
      title: 'Espacios activos', 
      value: activeVenues.length, 
      icon: DoorOpen, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  // Chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = format(d, 'yyyy-MM-dd');
    const dayReservations = reservations.filter(r => 
      format(new Date(r.created_at), 'yyyy-MM-dd') === dayStr
    );
    return {
      name: format(d, 'EEE'),
      reservas: dayReservations.length,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen general del negocio</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevas reservas (últimos 7 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="reservas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  <span className="text-sm">Reservas este mes</span>
                </div>
                <span className="font-bold">{monthReservations.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm">Total clientes</span>
                </div>
                <span className="font-bold">{customers.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DoorOpen className="w-5 h-5 text-primary" />
                  <span className="text-sm">Espacios disponibles</span>
                </div>
                <span className="font-bold">{activeVenues.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminRecentReservations reservations={reservations.slice(0, 10)} />
    </div>
  );
}