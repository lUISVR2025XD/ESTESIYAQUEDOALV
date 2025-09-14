import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClientLayout from '@/components/layouts/ClientLayout';
import BusinessList from '@/components/client/BusinessList';
import BusinessDetail from '@/components/client/BusinessDetail';
import Cart from '@/components/client/Cart';
import OrderHistory from '@/components/client/OrderHistory';
import Profile from '@/components/client/Profile';

const ClientDashboard = () => {
  return (
    <ClientLayout>
      <Routes>
        <Route path="/" element={<BusinessList />} />
        <Route path="/negocio/:businessId" element={<BusinessDetail />} />
        <Route path="/carrito" element={<Cart />} />
        <Route path="/pedidos" element={<OrderHistory />} />
        <Route path="/perfil" element={<Profile />} />
      </Routes>
    </ClientLayout>
  );
};

export default ClientDashboard;