import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import DeliveryMap from '@/components/maps/DeliveryMap';
import { ArrowLeft, Clock, MapPin, Phone, Star, MessageSquare, Send } from 'lucide-react';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, deliveryPersons, businesses, quickMessages, loading } = useData();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);

  const order = orders.find(o => o.id === orderId);
  const deliveryPerson = order?.delivery_person_id 
    ? deliveryPersons.find(d => d.id === order.delivery_person_id)
    : null;
  const business = order?.business_id
    ? businesses.find(b => b.id === order.business_id)
    : null;
  
  const orderMessages = quickMessages
    .filter(m => m.order_id === orderId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  useEffect(() => {
    if (!loading && !order) {
      toast({
        title: "Pedido no encontrado",
        description: "El pedido que buscas no existe o ya no está disponible.",
        variant: "destructive"
      });
      navigate(-1);
    }
  }, [order, loading, navigate, toast]);

  if (loading || !order || !business) {
    return <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 text-white text-xl">Cargando seguimiento...</div>;
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { title: 'Pedido Recibido', description: 'Tu pedido ha sido enviado al restaurante', color: 'text-yellow-400', progress: 10 };
      case 'accepted': return { title: 'Pedido Aceptado', description: 'El restaurante ha confirmado tu pedido', color: 'text-blue-400', progress: 25 };
      case 'preparing': return { title: 'Preparando tu Pedido', description: 'El restaurante está preparando tu comida', color: 'text-orange-400', progress: 50 };
      case 'ready': return { title: 'Pedido Listo', description: 'Un repartidor recogerá tu pedido pronto', color: 'text-purple-400', progress: 75 };
      case 'delivering': return { title: 'En Camino', description: 'Tu pedido está siendo entregado', color: 'text-indigo-400', progress: 90 };
      case 'delivered': return { title: 'Entregado', description: '¡Tu pedido ha sido entregado exitosamente!', color: 'text-green-400', progress: 100 };
      default: return { title: 'Estado Desconocido', description: '', color: 'text-gray-400', progress: 0 };
    }
  };

  const statusInfo = getStatusInfo(order.status);

  const handleRating = (stars) => {
    setRating(stars);
    toast({
      title: "¡Gracias por tu calificación!",
      description: `Has calificado con ${stars} estrellas`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Seguimiento del Pedido #{order.id.substring(0, 8)}</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className={`text-2xl ${statusInfo.color}`}>{statusInfo.title}</CardTitle>
                <p className="text-white/70">{statusInfo.description}</p>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${statusInfo.progress}%` }} transition={{ duration: 1, delay: 0.5 }} className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" />
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="w-4 h-4" />
                  <span>Tiempo estimado: {business.delivery_time}</span>
                </div>
              </CardContent>
            </Card>

            {deliveryPerson && order.status === 'delivering' && (
              <Card className="glass-card border-0">
                <CardHeader><CardTitle className="text-white">Tu Repartidor</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">{deliveryPerson.name.charAt(0)}</div>
                    <div>
                      <p className="text-white font-medium">{deliveryPerson.name}</p>
                      <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-current" /><span className="text-white/70 text-sm">{deliveryPerson.rating || 'N/A'}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/70"><span>🏍️ {deliveryPerson.vehicle}</span></div>
                  <Button size="sm" variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => toast({ title: "🚧 Función no implementada" })}>
                    <Phone className="w-4 h-4 mr-2" /> Contactar
                  </Button>
                </CardContent>
              </Card>
            )}

            {orderMessages.length > 0 && (
              <Card className="glass-card border-0">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Mensajes del Repartidor</CardTitle></CardHeader>
                <CardContent className="space-y-3 max-h-48 overflow-y-auto">
                  {orderMessages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Send className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white text-sm">{msg.message}</p>
                        <p className="text-white/60 text-xs">{new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="glass-card border-0">
              <CardHeader><CardTitle className="text-white">Detalles del Pedido</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-white font-medium">{business.name}</p>
                  <p className="text-white/70 text-sm">{new Date(order.created_at).toLocaleString('es-ES')}</p>
                </div>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-white/70">{item.quantity}x {item.name}</span>
                      <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/20 pt-2">
                  <div className="flex justify-between font-bold text-white"><span>Total</span><span>${order.total_price.toFixed(2)}</span></div>
                </div>
                {order.delivery_address && <div className="flex items-center gap-2 text-white/70 text-sm"><MapPin className="w-4 h-4" /><span>{order.delivery_address.full_address}</span></div>}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <Card className="glass-card border-0 h-[600px] aspect-video md:aspect-auto">
              <CardContent className="p-0 h-full w-full">
                <DeliveryMap order={order} deliveryPerson={deliveryPerson} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;