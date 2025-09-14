import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Clock, Plus, FileText, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthModal } from '@/App';
import StarDisplay from '@/components/ui/StarDisplay';


const BusinessDetailPublic = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { businesses, products, loading } = useData();
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const { toast } = useToast();

  const business = businesses.find(b => b.id === businessId);
  const businessProducts = products.filter(p => p.business_id === businessId);

  const handleAddToCart = (product) => {
    requireAuth(() => {
        const cart = JSON.parse(localStorage.getItem('deliveryApp_cart') || '[]');
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
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                newCart = [...cart, { ...product, quantity: 1, businessId, businessName: business.name }];
            }
        }
        localStorage.setItem('deliveryApp_cart', JSON.stringify(newCart));
        document.dispatchEvent(new Event('cartUpdated'));
        toast({
            title: "Producto agregado",
            description: `${product.name} se agregó al carrito`,
        });
        navigate('/cliente/carrito');
    });
  };

  if (loading) {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-xl">Cargando negocio...</p>
        </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
        <AlertTriangle className="w-16 h-16 text-yellow-400 mb-4" />
        <h2 className="text-3xl font-bold">Negocio no encontrado</h2>
        <p className="text-white/70 mt-2 mb-6">El negocio que buscas no existe o fue eliminado.</p>
        <Button onClick={() => navigate('/')}>Volver al Inicio</Button>
      </div>
    );
  }

  const categories = [...new Set(businessProducts.map(p => p.category || "General"))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8"
            >
                <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/10"
                >
                <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-3xl font-bold text-white">Menú de {business.name}</h1>
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
                        <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{business.delivery_time}</span></div>
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

            <div className="mt-8">
                {categories.map((category, categoryIndex) => (
                    <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + 0.1 * categoryIndex }}
                    className="mb-8"
                    >
                    <h3 className="text-2xl font-bold text-white mb-6">{category}</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                    <Button size="sm" onClick={() => handleAddToCart(product)} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90">
                                        <Plus className="w-4 h-4 mr-1" />Agregar
                                    </Button>
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
        </div>
    </div>
  );
};

export default BusinessDetailPublic;