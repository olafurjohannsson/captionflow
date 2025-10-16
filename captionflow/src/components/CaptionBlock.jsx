import React from 'react';

const CaptionBlock = ({ caption, duration, isSelected, onSelect, onResize }) => {
    const left = (caption.start_ms / duration) * 100;
    const width = ((caption.end_ms - caption.start_ms) / duration) * 100;

    const handleResizeStart = (e, edge) => {
        e.stopPropagation(); // Prevent the main block's onClick from firing
        onResize(caption.id, edge, e.clientX); // Pass the starting info to the parent
    };

    return (
        <div
            className={`absolute h-8 top-1/2 -translate-y-1/2 rounded cursor-pointer transition-all group ${isSelected ? 'bg-blue-500 ring-2 ring-blue-400 z-10' : 'bg-slate-700 hover:bg-slate-600'}`}
            style={{ left: `${left}%`, width: `${width}%`, minWidth: '2px' }}
            onClick={() => onSelect(caption.id)}
        >
            {/* The resize handles */}
            <div
                className="absolute left-0 top-0 h-full w-2 cursor-ew-resize"
                onMouseDown={(e) => handleResizeStart(e, 'start')}
            />
            <div
                className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
                onMouseDown={(e) => handleResizeStart(e, 'end')}
            />

            <div className="px-2 py-1 text-xs truncate">{caption.text || "..."}</div>
        </div>
    );
};

export default CaptionBlock;