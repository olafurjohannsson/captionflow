import React from 'react';
import Icon from './Icon';

interface FrameStepControlsProps {
  onFrameStep: (direction: number) => void;
  onScrubStart: (direction: number) => void;
  onScrubEnd: () => void;
}

const FrameStepControls: React.FC<FrameStepControlsProps> = ({
  onFrameStep,
  onScrubStart,
  onScrubEnd
}) => {
  return (
    <div className="flex items-center gap-1 ml-2">
      <button
        onMouseDown={() => onScrubStart(-1)}
        onMouseUp={onScrubEnd}
        onMouseLeave={onScrubEnd}
        onClick={() => onFrameStep(-1)}
        className="p-2 hover:bg-slate-800 rounded transition-colors" 
        title="Previous Frame (Hold to scrub)"
      >
        <Icon name="ChevronLeft" size={18} />
      </button>
      <button
        onMouseDown={() => onScrubStart(1)}
        onMouseUp={onScrubEnd}
        onMouseLeave={onScrubEnd}
        onClick={() => onFrameStep(1)}
        className="p-2 hover:bg-slate-800 rounded transition-colors" 
        title="Next Frame (Hold to scrub)"
      >
        <Icon name="ChevronRight" size={18} />
      </button>
    </div>
  );
};

export default FrameStepControls;