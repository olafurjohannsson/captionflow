import React from 'react';
import Icon from './Icon';

interface SaveStatusIndicatorProps {
  status: 'saving' | 'saved' | 'error' | 'idle';
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ status }) => {
  if (status === 'idle') return null;

  const statusConfig = {
    saving: {
      icon: 'Loader',
      text: 'Saving...',
      className: 'text-slate-400',
      iconClass: 'animate-spin'
    },
    saved: {
      icon: 'Check',
      text: 'Saved',
      className: 'text-green-400',
      iconClass: ''
    },
    error: {
      icon: 'AlertTriangle',
      text: 'Error',
      className: 'text-red-400',
      iconClass: ''
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 text-sm ${config.className}`}>
      <Icon name={config.icon} size={16} className={config.iconClass} />
      {config.text}
    </div>
  );
};

export default SaveStatusIndicator;