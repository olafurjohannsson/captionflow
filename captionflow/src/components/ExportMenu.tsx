import React from 'react';
import Icon from './Icon';

interface ExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string) => void;
  disabled?: boolean;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ isOpen, onClose, onExport, disabled = false }) => {
  const handleExport = (format: string) => {
    onExport(format);
    onClose();
  };

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && onClose()}
        disabled={disabled}
        className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon name="Download" size={16} />
        Export
      </button>
      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 w-32 bg-slate-800 rounded-md shadow-lg z-20">
          <button 
            onClick={() => handleExport('srt')} 
            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700"
          >
            .srt
          </button>
          <button 
            onClick={() => handleExport('vtt')} 
            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700"
          >
            .vtt
          </button>
          <button 
            onClick={() => handleExport('json')} 
            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700"
          >
            .json
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;