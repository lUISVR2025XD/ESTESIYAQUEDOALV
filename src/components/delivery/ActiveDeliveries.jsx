import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { MapPin, Phone, CheckCircle, Navigation, StickyNote, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ActiveDeliveries = () => {
  const { user } = useAuth();
  const { orders, updateOrder, deliveryPersons, updateDeliveryPerson, clients, businesses, sendQuickMessage } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const deliveryPerson = deliveryPersons.find(d => d.id === user?.id);
  const activeDeliveries = deliveryPerson ? orders.filter(order => 
    order.delivery_person_id === deliveryPerson.id && 
    order.status === 'delivering'
  ) : [];

  const quickMessages = [
    "Pedido en camino",
    "Estoy afuera",
    "Llego en 5 minutos",
    "Llego en 10 minutos",
    "Llego en 15 minutos"
  ];

  const handleSendQuickMessage = async (order, message) => {
    const { error } = await sendQuickMessage(order.id, order.client_id, message);
    if (error) {
      toast({ title: "Error al enviar mensaje", variant: "destructive" });
    } else {
      toast({ title: "Mensaje enviado al cliente" });
    }
  };

  const handleCompleteDelivery = async (order) => {
    await updateOrder(order.id, { status: 'delivered' });
    
    const commission = order.total_price * 0.15;
    await updateDeliveryPerson(deliveryPerson.id, {
      total_deliveries: (deliveryPerson.total_deliveries || 0) + 1,
      earnings: (deliveryPerson.earnings || 0) + commission
    });

    toast({
      title: "¡Entrega completada!",
      description: `Has ganado $${commission.toFixed(2)} por esta entrega`,
    });
  };

  const handleContactClient = (order) => {
    const client = clients.find(c => c.id === order.client_id);
    if (client && client.phone) {
      if (window.confirm(`¿Quieres llamar a ${client.name} al número ${client.phone}?`)) {
        window.location.href = `tel:${client.phone}`;
      }
    } else {
      toast({
        title: "No se pudo contactar al cliente",
        description: "El número de teléfono del cliente no está disponible.",
        variant: "destructive",
      });
    }
  };

  const handleNavigate = (address) => {
    const query = encodeURIComponent(address.full_address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Entregas Activas
        </h1>
        <p className="text-white/70 text-lg">
          Gestiona tus entregas en curso
        </p>
      </motion.div>

      <div className="space-y-6">
        {activeDeliveries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🚚</div>
            <h3 className="text-2xl font-bold text-white mb-2">No tienes entregas activas</h3>
            <p className="text-white/70 mb-6">
              Busca nuevos pedidos para comenzar a ganar
            </p>
            <Button
              onClick={() => navigate('/repartidor/pedidos')}
            >
              Buscar Pedidos
            </Button>
          </motion.div>
        ) : (
          activeDeliveries.map((order, index) => {
            const business = businesses.find(b => b.id === order.business_id);
            const client = clients.find(c => c.id === order.client_id);
            return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="glass-card border-0">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">
                        Pedido #{order.id.substring(0,8)}
                      </CardTitle>
                      <p className="text-white/70">{business?.name}</p>
                      <p className="text-white/60 text-sm">
                        Cliente: {client?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-2">
                        En camino
                      </div>
                      <p className="text-white font-bold text-lg">${order.total_price.toFixed(2)}</p>
                      <p className="text-green-400 text-sm">
                        +${(order.total_price * 0.15).toFixed(2)} para ti
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {order.special_notes && (
                    <div className="bg-yellow-200/80 text-yellow-900 p-3 rounded-lg flex items-start gap-3">
                      <StickyNote className="w-5 h-5 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold">Notas Especiales</h4>
                        <p className="text-sm">{order.special_notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-400" />
                          Dirección de entrega
                        </h4>
                        <p className="text-white/70">
                          {order.delivery_address.full_address}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNavigate(order.delivery_address)}
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Navegar
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Enviar Mensaje
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 glass-card border-0 text-white">
                        {quickMessages.map((msg) => (
                          <DropdownMenuItem key={msg} onSelect={() => handleSendQuickMessage(order, msg)}>
                            {msg}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      onClick={() => handleCompleteDelivery(order)}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Entregado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )})
        )}
      </div>
    </div>
  );
};

export default ActiveDeliveries;