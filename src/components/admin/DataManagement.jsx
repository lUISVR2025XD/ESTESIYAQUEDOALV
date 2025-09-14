import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
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

const DataManagement = () => {
  const { orders, deleteCompletedOrders } = useData();
  const { toast } = useToast();

  const completedOrders = orders.filter(
    order => order.status === 'delivered' || order.status === 'cancelled'
  );

  const handlePurge = async () => {
    try {
      await deleteCompletedOrders();
      toast({
        title: <div className="flex items-center gap-2"><CheckCircle className="text-green-500" /><span>Depuración exitosa</span></div>,
        description: "Todos los pedidos completados y cancelados han sido eliminados.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-2"><AlertTriangle /><span>Error</span></div>,
        description: "No se pudo completar la depuración. Inténtalo de nuevo.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-white mb-2">Depuración de Datos</h1>
        <p className="text-white/70 text-lg">
          Mantén la base de datos limpia y optimizada eliminando registros antiguos.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Depuración de Pedidos
            </CardTitle>
            <CardDescription className="text-white/60">
              Elimina permanentemente todos los pedidos que ya han sido completados (entregados o cancelados).
              Esta acción es irreversible y ayuda a mantener la base de datos eficiente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-white/80">Pedidos a depurar:</p>
              <p className="text-3xl font-bold text-cyan-400">{completedOrders.length}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={completedOrders.length === 0} className="bg-red-600 hover:bg-red-700 text-white w-full md:w-auto">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Depurar Pedidos Completados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-card border-white/20">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/70">
                    Esta acción no se puede deshacer. Se eliminarán permanentemente 
                    <span className="font-bold text-cyan-400"> {completedOrders.length}</span> pedidos de la base de datos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePurge} className="bg-red-600 hover:bg-red-700">
                    Sí, depurar pedidos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DataManagement;