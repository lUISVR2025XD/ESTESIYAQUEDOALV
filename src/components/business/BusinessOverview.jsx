import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { DollarSign, ShoppingBag, Clock, TrendingUp } from 'lucide-react';

const BusinessOverview = () => {
  const { user } = useAuth();
  const { orders, businesses } = useData();

  const business = businesses.find(b => b.id === user?.id);
  const businessOrders = orders.filter(order => order.business_id === business?.id);
  
  const todayOrders = businessOrders.filter(order => {
    const today = new Date().toDateString();
    return new Date(order.created_at).toDateString() === today;
  });

  const totalRevenue = businessOrders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + order.total_price, 0);

  const pendingOrders = businessOrders.filter(order => order.status === 'pending').length;
  const activeOrders = businessOrders.filter(order => 
    ['accepted', 'preparing', 'ready', 'delivering'].includes(order.status)
  ).length;

  const stats = [
    {
      title: 'Ingresos Totales',
      value: `${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      change: '+12.5%'
    },
    {
      title: 'Pedidos Hoy',
      value: todayOrders.length,
      icon: ShoppingBag,
      color: 'from-blue-500 to-cyan-600',
      change: '+8.2%'
    },
    {
      title: 'Pedidos Pendientes',
      value: pendingOrders,
      icon: Clock,
      color: 'from-orange-500 to-amber-600',
      change: pendingOrders > 0 ? 'Requiere atención' : 'Todo al día'
    },
    {
      title: 'Pedidos Activos',
      value: activeOrders,
      icon: TrendingUp,
      color: 'from-purple-500 to-violet-600',
      change: `${activeOrders} en proceso`
    }
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Panel de Control - {business?.name}
          </h1>
          <p className="text-white/70 text-lg">
            Gestiona tu restaurante y supervisa tus pedidos
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="glass-card border-0 hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    <p className="text-white/60 text-sm mt-1">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
    </div>
  );
};

export default BusinessOverview;