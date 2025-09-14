import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useData } from '@/contexts/DataContext';
import { useAuthModal } from '@/App';
import { Star, Clock, DollarSign, Search, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Info, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import StarDisplay from '@/components/ui/StarDisplay';

const BusinessCard = ({ business, onDetailsClick }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="h-full"
  >
    <Card className="glass-card border-0 h-full flex flex-col">
      <img 
        alt={business.name}
        className="w-full h-40 object-cover rounded-t-lg"
       src={business.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop"} />
      <CardContent className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-bold text-white">{business.name}</h3>
        <p className="text-sm text-white/70 mb-2">{business.category}</p>
        <div className="flex items-center gap-4 text-sm text-white/80 mb-4 mt-auto">
          <div className="flex items-center gap-1">
            <StarDisplay rating={business.rating || 0} />
            <span className="ml-1">{business.rating ? business.rating.toFixed(1) : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {business.delivery_time}</div>
          <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {(business.delivery_fee || 0).toFixed(2)}</div>
        </div>
        <div className="flex gap-2">
          <Button asChild className="flex-grow">
            <Link to={`/negocio-publico/${business.id}`}>Ver Menú</Link>
          </Button>
          <Button variant="outline" onClick={() => onDetailsClick(business)}>
            <Info className="w-4 h-4 mr-2" /> Detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Carousel = ({ items, renderItem, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? items.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === items.length - 1 ? 0 : prevIndex + 1));
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative">
      <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {items.map((item, index) => (
            <div key={index} className="flex-shrink-0 w-full">
              {renderItem(item)}
            </div>
          ))}
        </motion.div>
      </div>
      {items.length > 1 && (
        <>
          <Button onClick={handlePrev} variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white">
            <ChevronLeft />
          </Button>
          <Button onClick={handleNext} variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white">
            <ChevronRight />
          </Button>
        </>
      )}
    </div>
  );
};

const PromotionDetailsModal = ({ business, isOpen, onOpenChange }) => {
  if (!business) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-0">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Promociones y Menús de {business.name}</DialogTitle>
          <DialogDescription className="text-white/70">
            Aquí puedes ver los menús, flyers y promociones especiales que {business.name} ha compartido.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3">
          {(business.promotions && business.promotions.length > 0) ? (
            business.promotions.map((promo, index) => (
              <a key={index} href={promo.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-3">
                  {promo.name.endsWith('.pdf') ? (
                    <FileText className="w-8 h-8 text-white/80 flex-shrink-0" />
                  ) : (
                    <img src={promo.url} alt={promo.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                  )}
                  <span className="text-white font-medium truncate">{promo.name}</span>
                </div>
              </a>
            ))
          ) : (
            <p className="text-white/50 text-center py-8">Este negocio no tiene promociones o menús para mostrar.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const HomePage = () => {
  const { businesses, products } = useData();
  const { requireAuth } = useAuthModal();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const handleAuthAndNavigate = (path, userType) => {
    requireAuth(() => navigate(path), userType);
  };

  const filteredBusinesses = useMemo(() =>
    businesses.filter(b =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.category && b.category.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [businesses, searchTerm]);

  const featuredProducts = useMemo(() =>
    products.slice(0, 5).map(p => ({
      ...p,
      businessName: businesses.find(b => b.id === p.business_id)?.name || 'Negocio Desconocido'
    })), [products, businesses]);

  const promotionalImages = useMemo(() => {
    return businesses.flatMap(b =>
      (b.promotions || [])
        .filter(p => p && p.name && /\.(jpg|jpeg|png|gif)$/i.test(p.name))
        .map(p => ({ ...p, businessId: b.id, businessName: b.name }))
    );
  }, [businesses]);

  const handleDetailsClick = (business) => {
    setSelectedBusiness(business);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">VRtelolleva</h1>
        <div className="space-x-2">
          <Button variant="ghost" onClick={() => handleAuthAndNavigate('/negocio', 'negocio')}>Para Negocios</Button>
          <Button variant="ghost" onClick={() => handleAuthAndNavigate('/repartidor', 'repartidor')}>Para Repartidores</Button>
          <Button onClick={() => handleAuthAndNavigate('/cliente', 'cliente')}>Acceder</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-5xl font-extrabold mb-4">Tu comida favorita, entregada en tu puerta.</h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">Explora los mejores restaurantes locales, ordena con facilidad y recibe tu comida rápidamente.</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
            <Input
              type="text"
              placeholder="Busca tu restaurante o platillo favorito..."
              className="w-full pl-12 pr-4 py-6 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.section>

        <section>
          <Carousel
            title="Promociones Destacadas"
            items={promotionalImages}
            renderItem={(promo) => (
              <Link to={`/negocio-publico/${promo.businessId}`}>
                <div className="relative rounded-lg overflow-hidden aspect-video md:aspect-[2.4/1]">
                  <img src={promo.url} alt={promo.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                    <h3 className="text-2xl font-bold text-white">{promo.businessName}</h3>
                  </div>
                </div>
              </Link>
            )}
          />
        </section>

        <section>
          <Carousel
            title="Platillos Estrella"
            items={featuredProducts}
            renderItem={(product) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map(p => (
                  <Card key={p.id} className="glass-card border-0">
                    <CardContent className="p-4 flex gap-4">
                      <img src={p.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop'} alt={p.name} className="w-24 h-24 object-cover rounded-lg" />
                      <div className="flex flex-col">
                        <h4 className="font-bold text-white">{p.name}</h4>
                        <p className="text-sm text-white/70">{p.businessName}</p>
                        <div className="mt-auto flex justify-between items-center">
                          <span className="font-bold text-lg text-white">${p.price}</span>
                          <Button size="sm" asChild>
                            <Link to={`/negocio-publico/${p.business_id}`}>
                              <ShoppingCart className="w-4 h-4 mr-2" /> Pedir
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          />
        </section>

        <section>
          <h2 className="text-3xl font-bold text-white mb-6">Restaurantes Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBusinesses.map(business => (
              <BusinessCard key={business.id} business={business} onDetailsClick={handleDetailsClick} />
            ))}
          </div>
        </section>
      </main>
      <PromotionDetailsModal business={selectedBusiness} isOpen={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen} />
    </div>
  );
};

export default HomePage;