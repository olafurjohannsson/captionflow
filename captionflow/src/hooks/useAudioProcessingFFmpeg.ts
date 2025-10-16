import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { WaveformProcessor } from '../pkg/captioneditor.js';
import { WaveformStatus } from '../types';

export const useAudioFFmpegProcessing = () => {
  const [waveformStatus, setWaveformStatus] = useState<WaveformStatus>('idle');
  const [rawWaveformData, setRawWaveformData] = useState<number[]>([]);
  const [audioForTranscription, setAudioForTranscription] = useState<Float32Array | null>(null);
  const waveformProcessorRef = useRef<any>(null);
  const ffmpegRef = useRef(new FFmpeg());

  const processAudioForWaveform = async (videoFile: File, isWasmLoaded: boolean) => {
    if (!isWasmLoaded) {
      console.error("Caption editor WASM not loaded yet.");
      return;
    }

    try {
      setWaveformStatus('loading');
      setRawWaveformData([]);
      setAudioForTranscription(null);

      const ffmpeg = ffmpegRef.current;

      if (!ffmpeg.loaded) {
        console.log('Loading FFmpeg for audio processing...');
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm';
        
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });
      }

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
        '-ar', '16000', 
        '-ac', '1',
        'whisper_audio.wav'
      ]);

      const waveformAudioData = await ffmpeg.readFile('waveform_audio.wav') as Uint8Array;
      const whisperAudioData = await ffmpeg.readFile('whisper_audio.wav') as Uint8Array;

      // Process waveform data
      await processWaveformData(waveformAudioData, 48000);
      
      // Process Whisper data
      await processWhisperData(whisperAudioData);

      // Cleanup FFmpeg files
      await ffmpeg.deleteFile('input.video');
      await ffmpeg.deleteFile('waveform_audio.wav');
      await ffmpeg.deleteFile('whisper_audio.wav');

      setWaveformStatus('success');
      console.log('Audio processing completed successfully with FFmpeg');

    } catch (error) {
      console.error('Error processing audio with FFmpeg:', error);
      
      console.log('Falling back to browser audio processing...');
      await fallbackAudioProcessing(videoFile);
    }
  };

  const processWaveformData = async (audioData: Uint8Array, sampleRate: number) => {
    const pcmData = parseWavFile(audioData);
    
    if (!waveformProcessorRef.current) {
      waveformProcessorRef.current = new WaveformProcessor(sampleRate);
    }

    waveformProcessorRef.current.process_audio_buffer(pcmData);
    const processedData = waveformProcessorRef.current.get_waveform_data();
    setRawWaveformData(processedData);
  };

  const processWhisperData = async (audioData: Uint8Array) => {
    // Parse WAV file for Whisper
    const pcmData = parseWavFile(audioData);
    setAudioForTranscription(pcmData);
  };

  const parseWavFile = (wavData: Uint8Array): Float32Array => {
    // Simple WAV parser for PCM_F32LE format
    const dataView = new DataView(wavData.buffer);
    
    // Skip WAV header (44 bytes) and read PCM data
    const headerSize = 44;
    const audioDataSize = wavData.length - headerSize;
    const sampleCount = audioDataSize / 4; // 4 bytes per float32 sample
    
    const pcmData = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      pcmData[i] = dataView.getFloat32(headerSize + i * 4, true); // little endian
    }
    
    return pcmData;
  };

  const fallbackAudioProcessing = async (videoFile: File) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await videoFile.arrayBuffer();
      
      try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const rawAudioData = audioBuffer.getChannelData(0);
        if (!waveformProcessorRef.current) {
          waveformProcessorRef.current = new WaveformProcessor(audioBuffer.sampleRate);
        }
        waveformProcessorRef.current.process_audio_buffer(rawAudioData);
        const processedData = waveformProcessorRef.current.get_waveform_data();
        setRawWaveformData(processedData);

        const targetSampleRate = 16000;
        const offlineContext = new OfflineAudioContext(1, audioBuffer.duration * targetSampleRate, targetSampleRate);
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start(0);

        const resampledAudioBuffer = await offlineContext.startRendering();
        const pcmDataForWhisper = resampledAudioBuffer.getChannelData(0);
        setAudioForTranscription(pcmDataForWhisper);
        
        setWaveformStatus('success');
        console.log('Fallback audio processing succeeded');
      } catch (decodeError) {
        console.error('Browser audio decoding failed:', decodeError);
        setWaveformStatus('error');
      }
    } catch (fallbackError) {
      console.error('Fallback audio processing failed:', fallbackError);
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