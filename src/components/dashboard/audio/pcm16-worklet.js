class Pcm16DownsamplerProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.targetSampleRate =
      options?.processorOptions?.targetSampleRate || 16000;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) {
      return true;
    }

    const pcm16 = this.downsampleToPcm16(
      input,
      sampleRate,
      this.targetSampleRate,
    );
    if (pcm16.length > 0) {
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }

    return true;
  }

  downsampleToPcm16(input, inputSampleRate, targetSampleRate) {
    if (inputSampleRate === targetSampleRate) {
      const output = new Int16Array(input.length);
      for (let i = 0; i < input.length; i += 1) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return output;
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

    return output;
  }
}

registerProcessor("pcm16-downsampler", Pcm16DownsamplerProcessor);
