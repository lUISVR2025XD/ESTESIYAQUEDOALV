import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign, Truck, Clock, TrendingUp, Power, PowerOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DeliveryOverview = () => {
  const { user } = useAuth();
  const { orders, deliveryPersons, updateDeliveryPerson } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const deliveryPerson = deliveryPersons.find(d => d.id === user?.id);
  
  if (!deliveryPerson) {
    return <div className="text-white text-center">Cargando datos del repartidor...</div>;
  }

  const myDeliveries = orders.filter(order => order.delivery_person_id === deliveryPerson.id);
  const todayDeliveries = myDeliveries.filter(order => {
    const today = new Date().toDateString();
    return new Date(order.created_at).toDateString() === today;
  });

  const activeDeliveries = myDeliveries.filter(order => order.status === 'delivering');
  const availableOrders = orders.filter(order => order.status === 'ready' && !order.delivery_person_id);

  const todayEarnings = todayDeliveries
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + (order.total_price * 0.15), 0);

  const stats = [
    {
      title: 'Ganancias Hoy',
      value: `$${todayEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      change: `${todayDeliveries.length} entregas`
    },
    {
      title: 'Entregas Activas',
      value: activeDeliveries.length,
      icon: Truck,
      color: 'from-blue-500 to-cyan-600',
      change: 'En proceso'
    },
    {
      title: 'Pedidos Disponibles',
      value: availableOrders.length,
      icon: Clock,
      color: 'from-orange-500 to-amber-600',
      change: 'Listos para recoger'
    },
    {
      title: 'Total Entregas',
      value: deliveryPerson.total_deliveries || 0,
      icon: TrendingUp,
      color: 'from-purple-500 to-violet-600',
      change: 'Historial completo'
    }
  ];

  const toggleOnlineStatus = async () => {
    const newStatus = !deliveryPerson.is_online;
    await updateDeliveryPerson(deliveryPerson.id, { is_online: newStatus });
    
    toast({
      title: newStatus ? "¡Ahora estás en línea!" : "Te has desconectado",
      description: newStatus 
        ? "Comenzarás a recibir notificaciones de nuevos pedidos" 
        : "No recibirás nuevos pedidos hasta que te conectes",
    });
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Panel de Repartidor
        </h1>
        <p className="text-white/70 text-lg">
          Gestiona tus entregas y maximiza tus ganancias
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {deliveryPerson.is_online ? (
                  <Power className="w-6 h-6 text-green-400" />
                ) : (
                  <PowerOff className="w-6 h-6 text-red-400" />
                )}
                <span className="text-white font-medium">
                  Estado: {deliveryPerson.is_online ? 'En línea' : 'Desconectado'}
                </span>
              </div>
              <Button
                onClick={toggleOnlineStatus}
                className={`${
                  deliveryPerson.is_online 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {deliveryPerson.is_online ? 'Desconectarse' : 'Conectarse'}
              </Button>
            </div>
          </CardContent>
        </Card>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-white">Entregas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            {activeDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🚚</div>
                <p className="text-white/70">No tienes entregas activas</p>
                <p className="text-white/60 text-sm">
                  {deliveryPerson.is_online 
                    ? 'Busca nuevos pedidos para comenzar a ganar' 
                    : 'Conéctate para recibir pedidos'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeDeliveries.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">Pedido #{order.id.substring(0,8)}</p>
                      <p className="text-white/70 text-sm">{order.businessName}</p>
                      <p className="text-white/60 text-xs">
                        {order.delivery_address.full_address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">${order.total_price.toFixed(2)}</p>
                      <p className="text-green-400 text-sm">
                        +${(order.total_price * 0.15).toFixed(2)} comisión
                      </p>
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-indigo-500 text-white">
                        En camino
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {deliveryPerson.is_online && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-4"
        >
          <Button
            onClick={() => navigate('/repartidor/pedidos')}
          >
            Buscar Pedidos ({availableOrders.length})
          </Button>
          {activeDeliveries.length > 0 && (
            <Button
              onClick={() => navigate('/repartidor/entregas')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Ver Entregas Activas
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DeliveryOverview;