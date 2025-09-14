import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { Search, Star, Clock, MapPin, DollarSign, SlidersHorizontal, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider.jsx";
import { Label } from "@/components/ui/label";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { calculateTotalDeliveryTime } from '@/lib/utils';

const BusinessList = () => {
  const { businesses, products, loading } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priceRange: [0, 500],
    maxDistance: 20,
    category: 'all',
  });
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          toast({
            variant: "destructive",
            title: "Error de Ubicación",
            description: "No se pudo obtener tu ubicación. El filtro de distancia no estará disponible.",
          });
        },
        { timeout: 10000 }
      );
    }
  }, [toast]);

  const haversineDistance = (coords1, coords2) => {
    if (!coords1 || !coords2) return Infinity;

    const toRad = x => (x * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };
  
  const categories = ['all', 'Comida Rápida', 'Hamburguesas', 'Japonesa', 'Pizza', 'Mexicana'];

  const filteredBusinesses = businesses.filter(business => {
    const businessProducts = products.filter(p => p.business_id === business.id);
    const productMatch = businessProducts.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSearch =
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (business.category && business.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      productMatch;

    const matchesCategory = filters.category === 'all' || business.category === filters.category;
    
    const avgPrice = businessProducts.length > 0 ? businessProducts.reduce((acc, p) => acc + p.price, 0) / businessProducts.length : 0;
    const matchesPrice = avgPrice >= filters.priceRange[0] && avgPrice <= filters.priceRange[1];
    
    const distance = userLocation && business.location ? haversineDistance(userLocation, business.location) : Infinity;
    const matchesDistance = distance <= filters.maxDistance;
    
    return matchesSearch && matchesCategory && matchesPrice && matchesDistance;
  });

  const handlePriceChange = (value) => {
    if (Array.isArray(value) && value.length === 2) {
      setFilters(f => ({ ...f, priceRange: value }));
    }
  };

  const handleDistanceChange = (value) => {
    if (Array.isArray(value) && value.length === 1) {
      setFilters(f => ({ ...f, maxDistance: value[0] }));
    }
  };

  const linkTarget = user ? `/cliente/negocio` : `/negocio-publico`;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">¿Qué te apetece hoy?</h1>
          <p className="text-white/70 text-lg">Descubre los mejores restaurantes cerca de ti</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 md:p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/50 w-5 h-5" />
            <Input
              placeholder="Buscar restaurantes o productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-shrink-0">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 glass-card border-0 text-white p-4 space-y-4">
              <DropdownMenuLabel>Filtros Avanzados</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/20"/>
              
              <div className="space-y-2">
                <Label htmlFor="price-range">Rango de precios (${filters.priceRange[0]} - ${filters.priceRange[1]})</Label>
                <Slider id="price-range" value={filters.priceRange} max={500} step={10} onValueChange={handlePriceChange} />
              </div>

              {userLocation && <div className="space-y-2">
                <Label htmlFor="distance">Distancia ({filters.maxDistance} km)</Label>
                <Slider id="distance" value={[filters.maxDistance]} max={20} step={1} onValueChange={handleDistanceChange}/>
              </div>}

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2 overflow-x-auto mt-4 pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={filters.category === category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(f => ({ ...f, category }))}
              className="whitespace-nowrap"
            >
              {category === 'all' ? 'Todos' : category}
            </Button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business, index) => (
            <motion.div key={business.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
              <Card className="glass-card border-0 overflow-hidden hover:scale-105 transition-all duration-300 group">
                <Link to={`${linkTarget}/${business.id}`}>
                  <div className="relative">
                    <img  alt={business.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" src="https://images.unsplash.com/photo-1644981900009-e54566bb4c34" />
                    <div className="absolute top-4 right-4">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${business.is_open ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {business.is_open ? 'Abierto' : 'Cerrado'}
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">{business.name}</h3>
                      <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-current" /><span className="text-white font-medium">{business.rating || 'N/A'}</span></div>
                    </div>
                    
                    <p className="text-white/70 mb-4">{business.category}</p>
                    
                    <div className="flex items-center justify-between text-sm text-white/60">
                      <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{calculateTotalDeliveryTime(null, business)}</span></div>
                      <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" /><span>${(business.delivery_fee || 0).toFixed(2)} envío</span></div>
                      {userLocation && business.location && <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span>{haversineDistance(userLocation, business.location).toFixed(1)} km</span></div>}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-white mb-2">No se encontraron resultados</h3>
          <p className="text-white/70">Intenta con otros términos de búsqueda o filtros</p>
        </motion.div>
      )}
    </div>
  );
};

export default BusinessList;