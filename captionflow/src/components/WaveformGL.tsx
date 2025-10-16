import React, {
    FC,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    memo
} from 'react';


interface WebGLContext {
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    vertexShader: WebGLShader;
    fragmentShader: WebGLShader;
    uniformLocations: {
        resolution: WebGLUniformLocation | null;
        translation: WebGLUniformLocation | null;
        scale: WebGLUniformLocation | null;
        color: WebGLUniformLocation | null;
    };
    attributeLocations: {
        position: number;
    };
    buffers: {
        waveform: WebGLBuffer | null;
        unitLine: WebGLBuffer | null;
    };
}

interface WaveformProps {
    waveformData: number[];
    videoDuration: number;
    currentTime: number;
    viewTransform: { scale: number; offset: number };
    onSeek: (event: React.MouseEvent<HTMLCanvasElement>) => void;
    timelineWidth: number;
    timelineContainerRef: React.RefObject<HTMLDivElement>;
}

interface HoverTime {
    x: number;
}

function formatTimeForWaveform(seconds: number): string {
    if (isNaN(seconds)) return '00:00.000';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toFixed(3).toString().padStart(6, '0');
    return `${mins}:${secs}`;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | undefined {
    const shader = gl.createShader(type);
    if (!shader) {
        console.error("Unable to create shader.");
        return undefined;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }
    console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return undefined;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | undefined {
    const program = gl.createProgram();
    if (!program) {
        console.error("Unable to create program.");
        return undefined;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }
    console.error("Program linking error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return undefined;
}

const vertexShaderSource = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  uniform vec2 u_scale;
  void main() {
    vec2 scaledPosition = a_position * u_scale;
    vec2 translatedPosition = scaledPosition + u_translation;

    // Convert from pixels to clip space
    vec2 zeroToOne = translatedPosition / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec4 u_color;
  void main() {
    gl_FragColor = u_color;
  }
`;

const WaveformWebGLComponent: FC<WaveformProps> = ({
    waveformData,
    videoDuration,
    onSeek,
    currentTime,
    viewTransform,
    timelineWidth,
    timelineContainerRef
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glContext = useRef<WebGLContext | null>(null);
    const isScrubbing = useRef(false);

    const [hoverTime, setHoverTime] = useState<HoverTime | null>(null);
    const [initKey, setInitKey] = useState(0);
    const [needsRender, setNeedsRender] = useState(true);


    ///
    ///
    /// Initial setup
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;

        if (!canvas || !container) {
            return;
        }
        const handleContextLost = (event: Event) => {
            event.preventDefault();
            console.warn("WebGL context lost!");
        };

        const handleContextRestored = () => {
            console.log("WebGL context restored. Re-initializing.");
            setInitKey(key => key + 1);
        };

        canvas.addEventListener('webglcontextlost', handleContextLost, false);
        canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

        const gl = canvas.getContext('webgl', {
            antialias: true, alpha: true
        });

        if (!gl) {
            console.error("WebGL not supported!");
            return;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        if (!vertexShader || !fragmentShader) return;

        const program = createProgram(gl, vertexShader, fragmentShader);
        if (!program) return;

        glContext.current = {
            gl,
            program,
            vertexShader,
            fragmentShader,
            uniformLocations: {
                resolution: gl.getUniformLocation(program, "u_resolution"),
                translation: gl.getUniformLocation(program, "u_translation"),
                scale: gl.getUniformLocation(program, "u_scale"),
                color: gl.getUniformLocation(program, "u_color"),
            },
            attributeLocations: {
                position: gl.getAttribLocation(program, "a_position"),
            },
            buffers: {
                waveform: gl.createBuffer(),
                unitLine: gl.createBuffer(),
            },
        };

        gl.bindBuffer(gl.ARRAY_BUFFER, glContext.current.buffers.unitLine);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1]), gl.STATIC_DRAW);

        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                canvas.width = width;
                canvas.height = height;
            }
        });
        // resizeObserver.observe(container);
        if (timelineContainerRef.current) {
            resizeObserver.observe(timelineContainerRef.current);
        }

        const contextForCleanup = glContext.current;

        return () => {
            resizeObserver.disconnect();
            canvas.removeEventListener('webglcontextlost', handleContextLost);
            canvas.removeEventListener('webglcontextrestored', handleContextRestored);

            const ctx = contextForCleanup;
            if (ctx && ctx.gl && !ctx.gl.isContextLost()) {
                ctx.gl.deleteBuffer(ctx.buffers.waveform);
                ctx.gl.deleteBuffer(ctx.buffers.unitLine);
                ctx.gl.deleteProgram(ctx.program);
                ctx.gl.deleteShader(ctx.vertexShader);
                ctx.gl.deleteShader(ctx.fragmentShader);
            }
            glContext.current = null;
        }
    }, [initKey]);

    ///
    ///
    /// Buffer creation
    useEffect(() => {
        if (!glContext.current || glContext.current.gl.isContextLost() || !waveformData || waveformData.length === 0 || !canvasRef.current || canvasRef.current.height === 0) {
            return;
        }

        const { gl, buffers } = glContext.current;
        const height = canvasRef.current.height;
        const centerY = height / 2;
        const maxPeak = waveformData.reduce((max, current) => Math.max(max, current), 0) || 1.0;

        const points: number[] = [];
        for (let i = 0; i < waveformData.length; i++) {
            const peak = waveformData[i];
            const scaledHeight = (peak / maxPeak) * centerY * 0.8;
            points.push(i, centerY - scaledHeight);
        }

        for (let i = waveformData.length - 1; i >= 0; i--) {
            const peak = waveformData[i];
            const scaledHeight = (peak / maxPeak) * centerY * 0.8;
            points.push(i, centerY + scaledHeight);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.waveform);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    }, [waveformData, initKey]);

    useLayoutEffect(() => {
        if (!glContext.current || !glContext.current.gl || glContext.current.gl.isContextLost() || timelineWidth === 0) {
            return;
        }

        const { gl, program, uniformLocations, attributeLocations, buffers } = glContext.current;
        let animationFrameId: number;

        const render = () => {
            // if (!needsRender) return;
            animationFrameId = requestAnimationFrame(render);

            const canvas = canvasRef.current;
            if (!canvas || canvas.width === 0) {
                return;
            }

            const width = canvas.width;
            const height = canvas.height;


            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            gl.enableVertexAttribArray(attributeLocations.position);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.waveform);
            gl.enableVertexAttribArray(attributeLocations.position);
            gl.vertexAttribPointer(attributeLocations.position, 2, gl.FLOAT, false, 0, 0);
            gl.uniform2f(uniformLocations.resolution, width, height);
            // gl.uniform2f(uniformLocations.scale, (width / (waveformData.length - 1 || 1)) * viewTransform.scale, 1);
            gl.uniform2f(uniformLocations.scale, (timelineWidth / (waveformData.length - 1 || 1)) * viewTransform.scale, 1);
            gl.uniform2f(uniformLocations.translation, -viewTransform.offset, 0);
            gl.uniform4f(uniformLocations.color, 0.21, 0.74, 0.97, 0.8);
            if (waveformData.length > 0) {
                gl.drawArrays(gl.LINE_LOOP, 0, waveformData.length * 2);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.unitLine);
            gl.vertexAttribPointer(attributeLocations.position, 2, gl.FLOAT, false, 0, 0);

            if (videoDuration > 0) {
                // const worldWidth = width * viewTransform.scale;
                const worldWidth = width * viewTransform.scale; 
                const playheadX = (currentTime / videoDuration) * worldWidth;
                const screenX = playheadX - viewTransform.offset;

                if (screenX >= 0 && screenX <= width) {
                    gl.uniform2f(uniformLocations.scale, 1, height);
                    gl.uniform2f(uniformLocations.translation, screenX, 0);
                    gl.uniform4f(uniformLocations.color, 1.0, 1.0, 1.0, 1.0);
                    gl.drawArrays(gl.LINES, 0, 2);
                }
            }

            if (hoverTime) {
                gl.bindBuffer(gl.ARRAY_BUFFER, buffers.unitLine);
                gl.enableVertexAttribArray(attributeLocations.position);
                gl.vertexAttribPointer(attributeLocations.position, 2, gl.FLOAT, false, 0, 0);

                gl.uniform2f(uniformLocations.scale, 1, height);
                gl.uniform2f(uniformLocations.translation, hoverTime.x, 0);
                gl.uniform4f(uniformLocations.color, 1.0, 1.0, 1.0, 0.5);
                gl.drawArrays(gl.LINES, 0, 2);
            }
            setNeedsRender(false)
        };

        render();



        return () => cancelAnimationFrame(animationFrameId);
    }, [waveformData, currentTime, videoDuration, viewTransform, hoverTime, initKey, timelineWidth]);

    useEffect(() => {
        setNeedsRender(true);
    }, [viewTransform, timelineWidth]);

    const seekFromMouseEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
        onSeek(e);
    };

    const calculateTimeFromX = (screenX: number): number => {
        const canvas = canvasRef.current;
        if (!videoDuration || !canvas || timelineWidth === 0) {
            return 0;
        }

        const worldWidth = timelineWidth * viewTransform.scale;

        // screenX is already relative to container, so add offset to get world position
        const worldX = screenX + viewTransform.offset;

        // Calculate time as percentage of world width
        const timePercent = worldX / worldWidth;
        const time = timePercent * videoDuration;

        return Math.max(0, Math.min(time, videoDuration));
    };


    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!videoDuration || !timelineContainerRef.current) return;

        const rect = timelineContainerRef.current.getBoundingClientRect();
        const hoverX = e.clientX - rect.left;


        setHoverTime({ x: hoverX });

        if (isScrubbing.current) {
            seekFromMouseEvent(e);
        }
    };

    const handleMouseLeave = () => {
        setHoverTime(null);
        isScrubbing.current = false;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        isScrubbing.current = true;
        seekFromMouseEvent(e);
    };

    const handleMouseUp = () => {
        isScrubbing.current = false;
    };

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 cursor-pointer"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
            />
            {hoverTime && (
                <div
                    className="absolute top-1 text-xs bg-black/50 text-white p-1 rounded-md pointer-events-none z-20"
                    style={{ left: `${hoverTime.x + 10}px` }}
                >
                    {formatTimeForWaveform(calculateTimeFromX(hoverTime.x))}
                </div>
            )}
        </div>
    );
};

const WaveformWebGL = memo(WaveformWebGLComponent);
export default WaveformWebGL;

