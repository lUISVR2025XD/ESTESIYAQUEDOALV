import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DeliveryLayout from '@/components/layouts/DeliveryLayout';
import DeliveryOverview from '@/components/delivery/DeliveryOverview';
import AvailableOrders from '@/components/delivery/AvailableOrders';
import ActiveDeliveries from '@/components/delivery/ActiveDeliveries';
import DeliveryHistory from '@/components/delivery/DeliveryHistory';
import DeliveryProfile from '@/components/delivery/DeliveryProfile';

const DeliveryDashboard = () => {
  return (
    <DeliveryLayout>
      <Routes>
        <Route path="/" element={<DeliveryOverview />} />
        <Route path="/pedidos" element={<AvailableOrders />} />
        <Route path="/entregas" element={<ActiveDeliveries />} />
        <Route path="/historial" element={<DeliveryHistory />} />
        <Route path="/perfil" element={<DeliveryProfile />} />
      </Routes>
    </DeliveryLayout>
  );
};

export default DeliveryDashboard;