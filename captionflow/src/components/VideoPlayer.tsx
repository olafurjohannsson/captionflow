import React from 'react';
import Icon from './Icon';
import Caption from '../types';
import VideoOverlay from './VideoOverlay';

interface VideoPlayerProps {
  videoSrc: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  currentTime: number;
  fps: number;
  activeCaption?: Caption | null;
  formatDisplayTime: (ms: number) => string;
  onTogglePlayPause: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onPlay: () => void;
  onPause: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSrc,
  videoRef,
  fileInputRef,
  currentTime,
  fps,
  activeCaption,
  formatDisplayTime,
  onTogglePlayPause,
  onFileChange,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause
}) => {
  const handleVideoAreaClick = () => {
    if (!videoSrc) {
      fileInputRef.current?.click();
    } else {
      onTogglePlayPause();
    }
  };

  return (
    <div className={`flex-1 video-container relative flex items-center justify-center h-full ${videoSrc ? 'cursor-pointer' : ''}`} onClick={handleVideoAreaClick}>
      {!videoSrc && (
        <div className="flex flex-col items-center justify-center text-center cursor-pointer">
          <Icon name="Film" size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-500">Video Preview Area</p>
          <p className="text-slate-600 text-sm mt-2">Click to browse or drop a video file</p>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        accept="video/*" 
        className="hidden" 
      />
      
      <video
        ref={videoRef}
        src={videoSrc || undefined}
        className={`w-full h-full object-contain ${!videoSrc ? 'hidden' : ''}`}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onPlay={onPlay}
        onPause={onPause}
      />
      
      {videoSrc && (
        <VideoOverlay
          currentTime={currentTime}
          fps={fps}
          activeCaption={activeCaption}
          formatDisplayTime={formatDisplayTime}
        />
      )}
    </div>
  );
};

export default VideoPlayer;