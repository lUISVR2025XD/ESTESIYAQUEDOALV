import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import AdminGlobalMap from '@/components/maps/AdminGlobalMap';

const RealtimeMap = () => {
  const { orders, deliveryPersons, businesses, loading } = useData();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysOrders = orders.filter(order => new Date(order.created_at) >= today);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Mapa Global de Entregas
          </h1>
          <p className="text-white/70 text-lg">
            Visualiza todas las entregas del día con sus estados en tiempo real
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card border-0 aspect-video md:aspect-[16/7]">
          <CardContent className="p-0 h-full w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white">Cargando mapa...</p>
              </div>
            ) : todaysOrders.length > 0 ? (
              <AdminGlobalMap
                orders={todaysOrders}
                deliveryPersons={deliveryPersons}
                businesses={businesses}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">🗺️</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No hay entregas hoy</h3>
                  <p className="text-white/70">
                    Los pedidos de hoy aparecerán aquí en tiempo real
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RealtimeMap;