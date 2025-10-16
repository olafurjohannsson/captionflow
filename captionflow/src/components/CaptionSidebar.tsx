import React, { useState } from 'react';
import Icon from './Icon';
import CaptionListItem from './CaptionListItem';
import { Caption } from '../types';

interface CaptionSidebarProps {
  // Transcription props
  isWhisperReady: boolean;
  isTranscribing: boolean;
  transcriptionProgress: number;
  onTranscribe: () => void;
  videoSrc: string | null;

  // Caption burning props
  burnerState: { isBurning: boolean; progress: number; message: string };
  onBurnCaptions: () => void;

  // Caption management props
  displayCaptions: Caption[];
  selectedCaptions: Set<string>;
  searchTerm: string;
  currentTime: number;
  captionListRefs: React.MutableRefObject<Map<string, any>>;

  // Event handlers
  onAddCaption: () => void;
  onSplitCaption: () => void;
  onCopyCaptionText: () => void;
  onDeleteCaption: () => void;
  onSearchChange: (term: string) => void;
  onCaptionSelect: (id: string, multiSelect?: boolean) => void;
  onTimeChange: (id: string, field: string, timeString: string) => void;
  onTextChange: (id: string, newText: string) => void;

  onStyleChange?: (captionIds: string[], style: any) => void;
  onGlobalStyleChange?: (style: any) => void;
}

