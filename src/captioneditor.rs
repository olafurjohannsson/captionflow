use crate::structs::{Caption, CaptionStyle, Position};
use log::{Level, info};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::prelude::*;
use web_sys::{AudioContext, HtmlVideoElement, console};

#[wasm_bindgen]
pub struct CaptionEditor {
    captions: Vec<Caption>,
    selected_indices: Vec<usize>,
    caption_id_nonce: u32,
    history: VecDeque<Vec<Caption>>,
    history_index: usize,
    waveform_data: Vec<f32>,
    video_duration_ms: i32,
    playback_rate: f32,
    auto_save_enabled: bool,
}

#[wasm_bindgen]
impl CaptionEditor {
    #[wasm_bindgen]
    pub fn create_caption(&mut self, start_ms: i32) -> String {
        let id = format!("caption_{}", self.caption_id_nonce);
        self.caption_id_nonce += 1;

        let new_caption = Caption {
            id: id.clone(),
            start_ms,
            end_ms: start_ms, // Correctly starts with zero duration, JS will extend it
            text: String::from(""), // Starts with empty text, JS will fill it
            confidence: 1.0,  // A user-created caption has 100% confidence
            speaker: None,
            style: Self::default_style(), // Use the visible default style
        };

        self.captions.push(new_caption);

        // Use the safe, correct history pattern
        self.record_history_snapshot();

        info!("Live caption created with ID: '{}'", id);
        id // Return the unique ID to JavaScript
    }

    // Updates the text of an existing caption
    #[wasm_bindgen]
    pub fn update_caption_text(&mut self, id: &str, new_text: &str) {
        info!("Updating text for caption '{}' to: \"{}\"", id, new_text); // <-- LOG

        if let Some(caption) = self.captions.iter_mut().find(|c| c.id == id) {
            caption.text = new_text.to_string();
            self.record_history_snapshot(); // Save after mutation
        } else {
            log::warn!(
                "update_caption_text failed: could not find caption with ID '{}'",
                id
            ); // <-- LOG
        }
    }

    // Updates the timing of an existing caption
    #[wasm_bindgen]
    pub fn update_caption_timing(&mut self, id: &str, start_ms: i32, end_ms: i32) {
        // This log can be very noisy, so let's use the `debug!` level.
        // You can change the level in `init_with_level` to `Level::Debug` to see these.
        log::debug!(
            "Updating timing for caption '{}' to [{}, {}]",
            id,
            start_ms,
            end_ms
        ); // <-- LOG

        if let Some(caption) = self.captions.iter_mut().find(|c| c.id == id) {
            caption.start_ms = start_ms;
            caption.end_ms = end_ms;
            self.record_history_snapshot(); // Save after mutation
        } else {
            log::warn!(
                "update_caption_timing failed: could not find caption with ID '{}'",
                id
            ); // <-- LOG
        }
    }
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console::log_1(&"Initializing Caption Editor in Rust/WASM".into());

        // Create an initial empty state and add it to history
        let initial_captions = Vec::new();
        let mut history = VecDeque::with_capacity(100);
        history.push_back(initial_captions.clone());

