/* tslint:disable */
/* eslint-disable */
export function transform_handle_wheel(current_transform: TimelineTransform, duration_ms: number, timeline_width: number, mouse_x: number, delta_y: number): TimelineTransform;
export function transform_handle_pan_move(start_transform: TimelineTransform, timeline_width: number, start_mouse_x: number, current_mouse_x: number): TimelineTransform;
export function transform_get_time_from_click(current_transform: TimelineTransform, duration_ms: number, timeline_width: number, mouse_x: number): number;
export function setup_logging(): void;
export function resample_audio(audio_data: Float32Array, original_rate: number, target_rate: number): Float32Array;
export function initialize_caption_editor(): CaptionEditor;
export class CaptionEditor {
  free(): void;
  create_caption(start_ms: number): string;
  update_caption_text(id: string, new_text: string): void;
  update_caption_timing(id: string, start_ms: number, end_ms: number): void;
  constructor();
  add_caption(start_ms: number, end_ms: number, text: string): void;
  update_caption_style(id: string, style: any): void;
  update_global_style(style: any): void;
  delete_captions(ids: any): void;
  import_captions(format: string, content: string): void;
  split_caption(caption_id: string, split_time_ms: number): void;
  merge_selected(): void;
  shift_all_captions(shift_ms: number): void;
  stretch_captions(factor: number): void;
  analyze_reading_speed(): string;
  export_captions(format: string): string;
  undo(): boolean;
  redo(): boolean;
  auto_punctuate(): void;
  find_replace(find: string, replace: string, case_sensitive: boolean): void;
  apply_profanity_filter(bleep: boolean): void;
}
export class TimelineTransform {
  free(): void;
  constructor(scale: number, offset: number);
  scale: number;
  offset: number;
}
export class WaveformProcessor {
  free(): void;
  constructor(sample_rate: number);
  get_waveform_data(): Float32Array;
  process_audio_buffer(audio_data: Float32Array): void;
  get_peaks(threshold: number): Int32Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_captioneditor_free: (a: number, b: number) => void;
  readonly captioneditor_create_caption: (a: number, b: number) => [number, number];
  readonly captioneditor_update_caption_text: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly captioneditor_update_caption_timing: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly captioneditor_new: () => number;
  readonly captioneditor_add_caption: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly captioneditor_update_caption_style: (a: number, b: number, c: number, d: any) => [number, number];
  readonly captioneditor_update_global_style: (a: number, b: any) => [number, number];
  readonly captioneditor_delete_captions: (a: number, b: any) => [number, number];
  readonly captioneditor_import_captions: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly captioneditor_split_caption: (a: number, b: number, c: number, d: number) => [number, number];
  readonly captioneditor_merge_selected: (a: number) => [number, number];
  readonly captioneditor_shift_all_captions: (a: number, b: number) => void;
  readonly captioneditor_stretch_captions: (a: number, b: number) => void;
  readonly captioneditor_analyze_reading_speed: (a: number) => [number, number];
  readonly captioneditor_export_captions: (a: number, b: number, c: number) => [number, number];
  readonly captioneditor_undo: (a: number) => number;
  readonly captioneditor_redo: (a: number) => number;
  readonly captioneditor_auto_punctuate: (a: number) => void;
  readonly captioneditor_find_replace: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly captioneditor_apply_profanity_filter: (a: number, b: number) => void;
  readonly __wbg_waveformprocessor_free: (a: number, b: number) => void;
  readonly waveformprocessor_new: (a: number) => number;
  readonly waveformprocessor_get_waveform_data: (a: number) => [number, number];
  readonly waveformprocessor_process_audio_buffer: (a: number, b: number, c: number) => void;
  readonly waveformprocessor_get_peaks: (a: number, b: number) => [number, number];
  readonly __wbg_timelinetransform_free: (a: number, b: number) => void;
  readonly __wbg_get_timelinetransform_scale: (a: number) => number;
  readonly __wbg_set_timelinetransform_scale: (a: number, b: number) => void;
  readonly __wbg_get_timelinetransform_offset: (a: number) => number;
  readonly __wbg_set_timelinetransform_offset: (a: number, b: number) => void;
  readonly timelinetransform_new: (a: number, b: number) => number;
  readonly transform_handle_wheel: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly transform_handle_pan_move: (a: number, b: number, c: number, d: number) => number;
  readonly transform_get_time_from_click: (a: number, b: number, c: number, d: number) => number;
  readonly setup_logging: () => void;
  readonly resample_audio: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly initialize_caption_editor: () => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
