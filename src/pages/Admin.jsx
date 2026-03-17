import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, DoorOpen } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import AdminRecentReservations from '../components/admin/AdminRecentReservations';

export default function Admin() {
  const { data: reservations = [] } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 100),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers-count'],
    queryFn: () => base44.entities.Customer.list('-created_date', 100),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['admin-rooms'],
    queryFn: () => base44.entities.Room.list('sort_order', 50),
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthReservations = reservations.filter(r => new Date(r.created_date) >= monthStart);
  const activeReservations = reservations.filter(r => ['confirmed', 'paid', 'pending_deposit'].includes(r.status));
  const monthRevenue = monthReservations.reduce((s, r) => s + (r.total_amount || 0), 0);

  const stats = [
    { title: 'Reservas activas', value: activeReservations.length, icon: CalendarDays, change: '+12%', up: true },
    { title: 'Clientes', value: customers.length, icon: Users, change: '+8%', up: true },
    { title: 'Ingresos del mes', value: `${monthRevenue.toFixed(0)}€`, icon: CreditCard, change: '+23%', up: true },
    { title: 'Salas activas', value: rooms.filter(r => r.status === 'active').length, icon: DoorOpen, change: '', up: true },
  ];

  // Chart data (last 7 days placeholder)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = format(d, 'yyyy-MM-dd');
    const dayReservations = reservations.filter(r => r.date === dayStr);
    return {
      name: format(d, 'EEE'),
      reservas: dayReservations.length,
      ingresos: dayReservations.reduce((s, r) => s + (r.total_amount || 0), 0),
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
                  {stat.change && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${stat.up ? 'text-green-600' : 'text-red-500'}`}>
                      {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span>{stat.change} vs mes anterior</span>
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservas (últimos 7 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="reservas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos (últimos 7 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="ingresos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <AdminRecentReservations reservations={reservations.slice(0, 10)} />
    </div>
  );
}