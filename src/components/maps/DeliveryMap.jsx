import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import { useData } from '@/contexts/DataContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const businessIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const clientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const BoundsUpdater = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    }
  }, [map, bounds]);
  return null;
};

const SearchControl = () => {
  const map = useMap();
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: true,
      autoClose: true,
      searchLabel: 'Buscar dirección...',
      notFoundMessage: 'Dirección no encontrada.',
    });
    map.addControl(searchControl);
    return () => {
      if (map && map.removeControl) {
        map.removeControl(searchControl);
      }
    };
  }, [map]);
  return null;
};


const DeliveryMap = ({ order, deliveryPerson }) => {
  const { businesses } = useData();
  const [deliveryLocation, setDeliveryLocation] = useState(deliveryPerson?.current_location);

  const business = businesses.find(b => b.id === order.business_id);
  const clientLocation = order.delivery_address?.coordinates;

  useEffect(() => {
    let interval;
    if (deliveryPerson && order.status === 'delivering' && business?.location && clientLocation) {
        setDeliveryLocation(deliveryPerson.current_location || business.location);
        
        interval = setInterval(() => {
            setDeliveryLocation(prevLoc => {
                if (!prevLoc) return business.location;
                const targetLat = clientLocation.lat;
                const targetLng = clientLocation.lng;
                const newLat = prevLoc.lat + (targetLat - prevLoc.lat) * 0.05;
                const newLng = prevLoc.lng + (targetLng - prevLoc.lng) * 0.05;

                const distance = L.latLng(newLat, newLng).distanceTo(L.latLng(targetLat, targetLng));

                if (distance < 10) { 
                    clearInterval(interval);
                    return { lat: targetLat, lng: targetLng };
                }
                return { lat: newLat, lng: newLng };
            });
        }, 5000);
    }
    
    return () => {
        if (interval) clearInterval(interval);
    };
}, [deliveryPerson, order.status, clientLocation, business?.location]);
  
  const markers = useMemo(() => {
    const points = [];
    if (business?.location) points.push([business.location.lat, business.location.lng]);
    if (clientLocation) points.push([clientLocation.lat, clientLocation.lng]);
    if (deliveryLocation && order.status === 'delivering') points.push([deliveryLocation.lat, deliveryLocation.lng]);
    return points;
  }, [business?.location, clientLocation, deliveryLocation, order.status]);

  const bounds = markers.length > 0 ? L.latLngBounds(markers) : null;
  const center = bounds?.getCenter() || clientLocation || { lat: 19.4326, lng: -99.1332 };

  const polylinePositions = [];
  if (business?.location) polylinePositions.push([business.location.lat, business.location.lng]);
  if (deliveryLocation && order.status === 'delivering') polylinePositions.push([deliveryLocation.lat, deliveryLocation.lng]);
  
  const routeToClient = [];
  if (deliveryLocation && order.status === 'delivering') routeToClient.push([deliveryLocation.lat, deliveryLocation.lng]);
  if(clientLocation) routeToClient.push([clientLocation.lat, clientLocation.lng]);

  if (!clientLocation) {
    return <div className="text-white text-center p-8">Falta la ubicación del cliente.</div>
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
      maxZoom={20}
    >
      <LayersControl position="bottomleft">
          <LayersControl.BaseLayer checked name="Calles">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
      </LayersControl>
      
      <SearchControl />

      {business?.location && <Marker position={[business.location.lat, business.location.lng]} icon={businessIcon}><Popup>{business.name}</Popup></Marker>}
      {clientLocation && <Marker position={[clientLocation.lat, clientLocation.lng]} icon={clientIcon}><Popup>Tu ubicación</Popup></Marker>}
      {deliveryLocation && order.status === 'delivering' && <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={deliveryIcon}><Popup>{deliveryPerson.name}</Popup></Marker>}
      
      {polylinePositions.length > 1 && <Polyline positions={polylinePositions} color="red" weight={3} />}
      {routeToClient.length > 1 && <Polyline positions={routeToClient} color="#3b82f6" weight={5} opacity={0.7} dashArray="10, 10"/>}

      <BoundsUpdater bounds={bounds} />
    </MapContainer>
  );
};

export default DeliveryMap;