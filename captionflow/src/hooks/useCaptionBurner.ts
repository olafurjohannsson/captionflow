import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';


interface BurnerState {
  isBurning: boolean;
  progress: number;
  message: string;
}

interface UseCaptionBurner {
  burnerState: BurnerState;
  burnCaptions: (videoFile: File, srtData: string, duration: number) => Promise<void>;
}

export function useCaptionBurner(): UseCaptionBurner {
  const [burnerState, setBurnerState] = useState<BurnerState>({
    isBurning: false,
    progress: 0,
    message: '',
  });
  const ffmpegRef = useRef(new FFmpeg());

const burnCaptions = async (videoFile: File, srtData: string, duration: number) => {

    setBurnerState({ isBurning: true, progress: 0, message: 'Starting...' });

    const ffmpeg = ffmpegRef.current;

    if (!ffmpeg.loaded) {
        setBurnerState(prev => ({ ...prev, message: 'Loading FFmpeg Core...' }));
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm';

        await ffmpeg.load({
            coreURL:   await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
            wasmURL:   await toBlobURL(`${baseURL}/ffmpeg-core.wasm`,   'application/wasm'),
            workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });
   
    }

    ffmpeg.on('progress', ({ progress, time }) => {
        setBurnerState(prev => ({
            ...prev,
            progress: Math.round(progress * 100),
            message: `Processing: ${(time / 1000).toFixed(2)}s / ${(duration / 1000).toFixed(2)}s`
        }));
    });

    ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg log]', message);
    });

    setBurnerState(prev => ({ ...prev, progress: 0, message: 'Writing files to memory...' }));
    await ffmpeg.writeFile('captions.srt', srtData);
    await ffmpeg.writeFile(videoFile.name, await fetchFile(videoFile));

    await ffmpeg.writeFile('font.ttf', await fetchFile('/Roboto/static/Roboto-Regular.ttf'));

    setBurnerState(prev => ({ ...prev, message: 'Burning subtitles...' }));
    await ffmpeg.exec([
        '-i', videoFile.name,
        '-vf', `subtitles=captions.srt:fontfile=/font.ttf`,
        '-c:a', 'copy',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        'output.mp4'
    ]);


    setBurnerState(prev => ({ ...prev, progress: 100, message: 'Finishing up...' }));
    const data: Uint8Array = await ffmpeg.readFile('output.mp4') as Uint8Array;
    const url = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoFile.name.split('.')[0]}_captioned.mp4`;
    a.click();
    URL.revokeObjectURL(url);

    setBurnerState({ isBurning: false, progress: 0, message: '' });
  };

  return { burnerState, burnCaptions };
}