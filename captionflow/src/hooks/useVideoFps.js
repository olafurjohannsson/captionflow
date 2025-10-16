import { useState, useEffect, useRef } from 'react';

export const useVideoFPS = (videoRef) => {
    const [fps, setFps] = useState(0);
    const lastTimeRef = useRef(0);
    const frameCountRef = useRef(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !('requestVideoFrameCallback' in video)) {
            console.warn('requestVideoFrameCallback is not supported by this browser.');
            return;
        }

        let frameCallbackHandle;

        const onFrame = (now, metadata) => {
            frameCountRef.current++;
            if (lastTimeRef.current === 0) {
                lastTimeRef.current = now;
            }

            const elapsed = now - lastTimeRef.current;
            if (elapsed >= 1000) { // Update FPS every second
                const calculatedFps = (frameCountRef.current * 1000) / elapsed;
                setFps(calculatedFps);
                lastTimeRef.current = now;
                frameCountRef.current = 0;
            }

            // Request the next frame
            frameCallbackHandle = video.requestVideoFrameCallback(onFrame);
        };

        // Start listening
        frameCallbackHandle = video.requestVideoFrameCallback(onFrame);

        // Cleanup function
        return () => {
            if (frameCallbackHandle) {
                video.cancelVideoFrameCallback(frameCallbackHandle);
            }
        };
    }, [videoRef]);

    return Math.round(fps);
};