import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { WaveformProcessor } from '../pkg/captioneditor.js';
import { WaveformStatus } from '../types';

export const useAudioProcessing = () => {
  const [waveformStatus, setWaveformStatus] = useState<WaveformStatus>('idle');
  const [rawWaveformData, setRawWaveformData] = useState<number[]>([]);
  const [audioForTranscription, setAudioForTranscription] = useState<Float32Array | null>(null);
  const waveformProcessorRef = useRef<any>(null);
  const ffmpegRef = useRef(new FFmpeg());
  const ffmpegLoadedRef = useRef(false);

  const parseWavFile = (wavData: Uint8Array): Float32Array => {
    const dataView = new DataView(wavData.buffer);

    // Find the "data" chunk
    let offset = 12; // Skip "RIFF" header
    while (offset < wavData.length) {
      const chunkId = String.fromCharCode(
        wavData[offset],
        wavData[offset + 1],
        wavData[offset + 2],
        wavData[offset + 3]
      );
      const chunkSize = dataView.getUint32(offset + 4, true);

      if (chunkId === 'data') {
        // Found the data chunk
        const dataStart = offset + 8;
        const sampleCount = chunkSize / 4; // 4 bytes per float32
        const pcmData = new Float32Array(sampleCount);

        for (let i = 0; i < sampleCount; i++) {
          pcmData[i] = dataView.getFloat32(dataStart + i * 4, true);
        }

        return pcmData;
      }

      // Move to next chunk
      offset += 8 + chunkSize;
    }

    throw new Error('No data chunk found in WAV file');
  };

  const loadFFmpeg = async () => {
    if (ffmpegLoadedRef.current) return;

    const ffmpeg = ffmpegRef.current;
    console.log('Loading FFmpeg for audio processing...');
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    });

    ffmpegLoadedRef.current = true;
  };

  const extractAudioWithFFmpeg = async (videoFile: File) => {
    await loadFFmpeg();
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.video', await fetchFile(videoFile));

    console.log('Extracting audio with FFmpeg...');
    await ffmpeg.exec([
      '-i', 'input.video',
      '-vn', // No video
      '-acodec', 'pcm_f32le', // 32-bit float PCM
      '-ar', '48000', // Sample rate for waveform
      '-ac', '1', // Mono
      'waveform_audio.wav'
    ]);

    // Extract audio for Whisper (16kHz mono)
    await ffmpeg.exec([
      '-i', 'input.video',
      '-vn',
      '-acodec', 'pcm_f32le',
      '-ar', '16000', // Whisper's expected sample rate
      '-ac', '1',
      'whisper_audio.wav'
    ]);
    const waveformAudioData = await ffmpeg.readFile('waveform_audio.wav') as Uint8Array;
    const whisperAudioData = await ffmpeg.readFile('whisper_audio.wav') as Uint8Array;

    await ffmpeg.deleteFile('input.video');
    await ffmpeg.deleteFile('waveform_audio.wav');
    await ffmpeg.deleteFile('whisper_audio.wav');

    return {
      waveformData: parseWavFile(waveformAudioData),
      whisperData: parseWavFile(whisperAudioData),
      sampleRate: 48000
    };
  };

  const processAudioDirect = async (videoFile: File) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await videoFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const rawAudioData = audioBuffer.getChannelData(0);

    // Process for Whisper (resample to 16kHz)
    const targetSampleRate = 16000;
    const offlineContext = new OfflineAudioContext(
      1,
      audioBuffer.duration * targetSampleRate,
      targetSampleRate
    );
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    const resampledAudioBuffer = await offlineContext.startRendering();
    const whisperData = resampledAudioBuffer.getChannelData(0);

    return {
      waveformData: rawAudioData,
      whisperData: whisperData,
      sampleRate: audioBuffer.sampleRate
    };
  };

  const processAudioForWaveform = async (videoFile: File, isWasmLoaded: boolean) => {
    if (!isWasmLoaded) {
      console.error("Caption editor WASM not loaded yet.");
      return;
    }

    try {
      setWaveformStatus('loading');
      setRawWaveformData([]);
      setAudioForTranscription(null);

      let audioData;

      try {
        console.log("Attempting direct audio decode...");
        audioData = await processAudioDirect(videoFile);
        console.log("Direct decode successful!");
      } catch (directError) {
        console.log("Direct decode failed, using FFmpeg...", directError);
        audioData = await extractAudioWithFFmpeg(videoFile);
        console.log("FFmpeg extraction successful!");
      }

      if (!waveformProcessorRef.current) {
        waveformProcessorRef.current = new WaveformProcessor(audioData.sampleRate);
      }

      waveformProcessorRef.current.process_audio_buffer(audioData.waveformData);
      const processedData = waveformProcessorRef.current.get_waveform_data();
      setRawWaveformData(processedData);

      setAudioForTranscription(audioData.whisperData);

      setWaveformStatus('success');
      console.log("Audio processing completed successfully");

    } catch (error) {
      console.error("Error processing audio:", error);
      setWaveformStatus('error');
    }
  };

  return {
    waveformStatus,
    rawWaveformData,
    audioForTranscription,
    processAudioForWaveform
  };
};