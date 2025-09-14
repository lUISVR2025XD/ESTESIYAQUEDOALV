import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Clock, CheckCircle, XCircle, Package, UtensilsCrossed, StickyNote, Save } from 'lucide-react';
import { calculateTotalDeliveryTime } from '@/lib/utils';
import ReloadButton from '@/components/ReloadButton';

const OrderCard = ({ order, onStatusChange, onPrepTimeSet, getClientName, getStatusColor, getStatusText, business }) => {
  const [timeLeft, setTimeLeft] = useState(180);
  const [prepTimeInput, setPrepTimeInput] = useState('');

  useEffect(() => {
    if (order.status === 'pending') {
      const createdTime = new Date(order.created_at).getTime();
      const now = new Date().getTime();
      const diffInSeconds = Math.floor((now - createdTime) / 1000);
      const initialTimeLeft = 180 - diffInSeconds;

      if (initialTimeLeft <= 0) {
        onStatusChange(order.id, 'cancelled');
        return;
      }
      
      setTimeLeft(initialTimeLeft);

      const timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            onStatusChange(order.id, 'cancelled');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [order.id, order.status, order.created_at, onStatusChange]);

  const handleSetPrepTime = () => {
    const time = parseInt(prepTimeInput, 10);
    if (!isNaN(time) && time > 0) {
      onPrepTimeSet(order.id, time);
      setPrepTimeInput('');
    }
  };

  const getNextActions = (order) => {
    switch (order.status) {
      case 'pending':
        return [
          { action: 'accepted', label: 'Aceptar', icon: CheckCircle, color: 'bg-green-600' },
          { action: 'cancelled', label: 'Rechazar', icon: XCircle, color: 'bg-red-600' }
        ];
      case 'accepted':
        return order.preparation_time ? [
          { action: 'preparing', label: 'Empezar a Preparar', icon: Package, color: 'bg-orange-600' }
        ] : [];
      case 'preparing':
        return [
          { action: 'ready', label: 'Listo para Recoger', icon: UtensilsCrossed, color: 'bg-purple-600' }
        ];
      case 'ready':
        return [
          { action: 'delivered', label: 'Entregado (Recogido)', icon: CheckCircle, color: 'bg-green-600' }
        ];
      default:
        return [];
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const totalTime = business && order.preparation_time ? calculateTotalDeliveryTime(order, business) : '';

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-white">
              Pedido #{order.id.substring(0, 8)}
            </CardTitle>
            <p className="text-white/70">{getClientName(order.client_id)}</p>
            <p className="text-white/60 text-sm">
              {new Date(order.created_at).toLocaleString('es-ES')}
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </div>
            <p className="text-white font-bold text-lg mt-1">
              ${order.total_price.toFixed(2)}
            </p>
            {totalTime && (
              <div className="flex items-center justify-end gap-1 mt-1 text-cyan-300">
                <Clock className="w-4 h-4" />
                <span>~{totalTime}</span>
              </div>
            )}
            {order.status === 'pending' && timeLeft > 0 && (
              <div className="flex items-center justify-end gap-1 mt-1 text-yellow-300">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {order.special_notes && (
          <div className="bg-yellow-200/80 text-yellow-900 p-3 rounded-lg flex items-start gap-3">
            <StickyNote className="w-5 h-5 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-bold">Notas Especiales</h4>
              <p className="text-sm">{order.special_notes}</p>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-white font-medium mb-2">Productos:</h4>
          <div className="space-y-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-white/70">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-white">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-medium mb-1">Dirección de entrega:</h4>
          <p className="text-white/70 text-sm">
            {order.delivery_address.full_address}
          </p>
        </div>

        {order.status === 'accepted' && order.preparation_time === null && (
          <div className="bg-white/10 p-3 rounded-lg space-y-2">
            <label className="text-white font-medium text-sm">Tiempo de preparación (minutos):</label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                placeholder="Ej: 20" 
                value={prepTimeInput}
                onChange={(e) => setPrepTimeInput(e.target.value)}
              />
              <Button onClick={handleSetPrepTime} size="sm">
                <Save className="w-4 h-4 mr-1" />
                Guardar
              </Button>
            </div>
          </div>
        )}

        {getNextActions(order).length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-white/20 mt-4">
            {getNextActions(order).map((action) => (
              <Button
                key={action.action}
                size="sm"
                onClick={() => onStatusChange(order.id, action.action)}
                className={`${action.color} hover:opacity-90 text-white`}
              >
                <action.icon className="w-4 h-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


const OrderManagement = () => {
  const { user } = useAuth();
  const { orders, updateOrder, businesses, clients } = useData();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState('all');

  const business = businesses.find(b => b.id === user?.id);
  const businessOrders = business 
    ? orders.filter(order => order.business_id === business.id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];

  const filteredOrders = selectedStatus === 'all' 
    ? businessOrders 
    : businessOrders.filter(order => order.status === selectedStatus);

  const statusFilters = [
    { key: 'all', label: 'Todos', count: businessOrders.length },
    { key: 'pending', label: 'Pendientes', count: businessOrders.filter(o => o.status === 'pending').length },
    { key: 'accepted', label: 'Aceptados', count: businessOrders.filter(o => o.status === 'accepted').length },
    { key: 'preparing', label: 'Preparando', count: businessOrders.filter(o => o.status === 'preparing').length },
    { key: 'ready', label: 'Listos', count: businessOrders.filter(o => o.status === 'ready').length },
    { key: 'delivered', label: 'Entregados', count: businessOrders.filter(o => o.status === 'delivered').length },
    { key: 'cancelled', label: 'Cancelados', count: businessOrders.filter(o => o.status === 'cancelled').length },
  ];

  const handlePrepTimeSet = async (orderId, prepTime) => {
    await updateOrder(orderId, { preparation_time: prepTime });
    toast({
      title: 'Tiempo de preparación guardado',
      description: `El pedido #${orderId.substring(0,8)} se preparará en ${prepTime} minutos.`,
    });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (newStatus === 'cancelled' && order.status !== 'pending') {
      if(order.status !== 'cancelled') {
        await updateOrder(orderId, { status: newStatus });
        toast({ title: 'Pedido Cancelado' });
      }
      return;
    }

    if (newStatus !== 'cancelled' && order.status !== 'pending' && newStatus === 'accepted') {
      return;
    }
    
    await updateOrder(orderId, { status: newStatus });
    
    const statusMessages = {
      accepted: 'Pedido aceptado',
      preparing: 'Pedido en preparación',
      ready: 'Pedido listo para recoger',
      delivered: 'Pedido marcado como entregado (recogido)',
      cancelled: 'Pedido cancelado'
    };

    toast({
      title: statusMessages[newStatus] || 'Estado actualizado',
      description: `El pedido #${orderId.substring(0,8)} ha sido actualizado`,
      variant: newStatus === 'cancelled' ? 'destructive' : 'default'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-purple-500';
      case 'delivering': return 'bg-indigo-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Pendiente',
      accepted: 'Aceptado',
      preparing: 'Preparando',
      ready: 'Listo para Recoger',
      delivering: 'En Camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return statusMap[status] || status;
  };
  
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente Anónimo';
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Gestión de Pedidos
          </h1>
          <p className="text-white/70 text-lg">
            Administra y actualiza el estado de tus pedidos
          </p>
        </div>
        <ReloadButton />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 justify-center"
      >
        {statusFilters.map((filter) => (
          <Button
            key={filter.key}
            variant={selectedStatus === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus(filter.key)}
          >
            {filter.label} ({filter.count})
          </Button>
        ))}
      </motion.div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {selectedStatus === 'all' ? 'No hay pedidos' : `No hay pedidos ${statusFilters.find(f => f.key === selectedStatus)?.label.toLowerCase()}`}
            </h3>
            <p className="text-white/70">
              Los nuevos pedidos aparecerán aquí automáticamente
            </p>
          </motion.div>
        ) : (
          filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <OrderCard 
                order={order}
                onStatusChange={handleStatusChange}
                onPrepTimeSet={handlePrepTimeSet}
                getClientName={getClientName}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                business={business}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderManagement;