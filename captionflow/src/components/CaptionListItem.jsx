import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, forwardRef } from 'react';
import Icon from './Icon'; 
const formatTime = (ms) => {
    if (isNaN(ms) || ms < 0) return "00:00:00.000";

    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 1000);

    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
    return timeString;
};
const CaptionListItem = forwardRef(({ caption, index, isSelected, isActive, onSelect, onTimeChange, onTextChange }, ref) => {
    
    const [startTime, setStartTime] = useState(formatTime(caption.start_ms));
    const [endTime, setEndTime] = useState(formatTime(caption.end_ms));

    useEffect(() => {
        setStartTime(formatTime(caption.start_ms));
        setEndTime(formatTime(caption.end_ms));
    }, [caption.start_ms, caption.end_ms]);


    const handleTimeBlur = (field, value) => {
        onTimeChange(caption.id, field, value);
    };

    return (
        <div
            className={`border-b border-slate-800 p-3 cursor-pointer transition-all ${isSelected ? 'bg-blue-500/20 border-l-4 border-l-blue-500' : isActive ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
            ref={ref}
            onClick={(e) => onSelect(caption.id, e.metaKey || e.ctrlKey)}
        >
            <div className="flex items-start gap-3">
                <div className="text-slate-500 text-sm font-mono pt-1">{index + 1}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <input
                            type="text"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            onBlur={(e) => handleTimeBlur('start_ms', e.target.value)}
                            className="px-1.5 w-24 py-0.5 bg-slate-700 rounded text-xs font-mono w-16 outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Icon name="ArrowRight" size={12} className="text-slate-600" />
                        <input
                            type="text"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            onBlur={(e) => handleTimeBlur('end_ms', e.target.value)}
                            className="px-1.5 w-24 py-0.5 bg-slate-700 rounded text-xs font-mono w-16 outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <textarea
                        value={caption.text}
                        className="w-full bg-transparent resize-none outline-none text-sm"
                        rows="2"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onTextChange(caption.id, e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
});

export default CaptionListItem;