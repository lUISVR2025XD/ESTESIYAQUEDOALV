import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Star, Clock, ShoppingCart, Plus, Minus, FileText, MapPin } from 'lucide-react';
import { useAuthModal } from '@/App';
import { calculateTotalDeliveryTime } from '@/lib/utils';
import StarDisplay from '@/components/ui/StarDisplay';

const BusinessDetail = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { businesses, products, loading } = useData();
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const { toast } = useToast();
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('deliveryApp_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('deliveryApp_cart', JSON.stringify(cart));
    document.dispatchEvent(new Event('cartUpdated'));
  }, [cart]);

  const business = businesses.find(b => b.id === businessId);
  const businessProducts = products.filter(p => p.business_id === businessId);

  if (loading) {
    return <div className="text-center text-white py-12">Cargando...</div>;
  }

  if (!business) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">Negocio no encontrado</h2>
        <Button onClick={() => navigate('/cliente')} className="mt-4">
          Volver al inicio
        </Button>
      </div>
    );
  }

  const categories = [...new Set(businessProducts.map(p => p.category || "General"))];

  const performAddToCart = (product) => {
    let newCart;
    const existingBusinessInCart = cart.length > 0 && cart[0].businessId !== businessId;

    if (existingBusinessInCart) {
        if (window.confirm("Ya tienes productos de otro restaurante en tu carrito. ¿Deseas vaciarlo y agregar este producto?")) {
            newCart = [{ ...product, quantity: 1, businessId, businessName: business.name }];
        } else {
            return;
        }
    } else {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            newCart = cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        } else {
            newCart = [...cart, { ...product, quantity: 1, businessId, businessName: business.name }];
        }
    }
    
    setCart(newCart);
    
    toast({
      title: "Producto agregado",
      description: `${product.name} se agregó al carrito`,
    });
  };

  const addToCart = (product) => {
    if (!user) {
      requireAuth(() => performAddToCart(product));
    } else {
      performAddToCart(product);
    }
  };


  const updateQuantity = (productId, change) => {
    const newCart = cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean);
    
    setCart(newCart);
  };

  const getItemQuantity = (productId) => {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalDeliveryTime = calculateTotalDeliveryTime(null, business);

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
            size="icon"
            onClick={() => navigate('/cliente')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Menú de {business.name}</h1>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card border-0 overflow-hidden">
          <div className="relative">
            <img  alt={business.name} className="w-full h-64 object-cover" src="https://images.unsplash.com/photo-1547886570-74869d8d5e30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h2 className="text-3xl font-bold mb-2">{business.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-1">
                  <StarDisplay rating={business.rating || 0} />
                  <span className="ml-1">{business.rating ? business.rating.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{totalDeliveryTime}</span></div>
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span>${(business.delivery_fee || 0).toFixed(2)} envío</span></div>
                 {business.promotions && business.promotions.length > 0 && (
                  <a href={business.promotions[0].url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-blue-500/80 px-2 py-1 rounded-md text-white hover:bg-blue-500">
                    <FileText className="w-4 h-4" />
                    <span>Ver Menú/Promos</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * categoryIndex }}
            >
              <h3 className="text-2xl font-bold text-white mb-6">{category}</h3>
              <div className="grid gap-4">
                {businessProducts
                  .filter(product => (product.category || "General") === category)
                  .map((product) => (
                    <Card key={product.id} className="glass-card border-0">
                      <CardContent className="p-4">
                        <div className="flex gap-4 items-center">
                          <img  alt={product.name} className="w-24 h-24 object-cover rounded-lg" src="https://images.unsplash.com/photo-1629386200770-756bc54f9d0a" />
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-white mb-2">{product.name}</h4>
                            <p className="text-white/70 text-sm mb-3">{product.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold text-white">${product.price}</span>
                              <div className="flex items-center gap-2">
                                {getItemQuantity(product.id) > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => updateQuantity(product.id, -1)} className="w-8 h-8 p-0"><Minus className="w-4 h-4" /></Button>
                                    <span className="text-white font-medium w-8 text-center">{getItemQuantity(product.id)}</span>
                                    <Button size="sm" variant="outline" onClick={() => updateQuantity(product.id, 1)} className="w-8 h-8 p-0"><Plus className="w-4 h-4" /></Button>
                                  </div>
                                ) : (
                                  <Button size="sm" onClick={() => addToCart(product)}><Plus className="w-4 h-4 mr-1" />Agregar</Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>

        {cartItemsCount > 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="glass-card border-0">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5" />Tu pedido ({cartItemsCount})</h3>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1"><p className="text-white font-medium">{item.name}</p><p className="text-white/60 text-sm">${item.price} x {item.quantity}</p></div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 p-0 text-white/70 hover:text-white hover:bg-white/10"><Minus className="w-3 h-3" /></Button>
                          <span className="text-white text-sm w-6 text-center">{item.quantity}</span>
                          <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 p-0 text-white/70 hover:text-white hover:bg-white/10"><Plus className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center mb-2"><span className="text-white/70">Subtotal</span><span className="text-white">${cartTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center mb-4"><span className="text-white/70">Envío</span><span className="text-white">${(business.delivery_fee || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between items-center mb-4 text-lg font-bold"><span className="text-white">Total</span><span className="text-white">${(cartTotal + (business.delivery_fee || 0)).toFixed(2)}</span></div>
                    <Button onClick={() => navigate('/cliente/carrito')} className="w-full">Ir al carrito</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BusinessDetail;