        CaptionEditor {
            captions: initial_captions,
            selected_indices: Vec::new(),
            history,
            caption_id_nonce: 0,
            history_index: 0,
            waveform_data: Vec::new(),
            video_duration_ms: 0,
            playback_rate: 1.0,
            auto_save_enabled: true,
        }
    }
    #[wasm_bindgen]
    pub fn add_caption(&mut self, start_ms: i32, end_ms: i32, text: &str) {
        let new_caption = Caption {
            id: format!("caption_{}", self.caption_id_nonce),
            start_ms,
            end_ms,
            text: text.to_string(),
            speaker: None,
            confidence: 1.0,
            style: Self::default_style(),
        };
        self.caption_id_nonce += 1;
        self.captions.push(new_caption);
        self.captions.sort_by_key(|c| c.start_ms);
        self.record_history_snapshot();
    }

    #[wasm_bindgen]
    pub fn update_caption_style(&mut self, id: &str, style: JsValue) -> Result<(), JsValue> {
        
        let new_style: CaptionStyle = serde_wasm_bindgen::from_value(style)?;
        if let Some(caption) = self.captions.iter_mut().find(|c| c.id == id) {
            caption.style = new_style;
            self.record_history_snapshot();
        }
        Ok(())
    }

    #[wasm_bindgen]
    pub fn update_global_style(&mut self, style: JsValue) -> Result<(), JsValue> {
        let new_style: CaptionStyle = serde_wasm_bindgen::from_value(style)?;
        for caption in &mut self.captions {
            caption.style = new_style.clone();
        }
        self.record_history_snapshot();
        Ok(())
    }

    fn record_history_snapshot(&mut self) {
        if self.history_index < self.history.len() - 1 {
            self.history.truncate(self.history_index + 1);
        }

        self.history.push_back(self.captions.clone());
        self.history_index += 1;

        if self.history.len() > 100 {
            self.history.pop_front();
            self.history_index = self.history.len() - 1;
        }
    }
    #[wasm_bindgen]
    pub fn delete_captions(&mut self, ids: JsValue) -> Result<(), JsValue> {
        let ids_to_delete: Vec<String> = serde_wasm_bindgen::from_value(ids)?;
        self.save_history();

        self.captions.retain(|c| !ids_to_delete.contains(&c.id));

        Ok(())
    }
    #[wasm_bindgen]
    pub fn import_captions(&mut self, format: &str, content: &str) -> Result<(), JsValue> {
        self.save_history();

        match format {
            "srt" => self.parse_srt(content)?,
            "vtt" => self.parse_vtt(content)?,
            "ass" => self.parse_ass(content)?,
            "json" => self.parse_json(content)?,
            "opus" => self.parse_opus_export(content)?,
            _ => return Err(JsValue::from_str("Unsupported format")),
        }

        self.analyze_reading_speed();
        self.detect_conflicts();
        Ok(())
    }

    #[wasm_bindgen]
    pub fn split_caption(&mut self, caption_id: &str, split_time_ms: i32) -> Result<(), JsValue> {
        self.save_history();

        if let Some(index) = self.captions.iter().position(|c| c.id == caption_id) {
            let original = self.captions[index].clone();

            if split_time_ms <= original.start_ms || split_time_ms >= original.end_ms {
                return Err(JsValue::from_str(
                    "Split time must be within caption duration",
                ));
            }

            let ratio = (split_time_ms - original.start_ms) as f32
                / (original.end_ms - original.start_ms) as f32;
            let words: Vec<&str> = original.text.split_whitespace().collect();
            let split_index = (words.len() as f32 * ratio) as usize;

            let first_text = words[..split_index].join(" ");
            let second_text = words[split_index..].join(" ");

            let mut first = original.clone();
            first.end_ms = split_time_ms;
            first.text = first_text;

            let mut second = original.clone();
            second.id = format!("{}_split", original.id);
            second.start_ms = split_time_ms;
            second.text = second_text;

            self.captions[index] = first;
            self.captions.insert(index + 1, second);
        }

        Ok(())
    }

    #[wasm_bindgen]
    pub fn merge_selected(&mut self) -> Result<(), JsValue> {
        if self.selected_indices.len() < 2 {
            return Err(JsValue::from_str("Select at least 2 captions to merge"));
        }

        self.save_history();
        self.selected_indices.sort();

        let first_idx = self.selected_indices[0];
        let last_idx = self.selected_indices[self.selected_indices.len() - 1];

        let merged_text = self
            .selected_indices
            .iter()
            .map(|&i| self.captions[i].text.clone())
            .collect::<Vec<String>>()
            .join(" ");

        self.captions[first_idx].text = merged_text;
        self.captions[first_idx].end_ms = self.captions[last_idx].end_ms;

        for &idx in self.selected_indices[1..].iter().rev() {
            self.captions.remove(idx);
        }

        self.selected_indices.clear();
        Ok(())
    }

    #[wasm_bindgen]
    pub fn shift_all_captions(&mut self, shift_ms: i32) {
        self.save_history();
        for caption in &mut self.captions {
            caption.start_ms += shift_ms;
            caption.end_ms += shift_ms;
        }
    }

    #[wasm_bindgen]
    pub fn stretch_captions(&mut self, factor: f32) {
        self.save_history();
        for caption in &mut self.captions {
            caption.start_ms = (caption.start_ms as f32 * factor) as i32;
            caption.end_ms = (caption.end_ms as f32 * factor) as i32;
        }
    }
    #[wasm_bindgen]
    pub fn analyze_reading_speed(&self) -> String {
        let mut warnings = Vec::new();

        for (i, caption) in self.captions.iter().enumerate() {
            let duration_seconds = (caption.end_ms - caption.start_ms) as f32 / 1000.0;
            let char_count = caption.text.chars().count() as f32;
            let cps = char_count / duration_seconds;

            if cps > 20.0 {
                warnings.push(format!("Caption {} too fast: {:.1} chars/sec", i + 1, cps));
            } else if cps < 5.0 && char_count > 10.0 {
                warnings.push(format!("Caption {} too slow: {:.1} chars/sec", i + 1, cps));
            }
        }
        serde_json::to_string(&warnings).unwrap_or_default()
    }
    fn detect_conflicts(&self) -> Vec<(usize, usize)> {
        let mut conflicts = Vec::new();

        for i in 0..self.captions.len() {
            for j in i + 1..self.captions.len() {
                if self.captions[i].end_ms > self.captions[j].start_ms
                    && self.captions[i].start_ms < self.captions[j].end_ms
                {
                    conflicts.push((i, j));
                }
            }
        }

        conflicts
    }

    #[wasm_bindgen]
    pub fn export_captions(&self, format: &str) -> String {
        match format {
            "srt" => self.to_srt(),
            "vtt" => self.to_vtt(),
            "ass" => self.to_ass(),
            "json" => self.to_json(),
            "fcpxml" => self.to_fcpxml(),
            "edl" => self.to_edl(),
            _ => String::from("Unsupported format"),
        }
    }

    #[wasm_bindgen]
    pub fn undo(&mut self) -> bool {
        if self.history_index > 0 {
            self.history_index -= 1;
            self.captions = self.history[self.history_index].clone();
            true
        } else {
            false
        }
    }

    #[wasm_bindgen]
    pub fn redo(&mut self) -> bool {
        if self.history_index < self.history.len() - 1 {
            self.history_index += 1;
            self.captions = self.history[self.history_index].clone();
            true
        } else {
            false
        }
    }

    fn save_history(&mut self) {
        if self.history_index < self.history.len() - 1 {
            self.history.truncate(self.history_index + 1);
        }

        self.history.push_back(self.captions.clone());
        self.history_index += 1;

        // Keep the history buffer from growing too large
        if self.history.len() > 100 {
            self.history.pop_front();
            // Since we removed an item from the front, our index must shift down
            self.history_index -= 1;
        }
    }

    fn find_nearest_audio_peak(&self, time_ms: i32, threshold: f32) -> Option<i32> {
        let sample_index = (time_ms as f32 / self.video_duration_ms as f32
            * self.waveform_data.len() as f32) as usize;

        let search_range = 50; // Search within 50 samples
        let start = sample_index.saturating_sub(search_range);
        let end = (sample_index + search_range).min(self.waveform_data.len());

        let mut best_peak = None;
        let mut best_value = threshold;

        for i in start..end {
            if self.waveform_data[i] > best_value {
                best_value = self.waveform_data[i];
                best_peak = Some(
                    (i as f32 / self.waveform_data.len() as f32 * self.video_duration_ms as f32)
                        as i32,
                );
            }
        }

        best_peak
    }

    fn find_nearest_silence(&self, time_ms: i32, threshold: f32) -> Option<i32> {
        let sample_index = (time_ms as f32 / self.video_duration_ms as f32
            * self.waveform_data.len() as f32) as usize;

        let search_range = 50;
        let start = sample_index.saturating_sub(search_range);
        let end = (sample_index + search_range).min(self.waveform_data.len());

        for i in start..end {
            if self.waveform_data[i] < threshold {
                return Some(
                    (i as f32 / self.waveform_data.len() as f32 * self.video_duration_ms as f32)
                        as i32,
                );
            }
        }

        None
    }

    // Format parsers
    fn parse_srt(&mut self, content: &str) -> Result<(), JsValue> {
        // Clear out any old captions before importing.
        self.captions.clear();
        self.caption_id_nonce = 0; // Use the correct struct field `caption_id_nonce`

        // SRT files use a blank line to separate caption blocks.
        for block in content.trim().split("\n\n") {
            // Skip any empty blocks that might result from extra newlines.
            if block.is_empty() {
                continue;
            }

            let lines: Vec<&str> = block.trim().lines().collect();

            // A valid SRT block has at least 3 lines: index, times, and text.
            if lines.len() >= 2 {
                // We don't strictly need the index line.
                let timestamp_line = lines.get(1).unwrap_or(&""); // Safely get the timestamp line
                let parts: Vec<&str> = timestamp_line.split(" --> ").collect();

                if parts.len() == 2 {
                    // We use `?` to propagate any errors from the timestamp parser.
                    let start_ms = Self::parse_srt_timestamp(parts[0])?;
                    let end_ms = Self::parse_srt_timestamp(parts[1])?;

                    // The rest of the lines are the caption text.
                    let text = lines[2..].join("\n");

                    // We can now create and add the new caption.
                    let new_caption = Caption {
                        id: format!("caption_{}", self.caption_id_nonce),
                        start_ms,
                        end_ms,
                        text,
                        speaker: None,
                        confidence: 1.0, // Imported captions are considered confident.
                        style: Self::default_style(),
                    };
                    self.caption_id_nonce += 1;
                    self.captions.push(new_caption);
                }
            }
        }

        // It's good practice to sort by start time after a full import.
        self.captions.sort_by_key(|c| c.start_ms);

        Ok(())
    }

    // This is a robust helper function to parse the specific SRT timestamp format.
    // It also does not need `#[wasm_bindgen]`.
    fn parse_srt_timestamp(timestamp: &str) -> Result<i32, JsValue> {
        // SRT uses a comma for the millisecond separator.
        let trimmed = timestamp.trim().replace(',', ".");
        let parts: Vec<&str> = trimmed.split(':').collect();
        if parts.len() != 3 {
            return Err(JsValue::from_str(&format!(
                "Invalid timestamp format: {}",
                timestamp
            )));
        }

        let hours: i32 = parts[0]
            .parse()
            .map_err(|_| JsValue::from_str("Invalid hours"))?;
        let minutes: i32 = parts[1]
            .parse()
            .map_err(|_| JsValue::from_str("Invalid minutes"))?;

        let seconds_parts: Vec<&str> = parts[2].split('.').collect();
        let seconds: i32 = seconds_parts[0]
            .parse()
            .map_err(|_| JsValue::from_str("Invalid seconds"))?;
        let milliseconds: i32 = if seconds_parts.len() > 1 {
            // Pad with zeros if necessary (e.g., ".5" becomes ".500").
            let ms_str = seconds_parts[1];
            let padded_ms = format!("{:0<3}", ms_str);
            padded_ms[..3]
                .parse()
                .map_err(|_| JsValue::from_str("Invalid milliseconds"))?
        } else {
            0
        };

        Ok(hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds)
    }

    fn parse_vtt(&mut self, content: &str) -> Result<(), JsValue> {
        // Similar to SRT but with different timestamp format
        // Implementation here
        Ok(())
    }

    fn parse_ass(&mut self, content: &str) -> Result<(), JsValue> {
        // Parse Advanced SubStation Alpha format
        // Implementation here
        Ok(())
    }

    fn parse_json(&mut self, content: &str) -> Result<(), JsValue> {
        self.captions =
            serde_json::from_str(content).map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    fn parse_opus_export(&mut self, content: &str) -> Result<(), JsValue> {
        // Parse Opus Clip export format
        // Implementation here
        Ok(())
    }

    // Format exporters
    fn to_srt(&self) -> String {
        let mut output = String::new();

        for (i, caption) in self.captions.iter().enumerate() {
            output.push_str(&format!("{}\n", i + 1));
            output.push_str(&format!(
                "{} --> {}\n",
                Self::format_srt_timestamp(caption.start_ms),
                Self::format_srt_timestamp(caption.end_ms)
            ));
            output.push_str(&format!("{}\n\n", caption.text));
        }

        output
    }

    fn format_srt_timestamp(ms: i32) -> String {
        let hours = ms / 3600000;
        let minutes = (ms % 3600000) / 60000;
        let seconds = (ms % 60000) / 1000;
        let milliseconds = ms % 1000;

        format!(
            "{:02}:{:02}:{:02},{:03}",
            hours, minutes, seconds, milliseconds
        )
    }

    fn to_vtt(&self) -> String {
        let mut output = String::from("WEBVTT\n\n");

        for caption in &self.captions {
            output.push_str(&format!(
                "{} --> {}\n{}\n\n",
                Self::format_vtt_timestamp(caption.start_ms),
                Self::format_vtt_timestamp(caption.end_ms),
                caption.text
            ));
        }

        output
    }
    #[wasm_bindgen]
    pub fn auto_punctuate(&mut self) {
        self.save_history();

        for caption in &mut self.captions {
            let mut text = caption.text.clone();

            // Capitalize first letter
            if let Some(first_char) = text.chars().next() {
                if first_char.is_lowercase() {
                    text = format!(
                        "{}{}",
                        first_char.to_uppercase(),
                        &text[first_char.len_utf8()..]
                    );
                }
            }

            // Add period at end if missing
            if !text.ends_with('.') && !text.ends_with('?') && !text.ends_with('!') {
                text.push('.');
            }

            // Fix common punctuation issues
            text = text.replace(" ,", ",");
            text = text.replace(" .", ".");
            text = text.replace("  ", " ");

            caption.text = text;
        }
    }

    // Find and replace across all captions
    #[wasm_bindgen]
    pub fn find_replace(&mut self, find: &str, replace: &str, case_sensitive: bool) {
        self.save_history();

        for caption in &mut self.captions {
            if case_sensitive {
                caption.text = caption.text.replace(find, replace);
            } else {
                let lower_text = caption.text.to_lowercase();
                let lower_find = find.to_lowercase();
                let mut result = String::new();
                let mut last_end = 0;

                for (start, _) in lower_text.match_indices(&lower_find) {
                    result.push_str(&caption.text[last_end..start]);
                    result.push_str(replace);
                    last_end = start + find.len();
                }
                result.push_str(&caption.text[last_end..]);

                caption.text = result;
            }
        }
    }

    // Apply profanity filter
    #[wasm_bindgen]
    pub fn apply_profanity_filter(&mut self, bleep: bool) {
        self.save_history();

        let profanity_list = vec!["fuck", "shit", "damn", "hell", "ass"];

        for caption in &mut self.captions {
            for word in &profanity_list {
                let replacement = if bleep {
                    "[bleep]"
                } else {
                    &"*".repeat(word.len())
                };
                caption.text = caption.text.replace(word, &replacement);

                // Also handle capitalized versions
                let capitalized = format!(
                    "{}{}",
                    word.chars().next().unwrap().to_uppercase(),
                    &word[1..]
                );
                caption.text = caption.text.replace(&capitalized, &replacement);
            }
        }
    }
    fn format_vtt_timestamp(ms: i32) -> String {
        let hours = ms / 3600000;
        let minutes = (ms % 3600000) / 60000;
        let seconds = (ms % 60000) / 1000;
        let milliseconds = ms % 1000;

        format!(
            "{:02}:{:02}:{:02}.{:03}",
            hours, minutes, seconds, milliseconds
        )
    }

    fn to_ass(&self) -> String {
        // Export to Advanced SubStation Alpha format
        String::from("[Script Info]\n[V4+ Styles]\n[Events]\n")
    }

    fn to_json(&self) -> String {
        serde_json::to_string_pretty(&self.captions).unwrap_or_default()
    }

    fn to_fcpxml(&self) -> String {
        // Export to Final Cut Pro XML
        String::from(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<fcpxml version=\"1.9\">\n</fcpxml>",
        )
    }

    fn to_edl(&self) -> String {
        // Export to Edit Decision List
        String::from("TITLE: Caption EDL\nFCM: NON-DROP FRAME\n\n")
    }

    fn default_style() -> CaptionStyle {
        CaptionStyle {
            position: Position::Bottom,
            font_size: 16,
            color: String::from("#FFFFFF"),
            background: String::from("#000000CC"),
            font_family: String::from("Arial"),
            alignment: crate::structs::TextAlign::Center,
            bold: false,
            italic: false,
            outline_color: None,
            outline_width: 0,
            underline: false,
            shadow_color: None,
            shadow_offset_x: 0,
            shadow_offset_y: 0,
            animation_duration: 0.0,
            animation_type: None,
            shadow_blur: 0.0,
            border_radius: 0.0,
            letter_spacing: 0.0,
        }
    }
}
