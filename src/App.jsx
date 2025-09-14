import React, { useEffect, useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { DataProvider, useData } from '@/contexts/DataContext';
import HomePage from '@/pages/HomePage';
import ClientDashboard from '@/pages/ClientDashboard';
import BusinessDashboard from '@/pages/BusinessDashboard';
import DeliveryDashboard from '@/pages/DeliveryDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import OrderTracking from '@/pages/OrderTracking';
import AuthCallback from '@/pages/AuthCallback';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import BusinessDetailPublic from '@/pages/BusinessDetailPublic';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const AuthModalContext = React.createContext();

export const useAuthModal = () => useContext(AuthModalContext);

const AuthModalProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState(() => {});
  const [currentUserType, setCurrentUserType] = useState('cliente');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const requireAuth = (action, userType = 'cliente') => {
    setCurrentUserType(userType);
    setAuthAction(() => action);
    setIsModalOpen(true);
  };
  
  const handleLogin = async () => {
    const { error } = await signIn(loginData.email, loginData.password);
    if (!error) {
      toast({ title: "¡Bienvenido de vuelta!" });
      setIsModalOpen(false);
      if (authAction) authAction();
    } else {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: "Por favor, verifica tus credenciales.",
      });
    }
  };

  const handleSignUp = async () => {
    const { error } = await signUp(loginData.email, loginData.password, {
      data: { role: currentUserType, name: 'Nuevo Usuario' }
    });
    if (!error) {
      toast({ title: "¡Cuenta creada!", description: "Revisa tu email para confirmar." });
      setIsModalOpen(false);
       if (authAction) authAction();
    } else {
       toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message,
      });
    }
  };

  return (
    <AuthModalContext.Provider value={{ requireAuth }}>
      {children}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass-card border-0">
          <DialogHeader>
            <DialogTitle className="text-white text-center text-2xl">Acceder o Registrarse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="email-modal" className="text-white">Email</Label>
              <Input id="email-modal" type="email" placeholder="tu@email.com" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="password-modal" className="text-white">Contraseña</Label>
              <Input id="password-modal" type="password" placeholder="••••••••" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleLogin} className="flex-1">Ingresar</Button>
              <Button variant="outline" onClick={handleSignUp} className="flex-1">Registrarse</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
};


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();
  const location = useLocation();

  const loading = authLoading || dataLoading;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-xl">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  const userRole = user.user_metadata?.role;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole) {
      return <Navigate to={`/${userRole}`} replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { loading: authLoading } = useAuth();
  const { user } = useAuth();

  if (authLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-xl">Cargando plataforma...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.user_metadata?.role || 'cliente'}`} /> : <HomePage />} />
      <Route path="/negocio-publico/:businessId" element={<BusinessDetailPublic />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/cliente/*" element={<ProtectedRoute allowedRoles={['cliente']}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/negocio/*" element={<ProtectedRoute allowedRoles={['negocio']}><BusinessDashboard /></ProtectedRoute>} />
      <Route path="/repartidor/*" element={<ProtectedRoute allowedRoles={['repartidor']}><DeliveryDashboard /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/seguimiento/:orderId" element={<ProtectedRoute allowedRoles={['cliente', 'admin', 'repartidor']}><OrderTracking /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const AdminUserInitializer = () => {
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-admin-user');
        if (error) {
          if (error.context && error.context.status !== 409 && error.context.status !== 200) {
             console.error('Error initializing admin user:', error.message);
          }
        }
        if (data) {
          console.log(data.message);
        }
      } catch (e) {
        console.error('Failed to invoke edge function:', e.message);
      }
    };

    initializeAdmin();
  }, []);

  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
         <AuthModalProvider>
            <AdminUserInitializer />
            <div className="min-h-screen">
              <Helmet>
                <title>VRtelolleva - Plataforma de Entregas a Domicilio</title>
                <meta name="description" content="Conecta clientes, negocios y repartidores en una plataforma integrada de entregas a domicilio" />
                <meta property="og:title" content="VRtelolleva - Plataforma de Entregas a Domicilio" />
                <meta property="og:description" content="Conecta clientes, negocios y repartidores en una plataforma integrada de entregas a domicilio" />
              </Helmet>
              <AppRoutes />
              <Toaster />
            </div>
          </AuthModalProvider>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}
export default App;