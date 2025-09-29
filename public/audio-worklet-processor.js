// High-performance audio processing worklet
class AudioWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioBuffer = [];
    this.bufferLength = 0;
    this.samplesPerChunk = 24000; // 1.5 seconds at 16kHz for faster processing
    this.silenceThreshold = 0.01; // Voice activity detection
    this.silenceCounter = 0;
    this.maxSilenceFrames = 16; // Skip processing if silent too long
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const inputData = input[0]; // First channel

    // Voice Activity Detection - skip processing if too quiet
    const rms = Math.sqrt(
      inputData.reduce((sum, sample) => sum + sample * sample, 0) /
        inputData.length
    );

    if (rms < this.silenceThreshold) {
      this.silenceCounter++;
      if (this.silenceCounter > this.maxSilenceFrames) {
        return true; // Skip processing during long silence
      }
    } else {
      this.silenceCounter = 0;
    }

    // Copy audio data efficiently
    const chunk = new Float32Array(inputData.length);
    chunk.set(inputData);

    this.audioBuffer.push(chunk);
    this.bufferLength += chunk.length;

    // Process smaller chunks for faster response
    if (this.bufferLength >= this.samplesPerChunk) {
      // Combine audio chunks efficiently
      const combinedAudio = new Float32Array(this.bufferLength);
      let offset = 0;

      for (const audioChunk of this.audioBuffer) {
        combinedAudio.set(audioChunk, offset);
        offset += audioChunk.length;
      }

      // Send to main thread for processing
      this.port.postMessage({
        type: "audioChunk",
        audioData: combinedAudio.buffer,
        length: this.bufferLength,
        rms: rms,
      });

      // Reset buffer
      this.audioBuffer = [];
      this.bufferLength = 0;
    }

    return true;
  }
}

registerProcessor("audio-worklet-processor", AudioWorkletProcessor);
