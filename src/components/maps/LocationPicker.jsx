import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl, LayerGroup } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import { useToast } from '@/components/ui/use-toast';
import 'leaflet-geosearch/dist/geosearch.css';

const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const SearchControl = ({ onLocationSelect }) => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: false,
      autoClose: true,
      keepResult: true,
      searchLabel: 'Buscar dirección...',
      notFoundMessage: 'Lo sentimos, esa dirección no se encontró.',
    });

    map.addControl(searchControl);

    const onResult = (e) => {
        const newPos = { lat: e.location.y, lng: e.location.x };
        map.flyTo([e.location.y, e.location.x], 18);
        onLocationSelect(newPos, e.location.label);
    };
    
    map.on('geosearch/showlocation', onResult);

    return () => {
        map.off('geosearch/showlocation', onResult);
        if (map && map.removeControl) {
            map.removeControl(searchControl);
        }
    };
  }, [map, onLocationSelect]);

  return null;
};


const LocationPicker = ({ onLocationChange, initialPosition, triggerLocate }) => {
  const { toast } = useToast();
  const [position, setPosition] = useState(initialPosition || { lat: 19.4326, lng: -99.1332 });
  const markerRef = useRef(null);
  const isUpdatingFromParent = useRef(false);

  useEffect(() => {
      if (initialPosition && (initialPosition.lat !== position.lat || initialPosition.lng !== position.lng)) {
          isUpdatingFromParent.current = true;
          setPosition(initialPosition);
      }
  }, [initialPosition]);

  const fetchAddress = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'es' }
      });
      if(!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const address = data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      onLocationChange({ lat, lng }, address);
    } catch (error) {
      console.error("Error fetching address: ", error);
      onLocationChange({ lat, lng }, `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
    }
  }, [onLocationChange]);

  const handleLocationSelect = useCallback((newPos, address) => {
      setPosition(newPos);
      if (address) {
          onLocationChange(newPos, address);
      } else {
          fetchAddress(newPos.lat, newPos.lng);
      }
  }, [onLocationChange, fetchAddress]);
  
  const LocationHandler = () => {
    const map = useMap();

    useEffect(() => {
        if (isUpdatingFromParent.current) {
            map.flyTo(position, 18);
            isUpdatingFromParent.current = false;
        }
    }, [position]);

    useEffect(() => {
      if (triggerLocate > 0) {
        map.locate({setView: true, maxZoom: 18, timeout: 20000 });
      }
    }, [triggerLocate, map]);
    
    useMapEvents({
      click(e) {
        const newPos = e.latlng;
        setPosition(newPos);
        map.flyTo(newPos, map.getZoom());
        fetchAddress(newPos.lat, newPos.lng);
      },
      locationfound(e) {
        const newPos = e.latlng;
        setPosition(newPos);
        map.flyTo(newPos, 18);
        fetchAddress(newPos.lat, newPos.lng);
        toast({ title: 'Ubicación encontrada', description: 'Se ha establecido tu ubicación actual.' });
      },
      locationerror(e) {
        let message = e.message;
        if (e.code === 1) message = "Acceso a la ubicación denegado.";
        if (e.code === 2) message = "No se puede determinar la ubicación.";
        if (e.code === 3) message = "Tiempo de espera agotado al obtener la ubicación.";
        toast({ title: 'Error de ubicación', description: message, variant: 'destructive' });
      },
    });

    return null;
  };
  
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          fetchAddress(newPos.lat, newPos.lng);
        }
      },
    }),
    [fetchAddress],
  );

  return (
    <div className="h-64 md:h-80 w-full rounded-2xl overflow-hidden relative border-2 border-white/20">
      <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} maxZoom={20}>
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
            <LayersControl.Overlay checked name="Marcador">
              <LayerGroup>
                <Marker draggable={true} eventHandlers={eventHandlers} position={position} icon={customIcon} ref={markerRef} />
              </LayerGroup>
            </LayersControl.Overlay>
        </LayersControl>
        <LocationHandler />
        <SearchControl onLocationSelect={handleLocationSelect}/>
      </MapContainer>
    </div>
  );
};

export default LocationPicker;