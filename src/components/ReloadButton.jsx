import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

const ReloadButton = ({ className = '', ...props }) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Button
      onClick={handleReload}
      className={`bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-200 ${className}`}
      {...props}
    >
      <RefreshCcw className="w-4 h-4 mr-2" />
      Pulsa para recargar
    </Button>
  );
};

export default ReloadButton;