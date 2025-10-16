import React, { useState, useEffect, useRef } from 'react';
import { Caption, WordTiming } from '../types';

interface VideoOverlayProps {
  currentTime: number;
  fps: number;
  activeCaption?: Caption | null;
  formatDisplayTime: (ms: number) => string;
}

const VideoOverlay: React.FC<VideoOverlayProps> = ({
  currentTime,
  fps,
  activeCaption,
  formatDisplayTime
}) => {
  const [animationKey, setAnimationKey] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const previousCaptionId = useRef<string | null>(null);
  const typewriterInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeCaption && activeCaption.id !== previousCaptionId.current) {
      setAnimationKey(prev => prev + 1);
      previousCaptionId.current = activeCaption.id;
      setCurrentWordIndex(-1);
      
      // Handle typewriter effect
      if (activeCaption.style.animation_type === 'typewriter') {
        setDisplayText('');
        let currentIndex = 0;
        const text = activeCaption.text;
        
        if (typewriterInterval.current) {
          clearInterval(typewriterInterval.current);
        }
        
        typewriterInterval.current = setInterval(() => {
          if (currentIndex <= text.length) {
            setDisplayText(text.slice(0, currentIndex));
            currentIndex++;
          } else {
            if (typewriterInterval.current) {
              clearInterval(typewriterInterval.current);
            }
          }
        }, (activeCaption.style.animation_duration || 0.8) * 1000 / text.length);
      } else {
        setDisplayText(activeCaption.text);
      }
    } else if (!activeCaption) {
      setDisplayText('');
      setCurrentWordIndex(-1);
      if (typewriterInterval.current) {
        clearInterval(typewriterInterval.current);
      }
    }

    return () => {
      if (typewriterInterval.current) {
        clearInterval(typewriterInterval.current);
      }
    };
  }, [activeCaption]);

  // Update current word highlighting based on time
  useEffect(() => {
    if (activeCaption?.word_timings && activeCaption.style.highlight_enabled) {
      const currentWordIdx = activeCaption.word_timings.findIndex(
        word => currentTime >= word.start_ms && currentTime <= word.end_ms
      );
      setCurrentWordIndex(currentWordIdx);
    }
  }, [currentTime, activeCaption]);

  const getCaptionStyles = (caption: Caption) => {
    const style = caption.style;
    
    // Position classes
    let positionClasses = '';
    switch (style.position) {
      case 'Top':
        positionClasses = 'top-20';
        break;
      case 'Middle':
        positionClasses = 'top-1/2 transform -translate-y-1/2';
        break;
      case 'Bottom':
      default:
        positionClasses = 'bottom-20';
        break;
    }
    
    // Alignment classes
    let alignmentClasses = '';
    switch (style.alignment || 'Center') {
      case 'Left':
        alignmentClasses = 'text-left';
        break;
      case 'Right':
        alignmentClasses = 'text-right';
        break;
      case 'Center':
      default:
        alignmentClasses = 'text-center';
        break;
    }

    // Animation classes
    let animationClasses = '';
    const duration = (style.animation_duration || 0.3) * 1000;
    
    switch (style.animation_type) {
      case 'fade':
        animationClasses = 'animate-fade-in';
        break;
      case 'slide':
        animationClasses = 'animate-slide-up';
        break;
      case 'bounce':
        animationClasses = 'animate-bounce-in';
        break;
      case 'zoom':
        animationClasses = 'animate-zoom-in';
        break;
      default:
        animationClasses = 'animate-fade-in';
    }
    
    // Build inline styles
    const inlineStyles = {
      fontSize: `${style.font_size}px`,
      color: style.color,
      backgroundColor: style.background,
      fontFamily: style.font_family,
      fontWeight: style.bold ? 'bold' : 'normal',
      fontStyle: style.italic ? 'italic' : 'normal',
      textDecoration: style.underline ? 'underline' : 'none',
      letterSpacing: `${style.letter_spacing || 0}px`,
      borderRadius: `${style.border_radius || 0}px`,
      textShadow: style.shadow_color && style.shadow_blur ? 
        `0 0 ${style.shadow_blur}px ${style.shadow_color}` : 
        '2px 2px 4px rgba(0,0,0,0.8)',
      WebkitTextStroke: style.outline_color && style.outline_width ? 
        `${style.outline_width}px ${style.outline_color}` : undefined,
      animationDuration: `${duration}ms`,
      animationFillMode: 'both',
      animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
    };
    
    return {
      containerClasses: `absolute left-1/2 transform -translate-x-1/2 max-w-4xl px-4 ${positionClasses}`,
      textClasses: `leading-relaxed px-6 py-3 ${alignmentClasses} ${animationClasses}`,
      inlineStyles
    };
  };

  const renderHighlightedText = (caption: Caption) => {
    const style = caption.style;
    
    if (!style.highlight_enabled || !caption.word_timings) {
      // Regular text rendering
      return activeCaption.style.animation_type === 'typewriter' ? displayText : caption.text;
    }

    // Word-by-word highlighting
    return caption.word_timings.map((word, index) => {
      const isHighlighted = index === currentWordIndex;
      const wordStyle = {
        color: isHighlighted ? style.highlight_color : style.color,
        backgroundColor: isHighlighted ? style.highlight_background : 'transparent',
        fontWeight: (isHighlighted && style.highlight_bold) ? 'bold' : style.bold ? 'bold' : 'normal',
        textDecoration: (isHighlighted && style.highlight_underline) ? 'underline' : style.underline ? 'underline' : 'none',
        transform: isHighlighted ? `scale(${style.highlight_scale || 1.1})` : 'scale(1)',
        transition: 'all 0.1s ease-in-out',
        display: 'inline-block',
        marginRight: '0.25em'
      };

      return (
        <span
          key={`${caption.id}-word-${index}`}
          style={wordStyle}
          className={isHighlighted ? 'animate-pulse' : ''}
        >
          {word.word}
        </span>
      );
    });
  };

  return (
    <>
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-md font-mono text-base">
        {formatDisplayTime(currentTime)}
      </div>
      <div className="absolute top-4 right-4 bg-black/70 p-2 rounded">
        FPS: {fps}
      </div>
      {activeCaption && (
        <div 
          key={animationKey}
          className={getCaptionStyles(activeCaption).containerClasses}
        >
          <div 
            className={getCaptionStyles(activeCaption).textClasses}
            style={getCaptionStyles(activeCaption).inlineStyles}
          >
            {renderHighlightedText(activeCaption)}
            {activeCaption.style.animation_type === 'typewriter' && displayText.length < activeCaption.text.length && (
              <span className="animate-pulse">|</span>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VideoOverlay;