import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, Users, Truck, Clock } from 'lucide-react';

const GlobalStats = () => {
  const { orders, orderHistory, businesses, deliveryPersons, clients } = useData();

  const allHistoricalAndActiveOrders = [...orderHistory, ...orders];
  
  const totalRevenue = allHistoricalAndActiveOrders
    .filter(o => o.status === 'delivered' || (orderHistory.some(oh => oh.id === o.id)))
    .reduce((sum, o) => sum + parseFloat(o.total_price), 0);
  
  const totalOrders = allHistoricalAndActiveOrders.length;
  const totalUsers = clients.length + businesses.length + deliveryPersons.length;
  const activeDeliveries = orders.filter(o => o.status === 'delivering').length;

  const statsCards = [
    { title: 'Ingresos Totales', value: `${totalRevenue.toFixed(2)}`, icon: DollarSign },
    { title: 'Pedidos Históricos', value: totalOrders, icon: BarChart },
    { title: 'Usuarios Totales', value: totalUsers, icon: Users },
    { title: 'Entregas Activas', value: activeDeliveries, icon: Truck },
  ];

  const ordersByHour = allHistoricalAndActiveOrders.reduce((acc, order) => {
    const hour = new Date(order.created_at).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const chartDataHours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    pedidos: ordersByHour[i] || 0,
  }));

  const ordersByBusiness = allHistoricalAndActiveOrders.reduce((acc, order) => {
    const businessName = businesses.find(b => b.id === order.business_id)?.name || 'Desconocido';
    acc[businessName] = (acc[businessName] || 0) + 1;
    return acc;
  }, {});

  const chartDataBusiness = Object.entries(ordersByBusiness)
    .map(([name, pedidos]) => ({ name, pedidos }))
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Estadísticas Globales</h1>
          <p className="text-white/70 text-lg">Análisis detallado del rendimiento de la plataforma.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
            <Card className="glass-card border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-white/50" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5" /> Pedidos por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataHours} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="hour" stroke="rgba(255, 255, 255, 0.7)" fontSize={12} />
                    <YAxis stroke="rgba(255, 255, 255, 0.7)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 30, 30, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }} />
                    <Legend wrapperStyle={{ color: '#fff', fontSize: '14px' }} />
                    <Line type="monotone" dataKey="pedidos" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Users className="w-5 h-5" /> Top 10 Negocios por Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataBusiness} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis type="number" stroke="rgba(255, 255, 255, 0.7)" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="rgba(255, 255, 255, 0.7)" fontSize={12} width={100} tick={{ fill: 'rgba(255, 255, 255, 0.7)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 30, 30, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }} />
                    <Legend wrapperStyle={{ color: '#fff', fontSize: '14px' }} />
                    <Bar dataKey="pedidos" fill="#82ca9d" background={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default GlobalStats;