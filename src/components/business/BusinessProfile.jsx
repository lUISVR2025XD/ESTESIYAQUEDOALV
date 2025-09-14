import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Save, Store, MapPin, Phone, Clock, DollarSign, LocateFixed, Star, Upload, Trash2, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import LocationPicker from '@/components/maps/LocationPicker';
import imageCompression from 'browser-image-compression';
import StarDisplay from '@/components/ui/StarDisplay';

const PromotionManager = ({ business, onUpdate }) => {
  const { uploadPromotionFile, deletePromotionFile } = useData();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localPromotions, setLocalPromotions] = useState(business.promotions || []);

  useEffect(() => {
    setLocalPromotions(business.promotions || []);
  }, [business.promotions]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "Selecciona un archivo primero", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);

    let fileToUpload = selectedFile;
    const fileType = fileToUpload.type;
    const isImage = fileType.startsWith('image/');
    const isPdf = fileType === 'application/pdf';

    try {
      if (isImage && fileToUpload.size > 200 * 1024) { 
        toast({ title: "Comprimiendo imagen...", description: "La imagen es grande, se optimizará automáticamente." });
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        fileToUpload = await imageCompression(selectedFile, options);
      } else if (isPdf && fileToUpload.size > 600 * 1024) { 
        toast({ title: "Archivo demasiado grande", description: "Los archivos PDF no deben exceder los 600KB.", variant: "destructive" });
        setIsUploading(false);
        setSelectedFile(null);
        document.getElementById('promo-file').value = '';
        return;
      }

      const { data, error } = await uploadPromotionFile(fileToUpload, fileToUpload.name);
      
      if (error) {
        throw new Error(error.message);
      }
      
      const newPromotion = { name: fileToUpload.name, url: data.publicUrl, path: data.path };
      const updatedPromotions = [...localPromotions, newPromotion];
      
      const { error: updateError } = await onUpdate({ promotions: updatedPromotions });
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      setLocalPromotions(updatedPromotions);

      toast({ title: "Archivo subido con éxito" });
      setSelectedFile(null);
      if(document.getElementById('promo-file')) {
          document.getElementById('promo-file').value = '';
      }

    } catch (error) {
      toast({ title: "Error al subir archivo", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filePath) => {
    const { error } = await deletePromotionFile(filePath);
    if (error) {
      toast({ title: "Error al eliminar archivo", description: error.message, variant: "destructive" });
    } else {
      const updatedPromotions = localPromotions.filter(p => p.path !== filePath);
      await onUpdate({ promotions: updatedPromotions });
      setLocalPromotions(updatedPromotions);
      toast({ title: "Archivo eliminado" });
    }
  };

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="w-5 h-5" /> Promociones y Menús
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="promo-file" className="text-white">Subir nuevo archivo (PDF &lt; 600KB, JPG/PNG &lt; 200KB)</Label>
          <div className="flex gap-2 mt-1">
            <Input id="promo-file" type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="text-white file:text-white" />
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-white/80 font-medium">Archivos subidos:</h4>
          {(localPromotions && localPromotions.length > 0) ? (
            <ul className="space-y-2">
              {localPromotions.map((promo, index) => (
                <li key={index} className="flex items-center justify-between bg-white/10 p-2 rounded-md">
                  <div className="flex items-center gap-2 text-white/90 overflow-hidden">
                    {promo.name.endsWith('.pdf') ? <FileText className="w-4 h-4 flex-shrink-0" /> : <ImageIcon className="w-4 h-4 flex-shrink-0" />}
                    <a href={promo.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={promo.name}>{promo.name}</a>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(promo.path)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/50 text-sm">No has subido ninguna promoción o menú todavía.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


const BusinessProfile = () => {
  const { user } = useAuth();
  const { businesses, updateBusiness } = useData();
  const { toast } = useToast();
  
  const [business, setBusiness] = useState(null);
  const [profile, setProfile] = useState({});
  const [triggerLocate, setTriggerLocate] = useState(0);

  useEffect(() => {
    const currentBusiness = businesses.find(b => b.id === user?.id);
    if (currentBusiness) {
      setBusiness(currentBusiness);
      setProfile({
        name: currentBusiness.name || '',
        category: currentBusiness.category || '',
        phone: currentBusiness.phone || '',
        address: currentBusiness.address || '',
        delivery_time: currentBusiness.delivery_time || '',
        image: currentBusiness.image || '',
        delivery_fee: currentBusiness.delivery_fee || 0,
        location: currentBusiness.location || { lat: 19.4326, lng: -99.1332 },
        is_open: currentBusiness.is_open || false,
        rating: currentBusiness.rating || 0,
        promotions: currentBusiness.promotions || []
      });
    }
  }, [businesses, user]);

  const handleLocationChange = useCallback((coords, address) => {
    setProfile(prev => ({
      ...prev,
      address: address,
      location: coords
    }));
  }, []);

  const handleUpdate = async (updatedData) => {
    const { data, error } = await updateBusiness(business.id, updatedData, false);
    if (error) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    }
    return { data, error };
  };

  const handleSave = async () => {
    const updatedData = {
      ...profile,
      delivery_fee: parseFloat(profile.delivery_fee) || 0,
    };
    
    await updateBusiness(business.id, updatedData, true);
    toast({
      title: "Perfil actualizado",
      description: "Los datos de tu negocio se han guardado correctamente",
    });
  };

  if (!business) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-xl">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Perfil del Negocio</h1>
          <p className="text-white/70 text-lg">Administra la información de tu restaurante</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Store className="w-5 h-5" /> Información del Negocio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Nombre del restaurante</Label>
                    <Input id="name" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-white">Categoría</Label>
                    <Input id="category" value={profile.category || ''} onChange={(e) => setProfile({ ...profile, category: e.target.value })} placeholder="Ej: Comida Rápida, Italiana" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-white">Teléfono</Label>
                    <Input id="phone" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+52 123 456 7890" />
                  </div>
                   <div>
                    <Label htmlFor="delivery_time" className="text-white">Tiempo de entrega (rango en min)</Label>
                    <Input id="delivery_time" value={profile.delivery_time || ''} onChange={(e) => setProfile({ ...profile, delivery_time: e.target.value })} placeholder="Ej: 25-35" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="text-white">Dirección (autocompletada por el mapa)</Label>
                  <Input id="address" value={profile.address || ''} readOnly placeholder="Dirección completa aparecerá aquí..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delivery_fee" className="text-white">Costo de envío ($)</Label>
                    <Input id="delivery_fee" type="number" step="0.01" value={profile.delivery_fee || 0} onChange={(e) => setProfile({ ...profile, delivery_fee: e.target.value })} placeholder="0.00" />
                  </div>
                </div>
                 <div>
                    <Label htmlFor="image" className="text-white">URL de imagen de portada</Label>
                    <Input id="image" value={profile.image || ''} onChange={(e) => setProfile({ ...profile, image: e.target.value })} placeholder="https://ejemplo.com/imagen.jpg" />
                  </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <PromotionManager business={business} onUpdate={handleUpdate} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Ubicación del Negocio</div>
                  <Button onClick={() => setTriggerLocate(p => p + 1)} variant="outline" size="sm">
                    <LocateFixed className="w-4 h-4 mr-2" />
                    Mi Ubicación
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LocationPicker onLocationChange={handleLocationChange} initialPosition={profile.location} triggerLocate={triggerLocate} />
              </CardContent>
            </Card>
          </motion.div>

           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
             <Button onClick={handleSave} className="w-full text-lg py-6">
                <Save className="w-5 h-5 mr-3" />
                Guardar todos los cambios
              </Button>
           </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1 space-y-6">
          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <img alt={profile.name || "Imagen de negocio"} className="w-full h-32 object-cover rounded-lg mb-4" src={profile.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop"} />
                <h3 className="text-xl font-bold text-white mb-2">{profile.name}</h3>
                <p className="text-white/70">{profile.category}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/70"><MapPin className="w-4 h-4" /><span className="text-sm">{profile.address || 'Sin dirección'}</span></div>
                <div className="flex items-center gap-2 text-white/70"><Phone className="w-4 h-4" /><span className="text-sm">{profile.phone || 'Sin teléfono'}</span></div>
                <div className="flex items-center gap-2 text-white/70"><Clock className="w-4 h-4" /><span className="text-sm">{profile.delivery_time || 'N/A'} min entrega</span></div>
                <div className="flex items-center gap-2 text-white/70"><DollarSign className="w-4 h-4" /><span className="text-sm">${profile.delivery_fee || 0} envío</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader><CardTitle className="text-white text-lg">Estado del Negocio</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Estado</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${profile.is_open ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white font-medium">{profile.is_open ? 'Abierto' : 'Cerrado'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Calificación</span>
                <div className="flex items-center gap-2">
                  <StarDisplay rating={profile.rating || 0} />
                  <span className="text-white font-bold">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setProfile(p => ({...p, is_open: !p.is_open })); toast({ title: `Negocio ${!profile.is_open ? 'abierto' : 'cerrado'}. Guarda para confirmar.` })}}>
                {profile.is_open ? 'Cerrar negocio' : 'Abrir negocio'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BusinessProfile;