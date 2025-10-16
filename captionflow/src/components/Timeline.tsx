import React, { useRef, useLayoutEffect, useState } from 'react';
import Icon from './Icon';
import WaveformWebGL from './WaveformGL';
import EmptyWaveformPlaceholder from './EmptyWaveformPlaceholder';
import CaptionBlock from './CaptionBlock';
import { TimelineTransform, transform_handle_wheel, transform_handle_pan_move, transform_get_time_from_click } from '../pkg/captioneditor.js';
import { WaveformStatus } from '../types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  waveformStatus: WaveformStatus;
  waveformData: number[];
  rendererType: string;
  displayCaptions: any[];
  selectedCaptions: Set<string>;
  viewTransform: { scale: number; offset: number };
  onViewTransformChange: (transform: { scale: number; offset: number }) => void;
  onSeek: (timeInSeconds: number) => void;
  onCaptionSelect: (id: string, multiSelect?: boolean) => void;
  onCaptionResize: (captionId: string, edge: string, startX: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  waveformStatus,
  waveformData,
  rendererType,
  displayCaptions,
  selectedCaptions,
  viewTransform,
  onViewTransformChange,
  onSeek,
  onCaptionSelect,
  onCaptionResize
}) => {
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const handleWheelRef = useRef<((e: WheelEvent) => void) | null>(null);
  const panState = useRef({ isPanning: false, startX: 0, startOffset: 0 });
  const [timelineDimensions, setTimelineDimensions] = useState({ width: 0, height: 0 });

  // Handle wheel events for zooming
  useLayoutEffect(() => {
    handleWheelRef.current = (e) => {
      if (!timelineContainerRef.current || duration <= 0) return;
      e.preventDefault();

      const timelineRect = timelineContainerRef.current.getBoundingClientRect();
      const currentTransform = new TimelineTransform(viewTransform.scale, viewTransform.offset);

      const newTransform = transform_handle_wheel(
        currentTransform,
        duration,
        timelineRect.width,
        e.clientX - timelineRect.left,
        e.deltaY
      );
      onViewTransformChange({ scale: newTransform.scale, offset: newTransform.offset });
    };
  });

  // Set up wheel event listener
  useLayoutEffect(() => {
    const timeline = timelineContainerRef.current;
    if (!timeline) return;

    const onWheel = (e: WheelEvent) => {
      handleWheelRef.current?.(e);
    };

    timeline.addEventListener('wheel', onWheel, { passive: false });
    return () => timeline.removeEventListener('wheel', onWheel);
  }, []);

  // Set up resize observer
  useLayoutEffect(() => {
    const timeline = timelineContainerRef.current;
    if (!timeline) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setTimelineDimensions({ width, height });
      }
    });

    resizeObserver.observe(timeline);
    return () => resizeObserver.disconnect();
  }, []);

  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    panState.current = {
      isPanning: true,
      startX: e.clientX,
      startOffset: viewTransform.offset,
    };
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!panState.current.isPanning) return;
    const timelineRect = timelineContainerRef.current?.getBoundingClientRect();
    if (!timelineRect) return;

    const startTransform = new TimelineTransform(viewTransform.scale, panState.current.startOffset);
    const newTransform = transform_handle_pan_move(
      startTransform,
      timelineRect.width,
      panState.current.startX,
      e.clientX
    );

    onViewTransformChange({ scale: newTransform.scale, offset: newTransform.offset });
  };

  const handlePanEnd = () => {
    panState.current.isPanning = false;
  };

  const seekFromTimelineEvent = (e: React.MouseEvent) => {
    if (!duration || !timelineContainerRef.current) return;
    const rect = timelineContainerRef.current.getBoundingClientRect();

    const currentTransform = new TimelineTransform(viewTransform.scale, viewTransform.offset);
    const timeInSeconds = transform_get_time_from_click(
      currentTransform,
      duration,
      rect.width,
      e.clientX - rect.left
    );

    onSeek(timeInSeconds);
  };

  const generateTimeRuler = () => {
    if (duration <= 0) return null;

    const totalSeconds = duration / 1000;
    const timelineRect = timelineContainerRef.current?.getBoundingClientRect();
    if (!timelineRect) return null;

    const secondsOnScreen = totalSeconds / viewTransform.scale;

    let interval;
    if (secondsOnScreen <= 10) {
      interval = 0.5;
    } else if (secondsOnScreen <= 30) {
      interval = 2;
    } else if (secondsOnScreen <= 60) {
      interval = 5;
    } else if (secondsOnScreen <= 300) {
      interval = 30;
    } else if (secondsOnScreen <= 600) {
      interval = 60;
    } else if (secondsOnScreen <= 1800) {
      interval = 120;
    } else {
      interval = 300;
    }

    const ticks = [];
    const firstVisibleSecond = (viewTransform.offset / (timelineRect.width * viewTransform.scale)) * totalSeconds;
    const lastVisibleSecond = firstVisibleSecond + secondsOnScreen;
    const startTick = Math.floor(firstVisibleSecond / interval) * interval;

    for (let i = startTick; i <= lastVisibleSecond + interval; i += interval) {
      if (i >= 0) {
        ticks.push(Math.round(i * 100) / 100);
      }
    }

    return ticks.map(second => (
      <div
        key={second}
        className="absolute text-xs text-slate-500 transform -translate-x-1/2"
        style={{ left: `${(second / totalSeconds) * 100}%` }}
      >
        {`${Math.floor(second / 60)}:${(second % 60).toString().padStart(2, '0')}`}
      </div>
    ));
  };

  return (
    <div className="h-full bg-slate-900 border-t border-slate-800 flex flex-col relative">
      <div
        ref={timelineContainerRef}
        className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        <div
          className="h-full absolute top-0"
          style={{
            width: `${viewTransform.scale * 100}%`,
            left: `-${viewTransform.offset}px`,
          }}
        >
          {/* Waveform Container */}
          <div className="absolute top-0 w-full h-40">
            {waveformStatus === 'idle' && <EmptyWaveformPlaceholder />}
            {waveformStatus === 'loading' && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin"></div>
                <p>Generating waveform...</p>
              </div>
            )}
            {waveformStatus === 'error' && (
              <div className="text-red-500 flex items-center gap-2">
                <Icon name="AlertTriangle" size={18} />
                <p>Failed to process audio.</p>
              </div>
            )}
            {waveformStatus === 'success' && (
              <>
                {rendererType === 'webgl' && (
                  <WaveformWebGL
                    waveformData={waveformData}
                    videoDuration={duration / 1000}
                    currentTime={currentTime / 1000}
                    onSeek={seekFromTimelineEvent}
                    viewTransform={viewTransform}
                    timelineWidth={timelineDimensions.width}
                    timelineContainerRef={timelineContainerRef}
                  />
                )}
                {rendererType === '2d' && (
                  <h1>Missing 2D renderer implementation</h1>
                )}
              </>
            )}
          </div>

          {/* Time Ruler & Caption Track */}
          <div className="absolute top-40 w-full h-16">
            <div className="w-full h-6 pointer-events-none">
              {generateTimeRuler()}
            </div>

            <div className="w-full h-10 relative">
              {duration > 0 && displayCaptions.map(caption => (
                <CaptionBlock
                  key={caption.id}
                  caption={caption}
                  duration={duration}
                  isSelected={selectedCaptions.has(caption.id)}
                  onSelect={onCaptionSelect}
                  onResize={onCaptionResize}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;