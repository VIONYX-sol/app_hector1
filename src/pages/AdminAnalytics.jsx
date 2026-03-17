import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, CalendarDays, CreditCard, DoorOpen, XCircle } from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(160, 60%, 45%)', 'hsl(30, 80%, 55%)', 'hsl(280, 65%, 60%)', 'hsl(340, 75%, 55%)'];

export default function AdminAnalytics() {
  const { data: reservations = [] } = useQuery({
    queryKey: ['analytics-reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 500),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['analytics-rooms'],
    queryFn: () => base44.entities.Room.list('name', 50),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['analytics-expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 200),
  });

  const monthStart = startOfMonth(new Date());
  const monthRes = reservations.filter(r => new Date(r.created_date) >= monthStart);
  const monthRevenue = monthRes.reduce((s, r) => s + (r.total_amount || 0), 0);
  const monthExpenses = expenses.filter(e => new Date(e.date) >= monthStart).reduce((s, e) => s + (e.total || e.amount || 0), 0);
  const cancellations = reservations.filter(r => r.status === 'cancelled').length;
  const conversionRate = reservations.length > 0
    ? ((reservations.filter(r => ['confirmed','paid','completed'].includes(r.status)).length / reservations.length) * 100).toFixed(1)
    : 0;

  // Reservations by room
  const byRoom = rooms.map(room => ({
    name: room.name,
    value: reservations.filter(r => r.room_id === room.id).length,
  })).filter(r => r.value > 0);

  // Revenue last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const dayStr = format(d, 'yyyy-MM-dd');
    const dayRes = reservations.filter(r => r.date === dayStr);
    return {
      name: format(d, 'dd'),
      ingresos: dayRes.reduce((s, r) => s + (r.total_amount || 0), 0),
      reservas: dayRes.length,
    };
  });

  // Status distribution
  const statusDist = Object.entries(
    reservations.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const kpis = [
    { title: 'Ingresos del mes', value: `${monthRevenue.toFixed(0)}€`, icon: CreditCard },
    { title: 'Gastos del mes', value: `${monthExpenses.toFixed(0)}€`, icon: TrendingUp },
    { title: 'Reservas del mes', value: monthRes.length, icon: CalendarDays },
    { title: 'Tasa conversión', value: `${conversionRate}%`, icon: Users },
    { title: 'Cancelaciones', value: cancellations, icon: XCircle },
    { title: 'Margen estimado', value: `${(monthRevenue - monthExpenses).toFixed(0)}€`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analítica</h1>
        <p className="text-muted-foreground text-sm mt-1">Métricas y rendimiento del negocio</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Ingresos (últimos 30 días)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={last30}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="ingresos" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Reservas por sala</CardTitle></CardHeader>
          <CardContent>
            {byRoom.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byRoom} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {byRoom.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Reservas (últimos 30 días)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={last30}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="reservas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Distribución por estado</CardTitle></CardHeader>
          <CardContent>
            {statusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}