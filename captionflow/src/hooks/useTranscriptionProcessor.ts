import { useEffect, useRef } from 'react';

interface UseTranscriptionProcessorProps {
  transcript: string;
  duration: number;
  editorRef: React.RefObject<any>;
  onProgressUpdate: (progress: number) => void;
  onCaptionsUpdate: () => void;
}

export const useTranscriptionProcessor = ({
  transcript,
  duration,
  editorRef,
  onProgressUpdate,
  onCaptionsUpdate
}: UseTranscriptionProcessorProps) => {
  const processedLinesRef = useRef(0);

  useEffect(() => {
    if (!transcript || duration <= 0 || !editorRef.current) return;

    const allLines = transcript.split('\n').filter(line => line.includes('-->'));
    if (allLines.length === 0) return;

    // Update progress based on the latest timestamp
    const lastLine = allLines[allLines.length - 1];
    const match = lastLine.match(/--> (\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (match) {
      const endTimeString = match[1];
      const timeToMs = (t: string) => {
        const parts = t.split(/[:.]/);
        return (+parts[0] * 3600 + +parts[1] * 60 + +parts[2]) * 1000 + +parts[3];
      };
      const latestTimeMs = timeToMs(endTimeString);
      const progress = Math.min(100, (latestTimeMs / duration) * 100);
      onProgressUpdate(progress);
    }

    // Process new lines
    const newLines = allLines.slice(processedLinesRef.current);
    if (newLines.length === 0) return;

    console.log(`Processing ${newLines.length} new line(s)...`);
    
    for (const line of newLines) {
      const match = line.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\]\s*(.*)/);
      if (match) {
        const [, startTime, endTime, text] = match;
        const timeToMs = (t: string) => {
          const parts = t.split(/[:.]/);
          return (+parts[0] * 3600 + +parts[1] * 60 + +parts[2]) * 1000 + +parts[3];
        };
        const startMs = timeToMs(startTime);
        const endMs = timeToMs(endTime);
        editorRef.current.add_caption(startMs, endMs, text.trim());
      }
    }

    processedLinesRef.current = allLines.length;
    onCaptionsUpdate();
  }, [transcript, duration, editorRef, onProgressUpdate, onCaptionsUpdate]);

  const resetProcessor = () => {
    processedLinesRef.current = 0;
  };

  return { resetProcessor };
};