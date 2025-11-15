// Real-time Streaming Transcription Example for Tauri
// This demonstrates how to use FluidAudio for live audio transcription

import { AsrService, resampleTo16khzMono } from "../index.cjs";

/**
 * Streaming transcription handler for real-time audio
 */
class StreamingTranscriber {
  private asrService: AsrService;
  private isInitialized: boolean = false;
  private audioContext: AudioContext | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private audioBuffer: Float32Array[] = [];
  private readonly CHUNK_SIZE = 32000; // 2 seconds at 16kHz
  private readonly SAMPLE_RATE = 16000;

  constructor() {
    this.asrService = new AsrService();
  }

  /**
   * Initialize the ASR service and audio context
   */
  async initialize(): Promise<void> {
    console.log("Initializing ASR service...");

    // Check if models are already downloaded
    const modelsExist = AsrService.modelsExist();
    if (!modelsExist) {
      console.log(
        "Models will be downloaded (~500MB). This may take a few minutes...",
      );
    }

    // Initialize ASR (this will download models if needed)
    await this.asrService.initialize();
    this.isInitialized = true;

    console.log("ASR initialized successfully!");
    console.log(`Model cache directory: ${AsrService.getModelPath()}`);
  }

  /**
   * Start capturing and transcribing audio from microphone
   */
  async startStreaming(
    onTranscription: (text: string, confidence: number) => void,
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("ASR not initialized. Call initialize() first.");
    }

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Create audio context at 16kHz
    this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
    const source = this.audioContext.createMediaStreamSource(stream);

    // Create processor for capturing audio chunks
    const bufferSize = 4096;
    this.processorNode = this.audioContext.createScriptProcessor(
      bufferSize,
      1,
      1,
    );

    this.processorNode.onaudioprocess = async (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const audioChunk = new Float32Array(inputData);

      // Accumulate audio chunks
      this.audioBuffer.push(audioChunk);

      // Calculate total samples collected
      const totalSamples = this.audioBuffer.reduce(
        (sum, chunk) => sum + chunk.length,
        0,
      );

      // Process when we have enough audio (2 seconds)
      if (totalSamples >= this.CHUNK_SIZE) {
        // Combine all buffered chunks
        const combined = new Float32Array(totalSamples);
        let offset = 0;
        for (const chunk of this.audioBuffer) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        // Clear buffer for next chunk
        this.audioBuffer = [];

        // Transcribe in background (don't block audio processing)
        this.transcribeChunk(combined, onTranscription);
      }
    };

    // Connect the audio pipeline
    source.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    console.log("Streaming started. Speak into your microphone...");
  }

  /**
   * Transcribe an audio chunk (non-blocking)
   */
  private async transcribeChunk(
    audioData: Float32Array,
    callback: (text: string, confidence: number) => void,
  ): Promise<void> {
    try {
      const result = await this.asrService.transcribe(audioData);

      if (result.text && result.text.trim().length > 0) {
        callback(result.text, result.confidence);
      }
    } catch (error) {
      console.error("Transcription error:", error);
    }
  }

  /**
   * Stop streaming and cleanup
   */
  stopStreaming(): void {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioBuffer = [];
    console.log("Streaming stopped");
  }
}

// Example usage in Tauri app
async function main() {
  const transcriber = new StreamingTranscriber();

  // Initialize (downloads models on first run)
  await transcriber.initialize();

  // Start streaming transcription
  await transcriber.startStreaming((text, confidence) => {
    console.log(`[${(confidence * 100).toFixed(1)}%] ${text}`);

    // Update UI with transcription
    // Example: document.getElementById('transcription').textContent = text;
  });

  // Stop after 30 seconds (for demo purposes)
  setTimeout(() => {
    transcriber.stopStreaming();
    console.log("Demo complete");
  }, 30000);
}

// Export for use in Tauri
export { StreamingTranscriber, main };

// Auto-run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
