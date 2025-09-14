import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { v4 as uuidv4 } from 'uuid';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [quickMessages, setQuickMessages] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: clientsData, error: clientsError },
        { data: businessesData, error: businessesError },
        { data: deliveryPersonsData, error: deliveryPersonsError },
        { data: productsData, error: productsError },
        { data: ordersData, error: ordersError },
        { data: orderHistoryData, error: orderHistoryError },
        { data: quickMessagesData, error: quickMessagesError },
      ] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('businesses').select('*'),
        supabase.from('delivery_persons').select('*'),
        supabase.from('products').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('order_history').select('*'),
        supabase.from('quick_messages').select('*'),
      ]);

      if (clientsError) throw clientsError;
      if (businessesError) throw businessesError;
      if (deliveryPersonsError) throw deliveryPersonsError;
      if (productsError) throw productsError;
      if (ordersError) throw ordersError;
      if (orderHistoryError) throw orderHistoryError;
      if (quickMessagesError) throw quickMessagesError;

      setClients(clientsData || []);
      setBusinesses(businessesData || []);
      setDeliveryPersons(deliveryPersonsData || []);
      setProducts(productsData || []);
      setOrders(ordersData || []);
      setOrderHistory(orderHistoryData || []);
      setQuickMessages(quickMessagesData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleChanges = (payload) => {
      console.log('Change received!', payload);
      fetchData();
    };

    const subscription = supabase.channel('public-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, handleChanges)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchData]);

  const addProduct = async (productData) => {
    const { data, error } = await supabase.from('products').insert([productData]).select();
    if (error) console.error('Error adding product:', error);
    return data ? data[0] : null;
  };

  const updateProduct = async (productId, productData) => {
    const { data, error } = await supabase.from('products').update(productData).eq('id', productId).select();
    if (error) console.error('Error updating product:', error);
    return data ? data[0] : null;
  };

  const deleteProduct = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) console.error('Error deleting product:', error);
  };

  const updateBusiness = async (businessId, businessData, isProfileUpdate = false) => {
    const { data, error } = await supabase.from('businesses').update(businessData).eq('id', businessId).select();
    if (error) {
      console.error('Error updating business:', error);
      return { data: null, error };
    }
    
    if (isProfileUpdate && user) {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: businessData.name,
          phone: businessData.phone,
        }
      });
      if (authError) console.error('Error updating user metadata:', authError);
    }
    return { data, error: null };
  };
  
  const updateDeliveryPerson = async (deliveryPersonId, deliveryPersonData) => {
    const { data, error } = await supabase.from('delivery_persons').update(deliveryPersonData).eq('id', deliveryPersonId).select();
    if (error) console.error('Error updating delivery person:', error);
    return data ? data[0] : null;
  };

  const addOrder = async (orderData) => {
    const { data, error } = await supabase.from('orders').insert([orderData]).select();
    if (error) console.error('Error adding order:', error);
    return data ? data[0] : null;
  };

  const updateOrder = async (orderId, orderData) => {
    const { data, error } = await supabase.from('orders').update(orderData).eq('id', orderId).select();
    if (error) console.error('Error updating order:', error);
    return data ? data[0] : null;
  };

  const deleteCompletedOrders = async () => {
    const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    if (completedOrders.length === 0) return { success: true, message: "No hay pedidos completados para depurar." };

    const historyRecords = completedOrders.map(order => ({
      id: uuidv4(),
      order_id: order.id,
      business_id: order.business_id,
      client_id: order.client_id,
      total_price: order.total_price,
      items: order.items,
      created_at: order.created_at,
    }));

    const { error: historyError } = await supabase.from('order_history').insert(historyRecords);
    if (historyError) {
      console.error('Error archiving orders:', historyError);
      return { success: false, message: "Error al archivar los pedidos." };
    }

    const orderIdsToDelete = completedOrders.map(o => o.id);
    const { error: deleteError } = await supabase.from('orders').delete().in('id', orderIdsToDelete);
    if (deleteError) {
      console.error('Error deleting orders:', deleteError);
      return { success: false, message: "Error al eliminar los pedidos de la tabla principal." };
    }

    return { success: true, message: `${completedOrders.length} pedidos han sido depurados y archivados.` };
  };

  const addRating = async (order, ratings) => {
    if (!user) return;

    const { business_rating, delivery_rating, comment } = ratings;

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ client_rating: business_rating, delivery_rating: delivery_rating })
      .eq('id', order.id);

    if (orderUpdateError) {
      console.error('Error updating order with ratings:', orderUpdateError);
      return;
    }

    const { error: ratingInsertError } = await supabase
      .from('ratings')
      .insert([{
        order_id: order.id,
        client_id: user.id,
        business_id: order.business_id,
        delivery_person_id: order.delivery_person_id,
        business_rating: business_rating,
        delivery_rating: delivery_rating,
        comment: comment,
      }]);

    if (ratingInsertError) {
      console.error('Error inserting rating:', ratingInsertError);
    } else {
      if (business_rating > 0) {
        const { data: businessRatings, error: brError } = await supabase.from('ratings').select('business_rating').eq('business_id', order.business_id).not('business_rating', 'is', null);
        if (!brError && businessRatings.length > 0) {
          const totalRating = businessRatings.reduce((acc, r) => acc + r.business_rating, 0);
          const avg = totalRating / businessRatings.length;
          await supabase.from('businesses').update({ rating: avg.toFixed(1) }).eq('id', order.business_id);
        }
      }
      if (delivery_rating > 0 && order.delivery_person_id) {
        const { data: deliveryRatings, error: drError } = await supabase.from('ratings').select('delivery_rating').eq('delivery_person_id', order.delivery_person_id).not('delivery_rating', 'is', null);
        if (!drError && deliveryRatings.length > 0) {
          const totalRating = deliveryRatings.reduce((acc, r) => acc + r.delivery_rating, 0);
          const avg = totalRating / deliveryRatings.length;
          await supabase.from('delivery_persons').update({ rating: avg.toFixed(1) }).eq('id', order.delivery_person_id);
        }
      }
      fetchData();
    }
  };

  const sendQuickMessage = async (orderId, recipientId, message) => {
    if (!user) return;
    const { data, error } = await supabase.from('quick_messages').insert([{
      order_id: orderId,
      sender_id: user.id,
      recipient_id: recipientId,
      message: message,
    }]);
    if (error) {
      console.error('Error sending quick message:', error);
    }
    return { data, error };
  };

  const uploadPromotionFile = async (file, originalName) => {
    if (!user) return { error: { message: 'User not authenticated' } };
    const fileExt = originalName.split('.').pop();
    const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('promotions')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { error };
    }

    const { data: urlData } = supabase.storage.from('promotions').getPublicUrl(data.path);
    
    return { data: { ...data, publicUrl: urlData.publicUrl, name: originalName, path: data.path }, error: null };
  };

  const deletePromotionFile = async (filePath) => {
    if (!user) return { error: { message: 'User not authenticated' } };
    const { error } = await supabase.storage.from('promotions').remove([filePath]);
    return { error };
  };

  const value = {
    loading,
    clients,
    businesses,
    deliveryPersons,
    products,
    orders,
    orderHistory,
    quickMessages,
    addProduct,
    updateProduct,
    deleteProduct,
    updateBusiness,
    updateDeliveryPerson,
    addOrder,
    updateOrder,
    deleteCompletedOrders,
    addRating,
    sendQuickMessage,
    uploadPromotionFile,
    deletePromotionFile,
    fetchData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};