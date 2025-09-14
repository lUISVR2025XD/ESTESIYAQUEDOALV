import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Star, Package } from 'lucide-react';
import StarDisplay from '@/components/ui/StarDisplay';

const BusinessStats = () => {
  const { user } = useAuth();
  const { orders, businesses, products } = useData();

  const business = businesses.find(b => b.id === user?.id);
  const businessOrders = business ? orders.filter(order => order.business_id === business.id) : [];
  const businessProducts = business ? products.filter(p => p.business_id === business.id) : [];

  const totalRevenue = businessOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total_price, 0);
  const totalOrders = businessOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const avgRating = business?.rating || 0;

  const statsCards = [
    { title: 'Ingresos Totales', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
    { title: 'Pedidos Totales', value: totalOrders, icon: ShoppingBag },
    { title: 'Valor Promedio Pedido', value: `$${avgOrderValue.toFixed(2)}`, icon: DollarSign },
    { title: 'Calificación Promedio', value: avgRating.toFixed(1), icon: Star, isRating: true },
  ];

  const productsSold = businessOrders.flatMap(o => o.items).reduce((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + item.quantity;
    return acc;
  }, {});

  const topProductsData = Object.entries(productsSold)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const ordersByStatus = businessOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Estadísticas y Reportes</h1>
          <p className="text-white/70 text-lg">Analiza el rendimiento de tu restaurante.</p>
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
                {stat.isRating ? (
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={parseFloat(stat.value)} />
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Package className="w-5 h-5" /> Top 5 Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis type="number" stroke="rgba(255, 255, 255, 0.7)" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="rgba(255, 255, 255, 0.7)" fontSize={12} width={100} tick={{ fill: 'rgba(255, 255, 255, 0.7)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 30, 30, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }} />
                    <Bar dataKey="quantity" name="Cantidad vendida" fill="#8884d8" background={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><BarChart className="w-5 h-5" /> Distribución de Estados de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 30, 30, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }} />
                    <Legend wrapperStyle={{ color: '#fff', fontSize: '14px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BusinessStats;