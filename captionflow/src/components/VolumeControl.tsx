import React from 'react';
import Icon from './Icon';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({ volume, onVolumeChange }) => {
  return (
    <div className="flex items-center gap-2">
      <Icon name="Volume2" size={18} className="text-slate-400" />
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.1" 
        value={volume} 
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))} 
        className="w-24" 
      />
    </div>
  );
};

export default VolumeControl;