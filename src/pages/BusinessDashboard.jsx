import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BusinessLayout from '@/components/layouts/BusinessLayout';
import BusinessOverview from '@/components/business/BusinessOverview';
import OrderManagement from '@/components/business/OrderManagement';
import ProductManagement from '@/components/business/ProductManagement';
import BusinessStats from '@/components/business/BusinessStats';
import BusinessProfile from '@/components/business/BusinessProfile';

const BusinessDashboard = () => {
  return (
    <BusinessLayout>
      <Routes>
        <Route path="/" element={<BusinessOverview />} />
        <Route path="/pedidos" element={<OrderManagement />} />
        <Route path="/productos" element={<ProductManagement />} />
        <Route path="/estadisticas" element={<BusinessStats />} />
        <Route path="/perfil" element={<BusinessProfile />} />
      </Routes>
    </BusinessLayout>
  );
};

export default BusinessDashboard;