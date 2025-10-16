import React from 'react';

interface PlaybackRateControlsProps {
  currentRate: number;
  onRateChange: (rate: number) => void;
  rates?: number[];
}

const PlaybackRateControls: React.FC<PlaybackRateControlsProps> = ({ 
  currentRate, 
  onRateChange, 
  rates = [0.25, 0.5, 1, 1.5, 2, 4, 8] 
}) => {
  return (
    <div className="flex items-center gap-1 ml-4 p-1 bg-slate-800 rounded-md">
      {rates.map(rate => (
        <button
          key={rate}
          onClick={() => onRateChange(rate)}
          className={`px-2 py-0.5 text-sm rounded transition-colors ${
            currentRate === rate 
              ? 'bg-blue-500 text-white' 
              : 'hover:bg-slate-700'
          }`}
        >
          {rate}x
        </button>
      ))}
    </div>
  );
};

export default PlaybackRateControls;