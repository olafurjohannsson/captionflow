import { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';

import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import CaptionSidebar from './CaptionSidebar';
import Timeline from './Timeline';
import HeaderToolbar from './HeaderToolbar';
import VideoControlsBar from './VideoControlsBar';
import VideoPlayer from './VideoPlayer';

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useTranscriptionProcessor } from '../hooks/useTranscriptionProcessor';
import { useVideoFPS } from '../hooks/useVideoFps';
import { useWhisper } from '../hooks/useWhisper';
import { useCaptionBurner } from '../hooks/useCaptionBurner';
import { useAutoSave } from '../hooks/useAutoSave';
import { useAudioProcessing } from '../hooks/useAudioProcessing';
import { useAudioFFmpegProcessing } from '@/hooks/useAudioProcessingFFmpeg';

import init, {
    CaptionEditor, setup_logging,
    TimelineTransform, transform_handle_wheel
} from '../pkg/captioneditor.js';


import { Caption } from '../types';


const CaptionEditorUI = () => {
    const importFileInputRef = useRef(null);
    const captionListRefs = useRef(new Map());
    const editorRef = useRef(null);
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const wasmInitialized = useRef(false);
    const timelineContainerRef = useRef(null);
    const scrubIntervalRef = useRef(null);
    const handleWheelRef = useRef(null);
    const resizeState = useRef(null);

    const [timelineDimensions, setTimelineDimensions] = useState({ width: 0, height: 0 });
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [viewTransform, setViewTransform] = useState({ scale: 1, offset: 0 });

    const [rendererType, setRendererType] = useState('checking');
    const [isWasmLoaded, setIsWasmLoaded] = useState(false);
    const [videoSrc, setVideoSrc] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [playbackRate, setPlaybackRate] = useState(1);
    const [volume, setVolume] = useState(1);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const { burnerState, burnCaptions } = useCaptionBurner();

    const [displayCaptions, setDisplayCaptions] = useState<Caption[]>([]);
    const [selectedCaptions, setSelectedCaptions] = useState<Set<string>>(new Set());

    const { isReady: isWhisperReady, isTranscribing, transcript, loadModel, transcribe } = useWhisper();
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [transcriptionProgress, setTranscriptionProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    const { saveStatus, triggerSave, projectId, setProjectId } = useAutoSave();
    const fps = useVideoFPS(videoRef)

    const syncCaptionsFromRust = useCallback(() => {
        if (!editorRef.current) return;

        try {
            const jsonString = editorRef.current.export_captions("json");
            const captionsFromRust = JSON.parse(jsonString);
            setDisplayCaptions(captionsFromRust);
        } catch (error) {
            console.error("Failed to sync captions from Rust:", error);
        }
    }, []);

    const { resetProcessor } = useTranscriptionProcessor({
        transcript,
        duration,
        editorRef,
        onProgressUpdate: setTranscriptionProgress,
        onCaptionsUpdate: syncCaptionsFromRust
    });

    const { waveformStatus, rawWaveformData, audioForTranscription, processAudioForWaveform } = useAudioProcessing();

    const waveformData = useMemo(() => rawWaveformData, [rawWaveformData]);

    useEffect(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl', { alpha: true }) || canvas.getContext('experimental-webgl', { alpha: true });

        if (gl && gl instanceof WebGLRenderingContext) {
            console.log("WebGL is supported. Using high-performance renderer.");
            setRendererType('webgl');
        } else {
            console.log("WebGL not supported. Falling back to 2D canvas renderer.");
            setRendererType('2d');
        }
    }, []);


    useEffect(() => {
        if (!videoSrc || !editorRef.current) {
            return;
        }

        const videoFile = fileInputRef.current?.files?.[0];
        if (!videoFile) return;

        const projectData = {
            captions: editorRef.current.export_captions("json"),
            videoName: videoFile.name,
            videoDuration: duration,
            waveformData: rawWaveformData,
        };

        triggerSave(projectData);

    }, [displayCaptions, rawWaveformData, duration, videoSrc, triggerSave]);


    useEffect(() => {
        if (selectedCaptions.size === 1) {
            const firstSelectedId = selectedCaptions.values().next().value;
            const targetNode = captionListRefs.current.get(firstSelectedId);

            if (targetNode) {
                targetNode.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        }
    }, [selectedCaptions]);
    useEffect(() => {
        const timeline = timelineContainerRef.current;
        if (!timeline) return;

        const onWheel = (e) => {
            handleWheelRef.current(e);
        };

        timeline.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            timeline.removeEventListener('wheel', onWheel);
        };
    }, []);

    useEffect(() => {
        if (wasmInitialized.current) {
            return;
        }
        wasmInitialized.current = true;

        const loadWasm = async () => {
            await init();
            setup_logging();

            editorRef.current = new CaptionEditor();

            setIsWasmLoaded(true);
            console.log("WASM module and CaptionEditor initialized ONCE.");
            syncCaptionsFromRust();
        };

        loadWasm();

    }, []); 



    useEffect(() => {
        const video = videoRef.current;
        if (!video || !videoSrc) return;

        video.volume = volume;
        video.playbackRate = playbackRate;

        if (isPlaying) {
            video.play().catch(console.error);
        } else {
            video.pause();
        }
    }, [isPlaying, volume, playbackRate, videoSrc]);


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
            setViewTransform({ scale: newTransform.scale, offset: newTransform.offset });
        };
    });
    const handleUndo = useCallback(() => {
        if (editorRef.current) {
            const success = editorRef.current.undo();
            if (success) {
                console.log("Undo successful");
                syncCaptionsFromRust();
            } else {
                console.log("Nothing to undo");
            }
        }
    }, [syncCaptionsFromRust]); 

    const handleRedo = useCallback(() => {
        if (editorRef.current) {
            const success = editorRef.current.redo();
            if (success) {
                console.log("Redo successful");
                syncCaptionsFromRust();
            } else {
                console.log("Nothing to redo");
            }
        }
    }, [syncCaptionsFromRust]);

    const handleImportClick = () => {
        if (!videoSrc) {
            alert("Please load a video before importing captions.");
            return;
        }
        importFileInputRef.current.click(); 
    };

    const handleCopyCaptionText = () => {
        if (selectedCaptions.size === 0) return;

        const textToCopy = displayCaptions
            .filter(caption => selectedCaptions.has(caption.id))
            .map(caption => caption.text)
            .join("\n");

        navigator.clipboard.writeText(textToCopy).then(() => {
            alert("Copied caption text to clipboard!");
        });
    };
    const handleDeleteCaption = useCallback(() => {
        if (selectedCaptions.size === 0) {
            alert("Please select a caption to delete.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedCaptions.size} caption(s)?`)) {
            if (editorRef.current) {
                const idsToDelete = Array.from(selectedCaptions);
                editorRef.current.delete_captions(idsToDelete);
                syncCaptionsFromRust();
                setSelectedCaptions(new Set());
            }
        }
    }, [selectedCaptions, syncCaptionsFromRust]);

    const handleSplitCaption = useCallback(() => {
        if (selectedCaptions.size !== 1) {
            alert("Please select exactly one caption to split.");
            return;
        }

        const splitTimeMs = Math.floor(currentTime);
        const captionId = selectedCaptions.values().next().value;

        if (editorRef.current) {
            try {
                editorRef.current.split_caption(captionId, splitTimeMs);
                syncCaptionsFromRust();
            } catch (error) {
                alert(`Could not split caption: ${error.toString()}`);
            }
        }
    }, [selectedCaptions, currentTime, syncCaptionsFromRust]);
    const handleResizeStart = (captionId, edge, startX) => {
        resizeState.current = {
            captionId,
            edge, 
            startX,
            originalCaption: displayCaptions.find(c => c.id === captionId),
        };
        window.addEventListener('mousemove', handleResizeMove);
        window.addEventListener('mouseup', handleResizeEnd);
    };
    const handleExport = (format) => {
        if (!editorRef.current || displayCaptions.length === 0) {
            alert("No captions to export.");
            return;
        }
        const fileContent = editorRef.current.export_captions(format);
        const videoFile = fileInputRef.current.files[0];
        const fileName = `${videoFile.name.split('.')[0]}.${format}`;

        const blob = new Blob([fileContent], { type: 'text/plain' });

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setShowExportMenu(false);
    };
    const handleResizeMove = useCallback((e) => {
        if (!resizeState.current) return;

        const { captionId, edge, startX, originalCaption } = resizeState.current;
        const timelineRect = timelineContainerRef.current?.getBoundingClientRect();
        if (!timelineRect) return;

        const dx = e.clientX - startX;
        const pixelsPerSecond = (timelineRect.width * viewTransform.scale) / (duration / 1000);
        const deltaTimeMs = (dx / pixelsPerSecond) * 1000;

        let newStartMs = originalCaption.start_ms;
        let newEndMs = originalCaption.end_ms;

        if (edge === 'start') {
            newStartMs = originalCaption.start_ms + deltaTimeMs;
            newStartMs = Math.max(0, Math.min(newStartMs, newEndMs - 100));
        } else {
            newEndMs = originalCaption.end_ms + deltaTimeMs;
            newEndMs = Math.min(duration, Math.max(newEndMs, newStartMs + 100));
        }

        editorRef.current?.update_caption_timing(captionId, newStartMs, newEndMs);
        syncCaptionsFromRust();
    }, [duration, viewTransform, syncCaptionsFromRust]);

    const handleResizeEnd = () => {
        // Cleanup
        resizeState.current = null;
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
    };

    const handleTranscribe = async () => {
        if (!audioForTranscription) {
            alert("Audio has not been processed yet.");
            return;
        }
        resetProcessor();
        setTranscriptionProgress(0);

        if (!isModelLoaded) {
            console.log("Loading Whisper model...");

            let url = '/ggml-tiny.en.bin';;
            const success = await loadModel(url);
            if (success) {
                setIsModelLoaded(true);
                console.log("Model loaded. Starting transcription...");
                transcribe(audioForTranscription);

            } else {
                console.error("Failed to load model.");
            }
        } else {
            console.log("Model already loaded. Starting transcription...");
            transcribe(audioForTranscription);
        }
    };


    const handleStyleChange = useCallback((captionIds, style) => {
        if (!editorRef.current) return;

        const rustStyle = {
            position: style.position || 'Bottom',
            font_size: style.fontSize || 16,
            color: style.color || '#FFFFFF',
            background: style.backgroundColor || '#000000CC',
            font_family: style.fontFamily || 'Arial',
            bold: style.bold || false,
            italic: style.italic || false,
            underline: style.underline || false,
            alignment: style.alignment || 'Center',
            outline_color: style.outline_color || null,
            outline_width: style.outline_width || 0,
            shadow_color: style.shadow_color || null,
            shadow_offset_x: style.shadow_offset_x || 0,
            shadow_offset_y: style.shadow_offset_y || 0,
        };

        captionIds.forEach(id => {
            try {
                editorRef.current.update_caption_style(id, rustStyle);
            } catch (error) {
                console.error(`Failed to update style for caption ${id}:`, error);
            }
        });

        syncCaptionsFromRust();
    }, [syncCaptionsFromRust]);

    const handleGlobalStyleChange = useCallback((style) => {
        if (!editorRef.current) return;

        const rustStyle = {
            position: style.position || 'Bottom',
            font_size: style.fontSize || 16,
            color: style.color || '#FFFFFF',
            background: style.backgroundColor || '#000000CC',
            font_family: style.fontFamily || 'Arial',
            bold: style.bold || false,
            italic: style.italic || false,
            underline: style.underline || false,
            alignment: style.alignment || 'Center',
            outline_color: style.outline_color || null,
            outline_width: style.outline_width || 0,
            shadow_color: style.shadow_color || null,
            shadow_offset_x: style.shadow_offset_x || 0,
            shadow_offset_y: style.shadow_offset_y || 0,
        };

        try {
            editorRef.current.update_global_style(rustStyle);
            syncCaptionsFromRust();
        } catch (error) {
            console.error('Failed to update global style:', error);
        }
    }, [syncCaptionsFromRust]);


    const handleBurnCaptions = async () => {
        const videoFile = fileInputRef.current?.files?.[0];

        if (!videoFile || !videoSrc || displayCaptions.length === 0) {
            alert("Please load a video and generate captions first.");
            return;
        }

        const srtData = editorRef.current.export_captions("srt");

        await burnCaptions(videoFile, srtData, duration);
    };



    const handleFrameStep = useCallback((direction) => {
        if (!videoRef.current) return;

        const frameRate = fps || 30;
        const frameDurationInSeconds = 1 / frameRate;

        setIsPlaying(false);

        const newTime = Math.max(0, videoRef.current.currentTime + (direction * frameDurationInSeconds));
        videoRef.current.currentTime = newTime;
    }, [fps]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (videoSrc && videoSrc.startsWith('blob:')) {
                URL.revokeObjectURL(videoSrc);
            }

            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            processAudioForWaveform(file, isWasmLoaded);
        }
    };
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime * 1000);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration * 1000);
        }
    };

    const handleSeek = (timeInSeconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime = timeInSeconds;
        }
    };
    const formatDisplayTime = (ms) => {
        if (isNaN(ms) || ms < 0) return "00:00";
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const parseTime = (timeString) => {
        const mainParts = timeString.split('.');
        const mmss = mainParts[0];
        const ms = mainParts[1] ? parseInt(mainParts[1].padEnd(3, '0'), 10) : 0; 

        const timeParts = mmss.split(':');
        if (timeParts.length !== 2) return NaN;

        const minutes = parseInt(timeParts[0], 10);
        const seconds = parseInt(timeParts[1], 10);

        if (isNaN(minutes) || isNaN(seconds) || isNaN(ms)) return NaN;

        return (minutes * 60 + seconds) * 1000 + ms;
    };
    const togglePlayPause = useCallback(() => {
        if (videoSrc) {
            setIsPlaying(prev => !prev);
        }
    }, [videoSrc]);


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                togglePlayPause();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlayPause, handleUndo, handleRedo]);


    const handleCaptionSelect = (id, multiSelect = false) => {
        let newSelected;
        if (multiSelect) {
            newSelected = new Set(selectedCaptions);
            newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
        } else {
            newSelected = new Set([id]);
        }
        setSelectedCaptions(newSelected);

        if (newSelected.size === 1) {
            scrollToCaptionOnTimeline(id);
        }
    };
    const scrollToCaptionOnTimeline = (captionId) => {
        if (!timelineContainerRef.current || duration <= 0) return;

        const targetCaption = displayCaptions.find(c => c.id === captionId);
        if (!targetCaption) return;

        const timelineRect = timelineContainerRef.current.getBoundingClientRect();
        const worldWidth = timelineRect.width * viewTransform.scale;

        const captionStartPixels = (targetCaption.start_ms / duration) * worldWidth;

        const newOffset = captionStartPixels - (timelineRect.width / 2);

        const maxOffset = worldWidth - timelineRect.width;

        setViewTransform(prev => ({
            ...prev,
            offset: Math.max(0, Math.min(newOffset, maxOffset)),
        }));
    };
    const handleAddCaption = useCallback(() => {
        if (!videoRef.current || duration <= 0 || !editorRef.current) return;

        const lastCaptionEndTime = displayCaptions.reduce((max, cap) => Math.max(max, cap.end_ms), 0);
        const newCaptionStartTime = displayCaptions.length > 0 ? lastCaptionEndTime : currentTime;

        if (newCaptionStartTime >= duration) return;

        const newCaptionEndTime = Math.min(newCaptionStartTime + 3000, duration);

        editorRef.current.add_caption(newCaptionStartTime, newCaptionEndTime, "New caption");
        syncCaptionsFromRust();
    }, [duration, displayCaptions, currentTime, syncCaptionsFromRust]);

    const handleCaptionTextChange = useCallback((id, newText) => {
        if (!editorRef.current) return;

        editorRef.current.update_caption_text(id, newText);
        syncCaptionsFromRust();
    }, [syncCaptionsFromRust]);

    const handleCaptionTimeChange = useCallback((id, field, timeString) => {
        if (!editorRef.current) return;

        const newMs = parseTime(timeString);
        if (isNaN(newMs)) return;

        const targetCaption = displayCaptions.find(c => c.id === id);
        if (!targetCaption) return;

        const newStart = field === 'start_ms' ? newMs : targetCaption.start_ms;
        const newEnd = field === 'end_ms' ? newMs : targetCaption.end_ms;

        editorRef.current.update_caption_timing(id, newStart, newEnd);
        syncCaptionsFromRust();
    }, [displayCaptions, syncCaptionsFromRust]);

    const handleScrubStart = (direction) => {
        if (scrubIntervalRef.current) clearInterval(scrubIntervalRef.current); 
        handleFrameStep(direction);
        scrubIntervalRef.current = setInterval(() => {
            handleFrameStep(direction);
        }, 100);
    };

    const handleScrubEnd = () => {
        if (scrubIntervalRef.current) {
            clearInterval(scrubIntervalRef.current);
        }
    };

    useEffect(() => {
        return () => {
            if (videoSrc && videoSrc.startsWith('blob:')) {
                URL.revokeObjectURL(videoSrc);
            }
        };
    }, [videoSrc]);

    const activeCaption: Caption | undefined = displayCaptions.find(c => currentTime >= c.start_ms && currentTime <= c.end_ms);

     return (
        <div className="h-screen bg-background text-foreground flex flex-col font-sans">
            <HeaderToolbar
                onExport={handleExport}
                onShowKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
                saveStatus={saveStatus}
                hasVideo={!!videoSrc}
                hasCaptions={displayCaptions.length > 0}
            />

            <main className="flex-1 flex overflow-hidden">
                <PanelGroup direction="horizontal">
                    {/* Main Content Panel */}
                    <Panel defaultSize={70} minSize={30}>
                        <div className="flex flex-col h-full bg-black">
                            <PanelGroup direction="vertical">
                                {/* Video Player Panel */}
                                <Panel defaultSize={70} minSize={40}>
                                    <VideoPlayer
                                        videoSrc={videoSrc}
                                        videoRef={videoRef}
                                        fileInputRef={fileInputRef}
                                        currentTime={currentTime}
                                        fps={fps}
                                        activeCaption={activeCaption}
                                        formatDisplayTime={(ms) => new Date(ms).toISOString().substr(14, 8)}
                                        onTogglePlayPause={togglePlayPause}
                                        onFileChange={handleFileChange}
                                        onTimeUpdate={() => setCurrentTime((videoRef.current?.currentTime || 0) * 1000)}
                                        onLoadedMetadata={() => setDuration((videoRef.current?.duration || 0) * 1000)}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                    />
                                </Panel>
                                <PanelResizeHandle className="h-1 bg-border hover:bg-secondary transition-colors cursor-row-resize" />
                                {/* Timeline Panel */}
                                <Panel defaultSize={30} minSize={20}>
                                    <div className="flex flex-col h-full bg-card">
                                        <div className="flex-1 overflow-hidden" ref={timelineContainerRef}>
                                            <Timeline
                                                duration={duration}
                                                currentTime={currentTime}
                                                waveformStatus={waveformStatus}
                                                waveformData={rawWaveformData}
                                                rendererType="webgl" // Assuming WebGL for now
                                                displayCaptions={displayCaptions}
                                                selectedCaptions={selectedCaptions}
                                                viewTransform={viewTransform}
                                                onViewTransformChange={setViewTransform}
                                                onSeek={(time) => { if (videoRef.current) videoRef.current.currentTime = time; }}
                                                onCaptionSelect={(id, multi) => {/* Your select logic */}}
                                                onCaptionResize={(id, edge, startX) => {/* Your resize logic */}}
                                            />
                                        </div>
                                        <VideoControlsBar
                                            isPlaying={isPlaying}
                                            playbackRate={playbackRate}
                                            volume={volume}
                                            viewTransform={viewTransform}
                                            onTogglePlayPause={togglePlayPause}
                                            onFrameStep={(dir) => {/* Your frame step logic */}}
                                            onScrubStart={(dir) => {/* Your scrub logic */}}
                                            onScrubEnd={() => {/* Your scrub logic */}}
                                            onPlaybackRateChange={setPlaybackRate}
                                            onVolumeChange={setVolume}
                                        />
                                    </div>
                                </Panel>
                            </PanelGroup>
                        </div>
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-border hover:bg-secondary transition-colors cursor-col-resize" />
                    {/* Sidebar Panel */}
                    <Panel defaultSize={30} minSize={20}>
                        <CaptionSidebar
                            isWhisperReady={isWhisperReady}
                            isTranscribing={isTranscribing}
                            transcriptionProgress={transcriptionProgress}
                            onTranscribe={handleTranscribe}
                            videoSrc={videoSrc}
                            burnerState={burnerState}
                            onBurnCaptions={handleBurnCaptions}
                            displayCaptions={displayCaptions}
                            selectedCaptions={selectedCaptions}
                            searchTerm={searchTerm}
                            currentTime={currentTime}
                            captionListRefs={captionListRefs}
                            onAddCaption={() => {/* Your add caption logic */}}
                            onSplitCaption={() => {/* Your split logic */}}
                            onCopyCaptionText={() => {/* Your copy logic */}}
                            onDeleteCaption={() => {/* Your delete logic */}}
                            onSearchChange={setSearchTerm}
                            onCaptionSelect={(id, multi) => {/* Your select logic */}}
                            onTimeChange={(id, field, value) => {/* Your time change logic */}}
                            onTextChange={(id, text) => {/* Your text change logic */}}
                            onStyleChange={(ids, style) => {/* Your style logic */}}
                            onGlobalStyleChange={(style) => {/* Your global style logic */}}
                        />
                    </Panel>
                </PanelGroup>
            </main>

            {showKeyboardShortcuts && (
                <KeyboardShortcutsModal
                    isOpen={showKeyboardShortcuts}
                    onClose={() => setShowKeyboardShortcuts(false)}
                />
            )}
        </div>
    );
};
export { CaptionEditorUI };