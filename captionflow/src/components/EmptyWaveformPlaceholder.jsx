import React, { useEffect, useRef } from 'react';

const EmptyWaveformPlaceholder = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;

        const centerY = height / 2;
        const gridColor = 'rgba(71, 85, 105, 0.3)'; 
        const centerLineColor = 'rgba(71, 85, 105, 0.7)'; 

        context.strokeStyle = gridColor;
        context.lineWidth = 1;
        const interval = 50; 

        for (let i = 0; i < width; i += interval) {
            context.beginPath();
            context.moveTo(i, 0);
            context.lineTo(i, height);
            context.stroke();
        }

        context.strokeStyle = centerLineColor;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, centerY);
        context.lineTo(width, centerY);
        context.stroke();

    }, []);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default EmptyWaveformPlaceholder;