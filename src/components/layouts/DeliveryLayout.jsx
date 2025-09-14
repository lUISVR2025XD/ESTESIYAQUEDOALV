import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Home, 
  Search, 
  Truck, 
  History, 
  User, 
  LogOut, 
  Menu,
  X,
  Power,
  PowerOff
} from 'lucide-react';

const DeliveryLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { orders, deliveryPersons } = useData();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const deliveryPerson = deliveryPersons.find(d => d.id === user?.id) || {};
  const availableOrders = orders.filter(order => order.status === 'ready' && !order.delivery_person_id).length;
  const activeDeliveries = orders.filter(order => 
    order.delivery_person_id === deliveryPerson?.id && 
    order.status === 'delivering'
  ).length;

  const navigation = [
    { name: 'Panel', href: '/repartidor', icon: Home },
    { name: 'Buscar Pedidos', href: '/repartidor/pedidos', icon: Search, badge: availableOrders },
    { name: 'Entregas Activas', href: '/repartidor/entregas', icon: Truck, badge: activeDeliveries },
    { name: 'Historial', href: '/repartidor/historial', icon: History },
    { name: 'Perfil', href: '/repartidor/perfil', icon: User },
  ];

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate('/');
  };
  
  const userName = user?.user_metadata?.name || user?.email;
  const userAvatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${userName}&background=random`;
  const isOnline = deliveryPerson?.is_online || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
      <header className="glass-card border-0 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/repartidor" className="text-2xl font-bold text-white">
                VRtelolleva Driver
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    {item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Power className="w-5 h-5 text-green-400" />
                ) : (
                  <PowerOff className="w-5 h-5 text-red-400" />
                )}
                <span className={`text-sm font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                  {isOnline ? 'En línea' : 'Desconectado'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-white font-medium">{userName}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    {item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-2">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-white font-medium">{userName}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {isOnline ? (
                      <Power className="w-4 h-4 text-green-400" />
                    ) : (
                      <PowerOff className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 mt-2"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default DeliveryLayout;