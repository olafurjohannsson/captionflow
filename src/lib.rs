use crate::captioneditor::CaptionEditor;
mod structs;
mod captioneditor;
mod waveform;

use std::collections::VecDeque;
use wasm_bindgen::prelude::wasm_bindgen;
use crate::structs::{Caption, CaptionStyle, Position};
use wasm_bindgen::prelude::*;
use web_sys::{console, HtmlVideoElement, AudioContext};
use serde::{Deserialize, Serialize};

use log::{info, Level};

#[wasm_bindgen]
#[derive(Clone, Copy)] 
pub struct TimelineTransform {
    pub scale: f64,
    pub offset: f64,
}

#[wasm_bindgen]
impl TimelineTransform {
    #[wasm_bindgen(constructor)]
    pub fn new(scale: f64, offset: f64) -> TimelineTransform {
        TimelineTransform { scale, offset }
    }
}

#[wasm_bindgen]
pub fn transform_handle_wheel(
    current_transform: TimelineTransform,
    duration_ms: f64,
    timeline_width: f64,
    mouse_x: f64,
    delta_y: f64
) -> TimelineTransform {
    let mouse_time_percent = (current_transform.offset + mouse_x) / (timeline_width * current_transform.scale);

    let zoom_factor = 1.2;
    let new_scale = if delta_y < 0.0 { current_transform.scale * zoom_factor } else { current_transform.scale / zoom_factor };
    let clamped_scale = new_scale.max(1.0);

    let new_offset = (mouse_time_percent * (timeline_width * clamped_scale)) - mouse_x;

    let world_width = timeline_width * clamped_scale;
    let max_offset = world_width - timeline_width;

    TimelineTransform {
        scale: clamped_scale,
        offset: new_offset.max(0.0).min(max_offset),
    }
}

#[wasm_bindgen]
pub fn transform_handle_pan_move(
    start_transform: TimelineTransform,
    timeline_width: f64,
    start_mouse_x: f64,
    current_mouse_x: f64
) -> TimelineTransform {
    let dx = current_mouse_x - start_mouse_x;
    let new_offset = start_transform.offset - dx;

    let world_width = timeline_width * start_transform.scale;
    let max_offset = world_width - timeline_width;

    TimelineTransform {
        scale: start_transform.scale,
        offset: new_offset.max(0.0).min(max_offset),
    }
}

#[wasm_bindgen]
pub fn transform_get_time_from_click(
    current_transform: TimelineTransform,
    duration_ms: f64,
    timeline_width: f64,
    mouse_x: f64
) -> f64 {
    let world_x = mouse_x + current_transform.offset;
    let world_percent = world_x / (timeline_width * current_transform.scale);
    let time_in_seconds = world_percent * (duration_ms / 1000.0);
    time_in_seconds
}

#[wasm_bindgen]
pub fn setup_logging() {
    let _ = console_log::init_with_level(Level::Info);

    console_error_panic_hook::set_once();

    info!("Rust logging and panic hook have been set up successfully.");
}

use rubato::{Resampler, SincFixedIn, SincInterpolationType, SincInterpolationParameters, WindowFunction};
#[wasm_bindgen]
pub fn resample_audio(audio_data: &[f32], original_rate: u32, target_rate: u32) -> Result<Vec<f32>, JsValue> {
    if original_rate == target_rate {
        return Ok(audio_data.to_vec());
    }

    let params = SincInterpolationParameters {
        sinc_len: 256,
        f_cutoff: 0.95,
        interpolation: SincInterpolationType::Linear,
        oversampling_factor: 256,
        window: WindowFunction::BlackmanHarris2,
    };

    let mut resampler = SincFixedIn::<f32>::new(
        target_rate as f64 / original_rate as f64,
        2.0, // Asynchronous resampling ratio
        params,
        audio_data.len(),
        1, // Number of channels
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    // The input must be a Vec of Vecs, one for each channel
    let waves_in = vec![audio_data.to_vec()];

    // Process the samples
    let waves_out = resampler.process(&waves_in, None)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    // Return the first (and only) channel
    Ok(waves_out.into_iter().next().unwrap_or_default())
}

#[wasm_bindgen]
pub fn initialize_caption_editor() -> CaptionEditor {
    console::log_1(&"Caption Editor initialized successfully!".into());
    CaptionEditor::new()
}