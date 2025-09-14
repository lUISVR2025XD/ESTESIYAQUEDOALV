import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getStatusIcon = (status) => {
  const colorMap = {
    pending: 'grey',
    accepted: 'orange',
    preparing: 'yellow',
    ready: 'blue',
    delivering: 'violet',
    delivered: 'green',
    cancelled: 'red',
  };
  const color = colorMap[status] || 'grey';
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const getStatusText = (status) => {
    const statusMap = {
      pending: 'Pendiente',
      accepted: 'Aceptado',
      preparing: 'Preparando',
      ready: 'Listo para Recoger',
      delivering: 'En Camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return statusMap[status] || 'Desconocido';
};

const BoundsUpdater = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
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


const AdminGlobalMap = ({ orders, deliveryPersons, businesses }) => {
  
  const mapPoints = useMemo(() => {
    return orders.map(order => {
      const business = businesses.find(b => b.id === order.business_id);
      const deliveryPerson = deliveryPersons.find(d => d.id === order.delivery_person_id);
      const client = { name: order.client_name || 'Cliente' };
      return { order, business, deliveryPerson, client };
    }).filter(point => point.business && point.business.location && point.order.delivery_address && point.order.delivery_address.coordinates);
  }, [orders, deliveryPersons, businesses]);

  const bounds = useMemo(() => {
    const latLngs = mapPoints.flatMap(p => {
        const points = [];
        if (p.business.location?.lat && p.business.location?.lng) points.push(p.business.location);
        if (p.order.delivery_address?.coordinates?.lat && p.order.delivery_address?.coordinates?.lng) points.push(p.order.delivery_address.coordinates);
        if (p.deliveryPerson?.current_location?.lat && p.deliveryPerson?.current_location?.lng) points.push(p.deliveryPerson.current_location);
        return points;
    });
    if (latLngs.length > 0) {
      return L.latLngBounds(latLngs.map(loc => [loc.lat, loc.lng]));
    }
    return null;
  }, [mapPoints]);

  const center = bounds?.getCenter() || { lat: 19.4326, lng: -99.1332 };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
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
        
        {mapPoints.map(({ order, business, deliveryPerson, client }) => (
          <React.Fragment key={order.id}>
            {business.location && <Marker
              position={[business.location.lat, business.location.lng]}
              icon={new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]})}
            >
              <Popup>{business.name}</Popup>
            </Marker>}
            {order.delivery_address.coordinates && <Marker
              position={[order.delivery_address.coordinates.lat, order.delivery_address.coordinates.lng]}
              icon={getStatusIcon(order.status)}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-bold text-base">Pedido #{order.id.substring(0,8)}</h3>
                  <p><span className="font-semibold">Estado:</span> {getStatusText(order.status)}</p>
                  <p><span className="font-semibold">Cliente:</span> {client.name}</p>
                  <p><span className="font-semibold">Total:</span> ${order.total_price.toFixed(2)}</p>
                  <hr className="my-1"/>
                  <p><span className="font-semibold">Restaurante:</span> {business.name}</p>
                  {deliveryPerson && <p><span className="font-semibold">Repartidor:</span> {deliveryPerson.name}</p>}
                </div>
              </Popup>
            </Marker>}
            {deliveryPerson?.current_location && <Marker
              position={[deliveryPerson.current_location.lat, deliveryPerson.current_location.lng]}
              icon={new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]})}
            >
              <Popup>{deliveryPerson.name}</Popup>
            </Marker>}
          </React.Fragment>
        ))}

        <BoundsUpdater bounds={bounds} />
      </MapContainer>
    </div>
  );
};

export default AdminGlobalMap;