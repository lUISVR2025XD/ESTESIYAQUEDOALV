import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Store, Truck } from 'lucide-react';
import { Label } from '@/components/ui/label';

const StarRating = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            className={`transition-colors duration-200 ${
              ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-500'
            }`}
            onClick={() => setRating(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
          >
            <Star className="w-8 h-8 fill-current" />
          </button>
        );
      })}
    </div>
  );
};

const RatingModal = ({ isOpen, onClose, order, business, deliveryPerson, onSubmit }) => {
  const [businessRating, setBusinessRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    onSubmit({
      business_rating: businessRating,
      delivery_rating: deliveryRating,
      comment: comment,
    });
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-0 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Califica tu experiencia</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <Label className="flex items-center justify-center gap-2 text-lg">
              <Store className="w-5 h-5" />
              Calificar a {business?.name || 'Negocio'}
            </Label>
            <StarRating rating={businessRating} setRating={setBusinessRating} />
          </div>

          {deliveryPerson && (
            <div className="text-center space-y-2">
              <Label className="flex items-center justify-center gap-2 text-lg">
                <Truck className="w-5 h-5" />
                Calificar a {deliveryPerson?.name || 'Repartidor'}
              </Label>
              <StarRating rating={deliveryRating} setRating={setDeliveryRating} />
            </div>
          )}

          <div>
            <Label htmlFor="comment">Comentarios (opcional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te pareció el servicio?"
              className="bg-white/10 border-white/20 placeholder:text-white/50"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!businessRating && !deliveryRating}>
            Enviar Calificación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;