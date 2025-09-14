
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Minus, Trash2, MapPin, CreditCard, LocateFixed, StickyNote, Loader2 } from 'lucide-react';
import LocationPicker from '@/components/maps/LocationPicker';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addOrder, businesses } = useData();
  const { toast } = useToast();
  
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('deliveryApp_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    full_address: '',
    coordinates: { lat: 19.4326, lng: -99.1332 }
  });
  const [triggerLocate, setTriggerLocate] = useState(0);

  useEffect(() => {
    localStorage.setItem('deliveryApp_cart', JSON.stringify(cart));
  }, [cart]);

  const updateCart = (newCart) => {
    setCart(newCart);
  };

  const updateQuantity = (productId, change) => {
    const newCart = cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean);
    
    updateCart(newCart);
  };

  const removeItem = (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    updateCart(newCart);
    toast({
      title: "Producto eliminado",
      description: "El producto se eliminó del carrito",
    });
  };

  const clearCart = () => {
    updateCart([]);
    toast({
      title: "Carrito vaciado",
      description: "Se eliminaron todos los productos del carrito",
    });
  };

  const handleLocationChange = useCallback((coords, address) => {
    setDeliveryAddress(prev => ({
      ...prev,
      full_address: address,
      street: address.split(',')[0],
      city: address.split(',').slice(-3, -2)[0]?.trim() || '',
      coordinates: coords
    }));
  }, []);
  
  const handleLocateUser = () => {
    setTriggerLocate(prev => prev + 1);
  };

  const handleCheckout = async () => {
    if (!deliveryAddress.full_address) {
      toast({
        title: "Dirección requerida",
        description: "Por favor, selecciona o ingresa tu dirección de entrega.",
        variant: "destructive"
      });
      return;
    }
    if (!user) {
        toast({
            title: "Acción requerida",
            description: "Por favor, inicia sesión para realizar un pedido.",
            variant: "destructive"
        });
        return;
    }

    setIsSubmitting(true);

    const orderData = {
      client_id: user.id,
      business_id: cart[0]?.businessId,
      items: cart,
      total_price: finalTotal,
      status: 'pending',
      delivery_address: deliveryAddress,
      special_notes: specialNotes,
    };
    
    const newOrder = await addOrder(orderData);

    if (newOrder) {
      const businessName = cart[0]?.businessName || 'Restaurante';
      const itemsText = cart.map(item => `${item.quantity}x ${item.name}`).join('\n');
      const notesText = specialNotes ? `\n\n*Notas Especiales:*\n${specialNotes}` : '';
      const orderIdText = `\n\n*ID del Pedido:* ${newOrder.id}`;

      const message = `
*¡Hola! Quiero confirmar mi pedido de ${businessName}* 🙋‍♂️

*Mi pedido es:*
${itemsText}

*Total:* $${finalTotal.toFixed(2)}

*Dirección de entrega:*
${deliveryAddress.full_address}
${notesText}
${orderIdText}

¡Gracias!
      `;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=525534208385&text=${encodeURIComponent(message.trim())}`;
      
      window.open(whatsappUrl, '_blank');

      updateCart([]);
      setSpecialNotes('');
      toast({
        title: "¡Pedido realizado con éxito!",
        description: "Tu pedido ha sido enviado al restaurante. Confirma por WhatsApp.",
      });
      navigate(`/cliente/pedidos`);

    } else {
      toast({
        title: "Error al realizar el pedido",
        description: "Hubo un problema al procesar tu pedido. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }

    setIsSubmitting(false);
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cliente')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold text-white">Carrito de Compras</h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-2xl font-bold text-white mb-2">Tu carrito está vacío</h3>
          <p className="text-white/70 mb-6">
            Agrega algunos productos deliciosos para comenzar
          </p>
          <Button
            onClick={() => navigate('/cliente')}
          >
            Explorar Restaurantes
          </Button>
        </motion.div>
      </div>
    );
  }

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const business = businesses.find(b => b.id === cart[0]?.businessId);
  const deliveryFee = business?.delivery_fee || 0;
  const finalTotal = cartTotal + deliveryFee;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/cliente')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Carrito de Compras</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCart}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Vaciar carrito
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-white">
                  Pedido de {cart[0]?.businessName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-lg"
                  >
                    <img 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                     src="https://images.unsplash.com/photo-1690809080506-820f12d90f11" />
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{item.name}</h4>
                      <p className="text-white/60 text-sm">${item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-white font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-white font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Dirección de Entrega
                  </div>
                  <Button onClick={handleLocateUser} variant="outline" size="sm">
                    <LocateFixed className="w-4 h-4 mr-2" />
                    Usar mi ubicación
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <LocationPicker onLocationChange={handleLocationChange} initialPosition={deliveryAddress.coordinates} triggerLocate={triggerLocate} />
                 <div>
                    <Label htmlFor="full_address" className="text-white">Dirección de entrega (Selecciona en el mapa o busca)</Label>
                    <Input
                      id="full_address"
                      placeholder="Dirección completa aparecerá aquí..."
                      value={deliveryAddress.full_address}
                      readOnly
                    />
                 </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sticky top-24 space-y-4"
          >
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <StickyNote className="w-5 h-5" />
                  Notas Especiales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Ej: Sin cebolla, extra queso, dejar en recepción..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Resumen del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-white/70">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Envío</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/20 my-2"></div>
                <div className="flex justify-between text-white text-xl font-bold">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full text-lg py-6 mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Realizar Pedido'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
