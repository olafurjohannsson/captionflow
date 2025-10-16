import React, { useEffect, useRef, useState } from 'react';

// Helper to format time display on hover
function formatTimeForWaveform(seconds) {
    if (isNaN(seconds)) return '00:00.000';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toFixed(3).toString().padStart(6, '0');
    return `${mins}:${secs}`;
}

const Waveform = ({ waveformData, videoDuration, onSeek, currentTime, viewTransform }) => {
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [hoverTime, setHoverTime] = useState(null);
    const waveformCanvasRef = useRef(null);
    const interactionCanvasRef = useRef(null);
    const isScrubbing = useRef(false);

    // This effect will monitor the size of the container and update the state
    useEffect(() => {
        const canvas = waveformCanvasRef.current;
        if (!canvas) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length > 0 && entries[0].contentRect) {
                const { width, height } = entries[0].contentRect;
                // Update state only if the size has actually changed to avoid needless re-renders
                setCanvasSize(prevSize => {
                    if (prevSize.width !== width || prevSize.height !== height) {
                        return { width, height };
                    }
                    return prevSize;
                });
            }
        });

        // We observe the canvas element itself
        resizeObserver.observe(canvas);

        return () => {
            resizeObserver.unobserve(canvas);
        };
    }, []); 

    useEffect(() => {
        if (!waveformData || waveformData.length === 0 || canvasSize.width === 0 || canvasSize.height === 0) {
            return;
        }

        const canvas = waveformCanvasRef.current;
        const { width, height } = canvasSize;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        const centerY = height / 2;
        context.clearRect(0, 0, width, height);

        const maxPeak = waveformData.reduce((max, current) => Math.max(max, current), 0);
        if (maxPeak <= 0) {
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(56, 189, 248, 0.5)';
            context.beginPath();
            context.moveTo(0, centerY);
            context.lineTo(width, centerY);
            context.stroke();
            return;
        }

        context.lineWidth = 2;
        context.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        const sliceWidth = width / waveformData.length;

        context.beginPath();
        context.moveTo(0, centerY);
        for (let i = 0; i < waveformData.length; i++) {
            const peak = waveformData[i];
            const scaledHeight = (peak / maxPeak) * centerY * 0.8;
            context.lineTo(i * sliceWidth, centerY - scaledHeight);
        }
        context.stroke();

        context.beginPath();
        context.moveTo(0, centerY);
        for (let i = 0; i < waveformData.length; i++) {
            const peak = waveformData[i];
            const scaledHeight = (peak / maxPeak) * centerY * 0.8;
            context.lineTo(i * sliceWidth, centerY + scaledHeight);
        }
        context.stroke();

    }, [waveformData, canvasSize]);

    useEffect(() => {
        const canvas = interactionCanvasRef.current;
        if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;

        const { width, height } = canvasSize;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, width, height);

        if (videoDuration > 0) {
            const worldWidth = canvasSize.width;

            const playheadX = (currentTime / videoDuration) * width;

            const screenWidth = worldWidth / viewTransform.scale;
            if (playheadX >= viewTransform.offset && playheadX <= viewTransform.offset + screenWidth) {
                // We need to translate the playhead's world coordinate back to a screen coordinate for drawing
                const screenX = playheadX - viewTransform.offset;

                context.strokeStyle = 'rgb(255, 255, 255)';
                context.lineWidth = 2;
                context.beginPath();
                context.moveTo(screenX, 0);
                context.lineTo(screenX, height);
                context.stroke();
            }

            // Draw the main line
            // context.strokeStyle = 'rgb(255, 255, 255)'; // White for high contrast
            // context.lineWidth = 2; // Thicker line
            // context.beginPath();
            // context.moveTo(playheadX, 0);
            // context.lineTo(playheadX, height);
            // context.stroke();
            //
            // // Draw the top handle (triangle)
            // context.fillStyle = 'rgb(255, 255, 255)';
            // context.beginPath();
            // context.moveTo(playheadX, 0);
            // context.lineTo(playheadX - 6, -8); // Changed to a triangle pointing up out of the canvas
            // context.lineTo(playheadX + 6, -8);
            // context.closePath();
            // context.fill();
        }

        if (hoverTime) {
            context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(hoverTime.x, 0);
            context.lineTo(hoverTime.x, height);
            context.stroke();
        }
    }, [hoverTime, currentTime, videoDuration, canvasSize]);


    const seekFromMouseEvent = (e) => {
        if (!videoDuration) return;
        const canvas = interactionCanvasRef.current;
        const { left, width } = canvas.getBoundingClientRect();
        const clickX = e.clientX - left;
        const clickPercent = Math.max(0, Math.min(1, clickX / width));
        const timeInSeconds = clickPercent * videoDuration;
        onSeek(timeInSeconds);
    };

    const handleMouseMove = (e) => {
        if (!videoDuration) return;
        const canvas = interactionCanvasRef.current;
        const { left, width } = canvas.getBoundingClientRect();
        const hoverX = e.clientX - left;
        const timeInSeconds = (hoverX / width) * videoDuration;
        setHoverTime({ x: hoverX, time: timeInSeconds });

        if (isScrubbing.current) {
            seekFromMouseEvent(e);
        }
    };

    const handleMouseLeave = () => {
        setHoverTime(null);
        isScrubbing.current = false;
    };

    const handleMouseDown = (e) => {
        isScrubbing.current = true;
        seekFromMouseEvent(e);
    };

    const handleMouseUp = () => {
        isScrubbing.current = false;
    };

    return (
        <div className="w-full h-full relative" style={{ overflow: 'visible' }}>
            <canvas ref={waveformCanvasRef} className="absolute inset-0 w-full h-full" />
            <canvas
                ref={interactionCanvasRef}
                className="absolute inset-0 w-full h-full cursor-pointer z-10"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
            />
            {hoverTime && (
                <div
                    className="absolute top-1 text-xs bg-black/50 text-white p-1 rounded-md pointer-events-none z-20"
                    style={{ left: `${hoverTime.x + 10}px` }}
                >
                    {formatTimeForWaveform(hoverTime.time)}
                </div>
            )}
        </div>
    );
}

export default Waveform;