import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AuthCallback = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role;
      if (role) {
        navigate(`/${role}`);
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <p className="text-white text-xl">Autenticando, por favor espera...</p>
    </div>
  );
};

export default AuthCallback;