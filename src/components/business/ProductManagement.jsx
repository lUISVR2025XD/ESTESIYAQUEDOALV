import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

const ProductManagement = () => {
  const { user } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct, businesses } = useData();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image: ''
  });

  const business = businesses.find(b => b.id === user?.id);
  const businessProducts = business ? products.filter(p => p.business_id === business.id) : [];
  const categories = [...new Set(businessProducts.map(p => p.category))];

  const resetForm = () => {
    setProductForm({
      name: '',
      price: '',
      description: '',
      category: '',
      image: ''
    });
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.price || !productForm.category) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    const productData = {
      ...productForm,
      price: parseFloat(productForm.price),
      business_id: business.id,
      image: productForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
      toast({
        title: "Producto actualizado",
        description: `${productData.name} ha sido actualizado`,
      });
    } else {
      await addProduct(productData);
      toast({
        title: "Producto agregado",
        description: `${productData.name} ha sido agregado al menú`,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      category: product.category,
      image: product.image
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (product) => {
    await deleteProduct(product.id);
    toast({
      title: "Producto eliminado",
      description: `${product.name} ha sido eliminado del menú`,
    });
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Gestión de Productos
          </h1>
          <p className="text-white/70 text-lg">
            Administra el menú de tu restaurante
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-0 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">Nombre *</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Nombre del producto"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="price" className="text-white">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-white">Categoría *</Label>
                  <Input
                    id="category"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Ej: Pizzas, Bebidas, Postres"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-white">Descripción</Label>
                  <Input
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Descripción del producto"
                  />
                </div>
                
                <div>
                  <Label htmlFor="image" className="text-white">URL de Imagen</Label>
                  <Input
                    id="image"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:opacity-90"
                  >
                    {editingProduct ? 'Actualizar' : 'Agregar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-2xl font-bold text-white mb-2">No tienes productos aún</h3>
          <p className="text-white/70 mb-6">
            Agrega tu primer producto para comenzar a recibir pedidos
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * categoryIndex }}
            >
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {businessProducts
                      .filter(product => product.category === category)
                      .map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                          <h4 className="text-white font-medium mb-1">{product.name}</h4>
                          <p className="text-white/70 text-sm mb-2 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-white">
                              ${product.price}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(product)}
                                className="border-white/20 text-white hover:bg-white/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(product)}
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;