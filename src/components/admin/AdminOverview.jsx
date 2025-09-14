import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { DollarSign, ShoppingBag, Users, Truck } from 'lucide-react';

const AdminOverview = () => {
  const { orders, businesses, deliveryPersons, clients } = useData();

  const totalRevenue = orders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + order.total_price, 0);
  
  const totalOrders = orders.length;
  const totalUsers = businesses.length + deliveryPersons.length + clients.length;
  const activeDeliveries = orders.filter(order => order.status === 'delivering').length;

  const stats = [
    {
      title: 'Ingresos Totales',
      value: `${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      description: 'Ingresos de todos los pedidos completados'
    },
    {
      title: 'Pedidos Totales',
      value: totalOrders,
      icon: ShoppingBag,
      color: 'from-blue-500 to-cyan-600',
      description: 'Número total de pedidos en la plataforma'
    },
    {
      title: 'Usuarios Totales',
      value: totalUsers,
      icon: Users,
      color: 'from-purple-500 to-violet-600',
      description: 'Clientes, negocios y repartidores'
    },
    {
      title: 'Entregas Activas',
      value: activeDeliveries,
      icon: Truck,
      color: 'from-orange-500 to-amber-600',
      description: 'Pedidos actualmente en camino'
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
            Panel de Administrador
          </h1>
          <p className="text-white/70 text-lg">
            Visión general de la plataforma
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
                    <p className="text-white/60 text-sm mt-1">{stat.description}</p>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-white">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-white/70">No hay actividad reciente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order, index) => {
                  const client = clients.find(c => c.id === order.client_id);
                  const business = businesses.find(b => b.id === order.business_id);
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">Pedido #{order.id.substring(0, 8)}</p>
                        <p className="text-white/70 text-sm">
                          {business?.name || 'N/A'} → {client?.name || 'N/A'}
                        </p>
                        <p className="text-white/60 text-xs">
                          {new Date(order.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">${order.total_price.toFixed(2)}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-500 text-white' :
                          order.status === 'delivering' ? 'bg-indigo-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminOverview;