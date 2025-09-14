import React from 'react';
import { Star } from 'lucide-react';

const StarDisplay = ({ rating, totalStars = 5, size = 'w-4 h-4' }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={`${size} text-yellow-400 fill-current`} />
      ))}
      {halfStar && (
        <div className="relative">
          <Star className={`${size} text-yellow-400 fill-current`} style={{ clipPath: 'inset(0 50% 0 0)' }} />
          <Star className={`${size} text-gray-400 absolute top-0 left-0`} style={{ clipPath: 'inset(0 0 0 50%)' }} />
        </div>
      )}
      {[...Array(Math.max(0, emptyStars))].map((_, i) => (
        <Star key={`empty-${i}`} className={`${size} text-gray-400`} />
      ))}
    </div>
  );
};

export default StarDisplay;