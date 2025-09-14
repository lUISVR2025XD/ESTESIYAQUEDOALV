import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Users, Store, Truck, User, Search, Plus, Edit, Trash, MoreVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import UserForm from './UserForm';

const UserManagement = () => {
  const { businesses, deliveryPersons, clients, updateClient, updateBusiness, updateDeliveryPerson, deleteClient, deleteBusiness, deleteDeliveryPerson } = useData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('clients');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const allUsers = {
    clients: clients.map(c => ({ ...c, type: 'Cliente', status: c.is_active ? 'Activo' : 'Inactivo' })),
    businesses: businesses.map(b => ({ ...b, type: 'Negocio', status: b.is_active ? 'Activo' : 'Inactivo' })),
    deliveryPersons: deliveryPersons.map(d => ({ ...d, type: 'Repartidor', status: d.is_active ? 'Activo' : 'Inactivo' })),
  };

  const filteredUsers = allUsers[activeTab].filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleDeleteUser = async (user) => {
    try {
      if (user.type === 'Cliente') await deleteClient(user.id);
      if (user.type === 'Negocio') await deleteBusiness(user.id);
      if (user.type === 'Repartidor') await deleteDeliveryPerson(user.id);
      toast({ title: 'Usuario eliminado', description: `${user.name} ha sido eliminado.` });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el usuario.', variant: 'destructive' });
    }
  };


  const handleToggleStatus = async (user) => {
    const newStatus = !user.is_active;
    try {
      if (user.type === 'Cliente') await updateClient(user.id, { is_active: newStatus });
      if (user.type === 'Negocio') await updateBusiness(user.id, { is_active: newStatus });
      if (user.type === 'Repartidor') await updateDeliveryPerson(user.id, { is_active: newStatus });
      toast({ title: 'Estado actualizado', description: `El estado de ${user.name} es ahora ${newStatus ? 'Activo' : 'Inactivo'}.` });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado.', variant: 'destructive' });
    }
  };

  const tabs = [
    { id: 'clients', label: 'Clientes', icon: User, count: clients.length },
    { id: 'businesses', label: 'Negocios', icon: Store, count: businesses.length },
    { id: 'deliveryPersons', label: 'Repartidores', icon: Truck, count: deliveryPersons.length },
  ];

  return (
    <div className="space-y-8">
      <UserForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        user={editingUser}
        userType={tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Gestión de Usuarios</h1>
          <p className="text-white/70 text-lg">Administra todos los usuarios de la plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateUser} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Crear Usuario
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <Button key={tab.id} variant={activeTab === tab.id ? "default" : "outline"} size="sm" onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap ${activeTab === tab.id ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' : 'border-white/20 text-white hover:bg-white/10'}`}>
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label} ({tab.count})
              </Button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
            <Input placeholder={`Buscar ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50" />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-white">Lista de {tabs.find(t => t.id === activeTab)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="p-4 text-white/70">Nombre</th>
                    <th className="p-4 text-white/70">Contacto</th>
                    <th className="p-4 text-white/70 text-center">Estado</th>
                    <th className="p-4 text-white/70 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * index }} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold ${!user.is_active && 'opacity-50'}`}>
                            {user.name.charAt(0)}
                          </div>
                          <span className={`text-white font-medium ${!user.is_active && 'text-white/50'}`}>{user.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-white/80 ${!user.is_active && 'text-white/40'}`}>{user.email || user.phone}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <Switch id={`status-${user.id}`} checked={user.is_active} onCheckedChange={() => handleToggleStatus(user)} />
                           <span className={`text-sm font-medium ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>{user.status}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10">
                              <span className="sr-only">Abrir menú</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-card border-white/20 text-white">
                            <DropdownMenuItem onClick={() => handleEditUser(user)} className="cursor-pointer hover:!bg-white/10">
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-red-400 hover:!bg-red-500/10 hover:!text-red-400">
                                  <Trash className="mr-2 h-4 w-4" />
                                  <span>Eliminar</span>
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glass-card border-white/20">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-white/70">
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario
                                    <span className="font-bold text-white"> {user.name}</span>.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white/70 text-lg">No se encontraron usuarios</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserManagement;