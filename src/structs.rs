use wasm_bindgen::prelude::*;
use web_sys::{console, HtmlVideoElement, AudioContext};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Caption {
    pub id: String,
    pub start_ms: i32,
    pub end_ms: i32,
    pub text: String,
    pub speaker: Option<String>,
    pub confidence: f32,
    pub style: CaptionStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptionStyle {
    pub position: Position,
    pub font_size: u32,
    pub color: String,
    pub background: String,
    pub font_family: String,

    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
    pub alignment: TextAlign, // Left, Center, Right
    pub outline_color: Option<String>,
    pub outline_width: u32,
    pub shadow_color: Option<String>,
    pub shadow_offset_x: i32,
    pub shadow_offset_y: i32,

    pub animation_type: Option<String>, // "fade", "slide", "bounce", "typewriter"
    pub animation_duration: f32, // in seconds
    pub shadow_blur: f32,
    pub border_radius: f32,
    pub letter_spacing: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Position {
    Bottom,
    Top,
    Middle,
    Custom(i32, i32),
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TextAlign {
    Left,
    Center,
    Right
}