const CaptionSidebar: React.FC<CaptionSidebarProps> = ({
  isWhisperReady,
  isTranscribing,
  transcriptionProgress,
  onTranscribe,
  videoSrc,
  burnerState,
  onBurnCaptions,
  displayCaptions,
  selectedCaptions,
  searchTerm,
  currentTime,
  captionListRefs,
  onAddCaption,
  onSplitCaption,
  onCopyCaptionText,
  onDeleteCaption,
  onSearchChange,
  onCaptionSelect,
  onTimeChange,
  onTextChange,
  onStyleChange,
  onGlobalStyleChange
}) => {
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [currentStyle, setCurrentStyle] = useState({
    fontFamily: 'Arial',
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#000000CC',
    bold: false,
    italic: false,
    underline: false,
    alignment: 'Center',
    position: 'Bottom',
    animation_type: null,
    animation_duration: 0.3,
    shadow_color: '#000000',
    shadow_blur: 0,
    border_radius: 0,
    letter_spacing: 0,
    highlight_enabled: false,
    highlight_color: '#FFFF00',
    highlight_background: '#FF000080',
    highlight_underline: true,
    highlight_bold: true,
    highlight_scale: 1.1
  });

  const handleStyleUpdate = (styleUpdate: any) => {
    const newStyle = { ...currentStyle, ...styleUpdate };
    setCurrentStyle(newStyle);

    if (selectedCaptions.size > 0) {
      // Apply to selected captions
      onStyleChange?.(Array.from(selectedCaptions), newStyle);
    } else {
      // Apply globally
      onGlobalStyleChange?.(newStyle);
    }
  };

  return (
    <div className="flex-1 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
      {/* Transcription Section */}
      <div className="p-3 border-b border-slate-800">
        <button
          onClick={onTranscribe}
          disabled={!videoSrc || !isWhisperReady || isTranscribing}
          className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-slate-700 disabled:cursor-not-allowed"
        >
          <Icon name={isTranscribing ? "Loader" : "Mic"} size={16} className={isTranscribing ? "animate-spin" : ""} />
          {isTranscribing ? `Transcribing - ${Math.round(transcriptionProgress)}%` : 'Auto-Transcribe with Whisper'}
        </button>
        {isTranscribing && (
          <div className="mt-2 text-center">
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div
                className="bg-purple-500 h-2.5 rounded-full"
                style={{ width: `${transcriptionProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        {!isWhisperReady && <p className="text-xs text-slate-500 text-center mt-1">Whisper module loading...</p>}
      </div>

      {/* Caption Burning Section */}
      <div className="p-3 border-b border-slate-800">
        <button
          onClick={onBurnCaptions}
          disabled={!videoSrc || isTranscribing || burnerState.isBurning || displayCaptions.length === 0}
          className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-slate-700 disabled:cursor-not-allowed"
        >
          <Icon name={burnerState.isBurning ? "Loader" : "CloudDownload"} size={16} className={burnerState.isBurning ? "animate-spin" : ""} />
          {burnerState.isBurning ? (burnerState.progress > 0 ? `Processing - ${burnerState.progress}%` : 'Please wait...') : 'Download with Captions'}
        </button>

        {burnerState.isBurning && (
          <div className="mt-2 text-center">
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full"
                style={{ width: `${burnerState.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-1">{burnerState.message}</p>
          </div>
        )}
      </div>

      {/* Caption Tools */}
      <div className="p-3 border-b border-slate-800 overflow-y-auto max-h-96">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onAddCaption}
            disabled={!videoSrc}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            <Icon name="Plus" size={16} />
          </button>
          <button
            onClick={() => setShowStylePanel(!showStylePanel)}
            className={`p-1.5 hover:bg-slate-800 rounded transition-colors ${showStylePanel ? 'bg-slate-700' : ''}`}
          >
            <Icon name="Type" size={18} />
          </button>
          <button
            onClick={onSplitCaption}
            disabled={selectedCaptions.size !== 1}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            <Icon name="Scissors" size={18} />
          </button>
          <button
            onClick={onCopyCaptionText}
            disabled={selectedCaptions.size === 0}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            <Icon name="Copy" size={18} />
          </button>
          <button
            onClick={onDeleteCaption}
            disabled={selectedCaptions.size === 0}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors text-red-400 disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            <Icon name="Trash2" size={18} />
          </button>

        </div>


        {/* Style Panel */}
        {showStylePanel && (
          <div className="mt-3 p-3 bg-slate-800 rounded-lg space-y-3">
            <div className="text-xs text-slate-400 mb-2">
              {selectedCaptions.size > 0 ? `Styling ${selectedCaptions.size} caption(s)` : 'Global styling'}
            </div>

            {/* Social Media Presets */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStyleUpdate({
                    fontFamily: 'Inter',
                    fontSize: 20,
                    color: '#FFFFFF',
                    backgroundColor: 'transparent',
                    bold: true,
                    alignment: 'Center',
                    position: 'Bottom',
                    animation_type: 'slide',
                    animation_duration: 0.3,
                    shadow_color: '#000000',
                    shadow_blur: 4,
                    border_radius: 8,
                    letter_spacing: 0.5
                  })}
                  className="px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded text-xs font-medium transition-colors"
                >
                  TikTok
                </button>
                <button
                  onClick={() => handleStyleUpdate({
                    fontFamily: 'Helvetica',
                    fontSize: 18,
                    color: '#FFFFFF',
                    backgroundColor: '#000000DD',
                    bold: false,
                    alignment: 'Center',
                    position: 'Bottom',
                    animation_type: 'fade',
                    animation_duration: 0.4,
                    shadow_color: 'transparent',
                    border_radius: 12,
                    letter_spacing: 0
                  })}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded text-xs font-medium transition-colors"
                >
                  Instagram
                </button>
                <button
                  onClick={() => handleStyleUpdate({
                    fontFamily: 'Arial',
                    fontSize: 24,
                    color: '#FFFFFF',
                    backgroundColor: '#000000CC',
                    bold: true,
                    alignment: 'center',
                    position: 'Bottom',
                    animation_type: 'fade',
                    animation_duration: 0.2,
                    highlight_enabled: true,
                    highlight_color: '#FFFF00',
                    highlight_background: 'transparent',
                    highlight_underline: true,
                    highlight_bold: true,
                    highlight_scale: 1.2
                  })}
                  className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-medium transition-colors text-black"
                >
                  YouTube Highlight
                </button>
              </div>
            </div>

            {/* Font Controls */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={currentStyle.fontFamily}
                  onChange={(e) => handleStyleUpdate({ fontFamily: e.target.value })}
                  className="px-2 py-1 bg-slate-700 rounded text-xs"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Inter">Inter</option>
                </select>
                <input
                  type="number"
                  value={currentStyle.fontSize}
                  onChange={(e) => handleStyleUpdate({ fontSize: parseInt(e.target.value) })}
                  className="px-2 py-1 bg-slate-700 rounded text-xs"
                  min="8"
                  max="72"
                />
              </div>

              {/* Text Formatting */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleStyleUpdate({ bold: !currentStyle.bold })}
                  className={`px-2 py-1 text-xs rounded font-bold ${currentStyle.bold ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  B
                </button>
                <button
                  onClick={() => handleStyleUpdate({ italic: !currentStyle.italic })}
                  className={`px-2 py-1 text-xs rounded italic ${currentStyle.italic ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  I
                </button>
                <button
                  onClick={() => handleStyleUpdate({ underline: !currentStyle.underline })}
                  className={`px-2 py-1 text-xs rounded underline ${currentStyle.underline ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  U
                </button>
              </div>
            </div>

            {/* Color Controls */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400">Text</label>
                <input
                  type="color"
                  value={currentStyle.color}
                  onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                  className="w-full h-8 bg-slate-700 rounded border-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Background</label>
                <input
                  type="color"
                  value={currentStyle.backgroundColor.replace('CC', '')}
                  onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value + 'CC' })}
                  className="w-full h-8 bg-slate-700 rounded border-none"
                />
              </div>
            </div>

            {/* Animation Controls */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Animation</label>
              <select
                value={currentStyle.animation_type || 'none'}
                onChange={(e) => handleStyleUpdate({ animation_type: e.target.value === 'none' ? null : e.target.value })}
                className="w-full px-2 py-1 bg-slate-700 rounded text-xs"
              >
                <option value="none">No Animation</option>
                <option value="fade">Fade In</option>
                <option value="slide">Slide Up</option>
                <option value="bounce">Bounce In</option>
                <option value="typewriter">Typewriter</option>
                <option value="zoom">Zoom In</option>
              </select>

              {currentStyle.animation_type && (
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-slate-400">Duration:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={currentStyle.animation_duration || 0.3}
                    onChange={(e) => handleStyleUpdate({ animation_duration: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-slate-400 w-8">{(currentStyle.animation_duration || 0.3).toFixed(1)}s</span>
                </div>
              )}
            </div>

            {/* Alignment */}
            <div>
              <label className="text-xs text-slate-400">Alignment</label>
              <div className="flex gap-1 mt-1">
                {['Left', 'Center', 'Right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => handleStyleUpdate({ alignment: align })}
                    className={`px-2 py-1 text-xs rounded capitalize ${currentStyle.alignment === align ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="text-xs text-slate-400">Position</label>
              <select
                value={currentStyle.position}
                onChange={(e) => handleStyleUpdate({ position: e.target.value })}
                className="w-full px-2 py-1 bg-slate-700 rounded text-xs mt-1"
              >
                <option value="Bottom">Bottom</option>
                <option value="Top">Top</option>
                <option value="Middle">Middle</option>
              </select>
            </div>

            {/* Effects */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Effects</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Shadow Blur</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={currentStyle.shadow_blur || 0}
                    onChange={(e) => handleStyleUpdate({ shadow_blur: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Border Radius</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={currentStyle.border_radius || 0}
                    onChange={(e) => handleStyleUpdate({ border_radius: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Word Highlighting</label>
                <button
                  onClick={() => handleStyleUpdate({ highlight_enabled: !currentStyle.highlight_enabled })}
                  className={`px-2 py-1 text-xs rounded ${currentStyle.highlight_enabled ? 'bg-yellow-600' : 'bg-slate-700'}`}
                >
                  {currentStyle.highlight_enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {currentStyle.highlight_enabled && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500">Highlight Color</label>
                      <input
                        type="color"
                        value={currentStyle.highlight_color}
                        onChange={(e) => handleStyleUpdate({ highlight_color: e.target.value })}
                        className="w-full h-6 bg-slate-700 rounded border-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Background</label>
                      <input
                        type="color"
                        value={currentStyle.highlight_background?.replace('80', '') || '#FF0000'}
                        onChange={(e) => handleStyleUpdate({ highlight_background: e.target.value + '80' })}
                        className="w-full h-6 bg-slate-700 rounded border-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStyleUpdate({ highlight_underline: !currentStyle.highlight_underline })}
                      className={`px-2 py-1 text-xs rounded underline ${currentStyle.highlight_underline ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                      Underline
                    </button>
                    <button
                      onClick={() => handleStyleUpdate({ highlight_bold: !currentStyle.highlight_bold })}
                      className={`px-2 py-1 text-xs rounded font-bold ${currentStyle.highlight_bold ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                      Bold
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative mt-3">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search captions..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Caption List */}
      <div className="flex-1 overflow-y-auto">
        {displayCaptions.filter((caption) => {
          if (!searchTerm) return true;
          return caption.text.toLowerCase().includes(searchTerm.toLowerCase());
        }).map((caption, index) => {
          const isSelected = selectedCaptions.has(caption.id);
          const isActive = currentTime >= caption.start_ms && currentTime <= caption.end_ms;

          return (
            <CaptionListItem
              key={caption.id}
              caption={caption}
              ref={(node) => {
                if (node) { captionListRefs.current.set(caption.id, node); }
                else { captionListRefs.current.delete(caption.id); }
              }}
              index={index}
              isSelected={isSelected}
              isActive={isActive}
              onSelect={onCaptionSelect}
              onTimeChange={onTimeChange}
              onTextChange={onTextChange}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CaptionSidebar;