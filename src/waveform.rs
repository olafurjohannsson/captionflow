use std::collections::VecDeque;
use wasm_bindgen::prelude::wasm_bindgen;
use crate::structs::{Caption, CaptionStyle, Position};
use wasm_bindgen::prelude::*;
use web_sys::{console, HtmlVideoElement, AudioContext};
use serde::{Deserialize, Serialize};

#[wasm_bindgen]
pub struct WaveformProcessor {
    sample_rate: f32,
    samples: Vec<f32>,
}

#[wasm_bindgen]
impl WaveformProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        WaveformProcessor {
            sample_rate,
            samples: Vec::new(),
        }
    }
    #[wasm_bindgen]
    pub fn get_waveform_data(&self) -> Vec<f32> {
        self.samples.clone()
    }
    #[wasm_bindgen]
    pub fn process_audio_buffer(&mut self, audio_data: &[f32]) {
        // Downsample for visualization
        let downsample_factor = 100;
        let mut downsampled = Vec::new();

        for chunk in audio_data.chunks(downsample_factor) {
            let avg = chunk.iter().sum::<f32>() / chunk.len() as f32;
            downsampled.push(avg.abs());
        }

        self.samples = downsampled;
    }

    #[wasm_bindgen]
    pub fn get_peaks(&self, threshold: f32) -> Vec<i32> {
        let mut peaks = Vec::new();

        for i in 1..self.samples.len() - 1 {
            if self.samples[i] > threshold &&
                self.samples[i] > self.samples[i - 1] &&
                self.samples[i] > self.samples[i + 1] {
                peaks.push(i as i32);
            }
        }

        peaks
    }
}