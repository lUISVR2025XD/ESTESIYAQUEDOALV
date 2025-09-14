import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function calculateTotalDeliveryTime(order, business) {
  if (!business) return 'N/A';

  const prepTime = (order && order.preparation_time) ? parseInt(order.preparation_time, 10) : 0;
  
  // If there's no prep time and we are in a context that requires it (like post-acceptance), return N/A
  if (order && !order.preparation_time) return 'N/A';
  
  const deliveryTimeString = business.delivery_time || '';
  
  const matches = deliveryTimeString.match(/(\d+)-(\d+)/);
  
  if (matches) {
    const minDelivery = parseInt(matches[1], 10);
    const maxDelivery = parseInt(matches[2], 10);
    
    const minTotal = minDelivery + prepTime;
    const maxTotal = maxDelivery + prepTime;
    
    return `${minTotal}-${maxTotal} min`;
  }
  
  const singleDeliveryTime = parseInt(deliveryTimeString, 10);
  if (!isNaN(singleDeliveryTime)) {
    const total = singleDeliveryTime + prepTime;
    return total > 0 ? `${total} min` : 'N/A';
  }
  
  return deliveryTimeString || 'N/A';
}