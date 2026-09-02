type CaptionsMicCapture = {
  stop: () => void;
};

type MicCaptureOptions = {
  targetSampleRate: number;
};

function downsampleTo16kPcm16(
  input: Float32Array,
  inputSampleRate: number,
  targetSampleRate: number,
): ArrayBuffer {
  if (input.length === 0) {
    return new ArrayBuffer(0);
  }

  if (inputSampleRate === targetSampleRate) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output.buffer;
  }

  const ratio = inputSampleRate / targetSampleRate;
  const outputLength = Math.max(1, Math.floor(input.length / ratio));
  const output = new Int16Array(outputLength);

  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < outputLength) {
    const nextOffsetBuffer = Math.floor((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;

    for (
      let i = offsetBuffer;
      i < nextOffsetBuffer && i < input.length;
      i += 1
    ) {
      accum += input[i];
      count += 1;
    }

    const sample = count > 0 ? accum / count : 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    output[offsetResult] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return output.buffer;
}

export async function startRendererMicStreaming({
  targetSampleRate,
}: MicCaptureOptions): Promise<CaptionsMicCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const silentGain = audioContext.createGain();
  silentGain.gain.value = 0;

  let closed = false;
  let cleanupNode: (() => void) | null = null;
  const queuedChunks: Int16Array[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  audioContext.onstatechange = () => {
    if (audioContext.state === "suspended" && !closed) {
      void audioContext.resume();
    }
  };

  const flushQueuedChunks = () => {
    flushTimer = null;
    if (closed || queuedChunks.length === 0) {
      return;
    }

    const totalLength = queuedChunks.reduce(
      (sum, chunk) => sum + chunk.length,
      0,
    );
    const merged = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of queuedChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    queuedChunks.length = 0;

    void window.speechToTextAPI.sendStreamingAudio(merged.buffer).catch(() => {
      // Keep the stream alive even when a chunk fails.
    });
  };

  const enqueuePcmChunk = (chunkBuffer: ArrayBuffer) => {
    if (closed || chunkBuffer.byteLength === 0) return;
    queuedChunks.push(new Int16Array(chunkBuffer));

    const totalSamples = queuedChunks.reduce(
      (sum, chunk) => sum + chunk.length,
      0,
    );
    if (totalSamples >= 1600) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      flushQueuedChunks();
    } else if (!flushTimer) {
      flushTimer = setTimeout(flushQueuedChunks, 60);
    }
  };

  const stop = () => {
    if (closed) return;
    closed = true;

    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flushQueuedChunks();

    try {
      cleanupNode?.();
    } catch {
      // no-op
    }
    try {
      silentGain.disconnect();
    } catch {
      // no-op
    }
    try {
      source.disconnect();
    } catch {
      // no-op
    }

    stream.getTracks().forEach((track) => track.stop());
    void audioContext.close();
  };

  try {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    await audioContext.audioWorklet.addModule(
      new URL("./pcm16-worklet.js", import.meta.url),
    );

    const node = new AudioWorkletNode(audioContext, "pcm16-downsampler", {
      processorOptions: {
        targetSampleRate,
      },
    });

    node.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      if (closed) return;
      const pcm16 = event.data;
      if (!pcm16 || pcm16.byteLength === 0) return;
      enqueuePcmChunk(pcm16);
    };

    source.connect(node);
    node.connect(silentGain);
    silentGain.connect(audioContext.destination);

    cleanupNode = () => {
      try {
        node.port.onmessage = null;
      } catch {
        // no-op
      }
      try {
        node.disconnect();
      } catch {
        // no-op
      }
    };

    return { stop };
  } catch {
    // Fallback for environments where AudioWorklet is unavailable.
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const audioBuffer: Float32Array[] = [];
    let bufferTimeout: ReturnType<typeof setTimeout> | null = null;

    const flushAudioBuffer = () => {
      bufferTimeout = null;
      if (audioBuffer.length === 0 || closed) return;

      const totalFrames = audioBuffer.reduce(
        (sum, chunk) => sum + chunk.length,
        0,
      );
      const combined = new Float32Array(totalFrames);

      let offset = 0;
      for (const chunk of audioBuffer) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      audioBuffer.length = 0;

      const pcm16 = downsampleTo16kPcm16(
        combined,
        audioContext.sampleRate,
        targetSampleRate,
      );
      if (pcm16.byteLength > 0) {
        enqueuePcmChunk(pcm16);
      }
    };

    processor.onaudioprocess = (event) => {
      if (closed) return;
      const input = event.inputBuffer.getChannelData(0);
      audioBuffer.push(new Float32Array(input));

      if (!bufferTimeout) {
        bufferTimeout = setTimeout(flushAudioBuffer, 100);
      }
    };

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);

    cleanupNode = () => {
      flushAudioBuffer();
      flushQueuedChunks();
      if (bufferTimeout) {
        clearTimeout(bufferTimeout);
      }
      try {
        processor.disconnect();
      } catch {
        // no-op
      }
    };

    return { stop };
  }
}
