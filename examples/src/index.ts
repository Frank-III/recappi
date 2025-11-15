#!/usr/bin/env node

/**
 * FluidAudio Real-time Microphone Transcription CLI
 *
 * This example demonstrates:
 * - Capturing microphone audio using recappi SDK (no external tools needed!)
 * - Processing in chunks for streaming transcription
 * - Using FluidAudio's on-device ASR (25 languages)
 */

import { AsrService, ShareableContent, AudioCaptureSession, resampleTo16KhzMono } from '@recappi/sdk';

interface TranscriptionSegment {
  text: string;
  confidence: number;
  timestamp: Date;
}

class RealtimeTranscriber {
  private asrService: AsrService;
  private isInitialized = false;
  private audioBuffer: Float32Array[] = [];
  private readonly TARGET_SAMPLE_RATE = 16000;
  private readonly CHUNK_SIZE = 32000; // 2 seconds of audio at 16kHz
  private transcriptions: TranscriptionSegment[] = [];
  private captureSession: AudioCaptureSession | null = null;
  private isProcessing = false;

  constructor() {
    this.asrService = new AsrService();
  }

  /**
   * Initialize the ASR service
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing FluidAudio ASR...');

    const modelsExist = AsrService.modelsExist();
    if (!modelsExist) {
      console.log('📦 Models not found. Downloading (~500MB)...');
      console.log('   This may take a few minutes on first run.');
    }

    await this.asrService.initialize();
    this.isInitialized = true;

    console.log('✅ ASR initialized successfully!');
    console.log(`📂 Model cache: ${AsrService.getModelPath()}\n`);
  }

  /**
   * Start capturing global audio and transcribing
   */
  async startRecording(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('ASR not initialized. Call initialize() first.');
    }

    console.log('🎤 Starting audio capture...');
    console.log('   Capturing: Global system audio (including microphone)');
    console.log('   Processing: 2-second chunks');
    console.log('   Press Ctrl+C to stop\n');
    console.log('─'.repeat(50));

    // Capture global audio (no excluded processes = capture everything)
    this.captureSession = ShareableContent.tapGlobalAudio(null, (err, audioChunk) => {
      if (err) {
        console.error('❌ Audio capture error:', err);
        return;
      }

      // Get the actual sample rate from the session
      const sourceSampleRate = this.captureSession?.actualSampleRate || 48000;

      // Resample to 16kHz if needed
      let processedChunk: Float32Array;
      if (sourceSampleRate !== this.TARGET_SAMPLE_RATE) {
        processedChunk = resampleTo16KhzMono(audioChunk, sourceSampleRate);
      } else {
        processedChunk = audioChunk;
      }

      // Accumulate audio chunks
      this.audioBuffer.push(processedChunk);

      // Calculate total samples collected
      const totalSamples = this.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);

      // Process when we have enough audio (2 seconds)
      if (totalSamples >= this.CHUNK_SIZE && !this.isProcessing) {
        // Combine all buffered chunks
        const combined = new Float32Array(totalSamples);
        let offset = 0;
        for (const chunk of this.audioBuffer) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        // Clear buffer for next chunk
        this.audioBuffer = [];

        // Process asynchronously
        this.processAudioChunk(combined);
      }
    });

    console.log(`✅ Audio capture started (${this.captureSession.sampleRate}Hz → 16kHz)`);
    console.log(`   Speak or play audio to see transcriptions...\n`);

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping recording...');
      this.stopRecording();
      this.printSummary();
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});
  }

  /**
   * Stop recording
   */
  private stopRecording(): void {
    if (this.captureSession) {
      this.captureSession.stop();
      this.captureSession = null;
    }
  }

  /**
   * Process an audio chunk and transcribe it
   */
  private async processAudioChunk(audioSamples: Float32Array): Promise<void> {
    if (this.isProcessing) {
      return; // Skip if already processing
    }

    this.isProcessing = true;

    try {
      const startTime = Date.now();

      // Transcribe
      const result = await this.asrService.transcribe(audioSamples);
      const duration = Date.now() - startTime;

      if (result.text && result.text.trim().length > 0) {
        const segment: TranscriptionSegment = {
          text: result.text,
          confidence: result.confidence,
          timestamp: new Date(),
        };

        this.transcriptions.push(segment);

        // Print result in real-time
        const time = segment.timestamp.toLocaleTimeString();
        const confidence = (segment.confidence * 100).toFixed(1);
        const audioDuration = audioSamples.length / this.TARGET_SAMPLE_RATE;
        const speed = (audioDuration / (duration / 1000)).toFixed(1);

        console.log(`[${time}] ${confidence}% | ${speed}x real-time`);
        console.log(`${result.text}`);
        console.log('─'.repeat(50));
      }
    } catch (error) {
      console.error('❌ Transcription error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Print summary of the recording session
   */
  private printSummary(): void {
    if (this.transcriptions.length === 0) {
      console.log('\nNo transcriptions recorded.');
      return;
    }

    console.log('\n' + '='.repeat(50));
    console.log('📝 FULL TRANSCRIPTION');
    console.log('='.repeat(50));

    const fullText = this.transcriptions.map(s => s.text).join(' ');
    console.log(fullText);

    console.log('\n' + '='.repeat(50));
    console.log('📊 STATISTICS');
    console.log('='.repeat(50));

    const avgConfidence = this.transcriptions.reduce((sum, s) => sum + s.confidence, 0) / this.transcriptions.length;

    console.log(`Segments: ${this.transcriptions.length}`);
    console.log(`Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`Total words: ${fullText.split(/\s+/).length}`);
  }
}

// Main CLI
async function main() {
  console.log('🎤 FluidAudio Real-time Transcription CLI');
  console.log('   Using native recappi audio capture');
  console.log('='.repeat(50));
  console.log('');

  const transcriber = new RealtimeTranscriber();

  try {
    // Initialize ASR
    await transcriber.initialize();

    // Start recording
    await transcriber.startRecording();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
