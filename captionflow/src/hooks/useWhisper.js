import { useState, useEffect, useRef } from 'react';

export const useWhisper = () => {
    const [isReady, setIsReady] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const whisperRef = useRef({ module: null, instance: null, transcript: [] });

    useEffect(() => {
        const loadWhisper = async () => {
            try {
                if (document.getElementById('whisper-script')) return;

                // Load the script
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.id = 'whisper-script';
                    script.src = '/libmain.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });

                if (window.WhisperModule) {
                    const module = await window.WhisperModule({
                        print: (text) => {
                            if (text.includes('-->')) {
                                setTranscript(prev => prev ? `${prev}\n${text}` : text);
                            }
                        },
                        printErr: (text) => {
                            console.error('stderr:', text); 

                            if (text.includes('total time')) {
                                console.log("useWhisper: Detected 'total time' in stderr. Transcription is complete.");
                                setIsTranscribing(false);
                            }
                        },
                    });
                    whisperRef.current.module = module;
                    setIsReady(true);
                    console.log('Whisper module loaded and ready.');
                }
            } catch (error) {
                console.error("Error loading or initializing Whisper module:", error);
            }
        };

        if (!whisperRef.current.module) {
            loadWhisper();
        }
    }, []); 

    const loadModel = async (modelUrl) => {
        if (!isReady) {
            console.error('Module is not ready.');
            return;
        }

        console.log('Loading model...');
        const response = await fetch(modelUrl);
        const modelData = new Uint8Array(await response.arrayBuffer());
        console.log('Model data fetched, size:', modelData.length);

        const module = whisperRef.current.module;
        module.FS_createDataFile('/', 'ggml-tiny.en.bin', modelData, true, true);

        const instance = module.init('ggml-tiny.en.bin');
        if (instance) {
            whisperRef.current.instance = instance;
            console.log('Model loaded successfully.');
            return true;
        } else {
            console.error('Failed to initialize whisper context.');
            return false;
        }
    };


    const transcribe = (audioData, options) => {
        const { lang = 'en', n_threads = 4, translate = false } = options || {};

        if (!whisperRef.current.instance) {
            console.error('Model not loaded or instance not available.');
            return;
        }

        setTranscript(''); 
        setIsTranscribing(true); 
        const module = whisperRef.current.module;

        const ret = module.full_default(
            whisperRef.current.instance,
            audioData,
            lang,
            n_threads,
            translate
        );

        if (ret) {
            console.error('Transcription failed to start with code:', ret);
            setIsTranscribing(false); 
        }
    };

    return { isReady, isTranscribing, transcript, loadModel, transcribe };
};