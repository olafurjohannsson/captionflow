export enum Position {
  Bottom = "Bottom",
  Top = "Top", 
  Middle = "Middle",
  Custom = "Custom"
}

export interface CaptionStyle {
  position: Position;
  font_size: number; 
  color: string;
  background: string;
  font_family: string; 
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  alignment?: 'Left' | 'Center' | 'Right';
  outline_color?: string;
  outline_width?: number;
  shadow_color?: string;
  shadow_offset_x?: number;
  shadow_offset_y?: number;
}

export interface WordTiming {
  word: string;
  start_ms: number;
  end_ms: number;
  confidence?: number;
}

export interface Caption {
  id: string;
  start_ms: number;
  end_ms: number;
  text: string;
  speaker?: string;
  confidence?: number;
  style: CaptionStyle;
  word_timings?: WordTiming[]; // Add this
}


export type WaveformStatus = 'idle' | 'loading' | 'success' | 'error';