import React from 'react';
import Icon from './Icon';
import FrameStepControls from './FrameStepControls';
import PlaybackRateControls from './PlaybackRateControls';
import VolumeControl from './VolumeControl';

interface VideoControlsBarProps {
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  viewTransform: { scale: number; offset: number };
  onTogglePlayPause: () => void;
  onFrameStep: (direction: number) => void;
  onScrubStart: (direction: number) => void;
  onScrubEnd: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onVolumeChange: (volume: number) => void;
}

const VideoControlsBar: React.FC<VideoControlsBarProps> = ({
  isPlaying,
  playbackRate,
  volume,
  viewTransform,
  onTogglePlayPause,
  onFrameStep,
  onScrubStart,
  onScrubEnd,
  onPlaybackRateChange,
  onVolumeChange
}) => {
  return (
    <div className="h-40 bg-slate-900 border-t border-slate-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={onTogglePlayPause} 
            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
          >
            <Icon name={isPlaying ? "Pause" : "Play"} size={18} />
          </button>
          
          <FrameStepControls
            onFrameStep={onFrameStep}
            onScrubStart={onScrubStart}
            onScrubEnd={onScrubEnd}
          />
          
          <PlaybackRateControls 
            currentRate={playbackRate}
            onRateChange={onPlaybackRateChange}
          />
          
          <div className="ml-4 text-sm text-slate-400 font-mono p-1 bg-slate-800 rounded-md">
            Zoom: {viewTransform.scale.toFixed(1)}x
          </div>
        </div>
        
        <VolumeControl 
          volume={volume}
          onVolumeChange={onVolumeChange}
        />
      </div>
    </div>
  );
};

export default VideoControlsBar;