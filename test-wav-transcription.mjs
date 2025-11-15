#!/usr/bin/env node

// Test FluidAudio ASR with a WAV file
import { AsrService } from './index.cjs';
import fs from 'fs';

console.log('🎤 FluidAudio WAV Transcription Test');
console.log('='.repeat(50));

/**
 * Simple WAV file reader for 16-bit PCM mono audio
 * Converts to Float32Array normalized to [-1.0, 1.0]
 */
function readWavFile(filePath) {
  console.log(`\n📄 Reading WAV file: ${filePath}`);

  const buffer = fs.readFileSync(filePath);

  // Parse WAV header
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // Check RIFF header
  const riff = String.fromCharCode(...buffer.slice(0, 4));
  if (riff !== 'RIFF') {
    throw new Error('Not a valid WAV file (missing RIFF header)');
  }

  // Find data chunk
  let offset = 12; // Skip RIFF header
  while (offset < buffer.length) {
    const chunkId = String.fromCharCode(...buffer.slice(offset, offset + 4));
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'fmt ') {
      // Parse format chunk
      const audioFormat = view.getUint16(offset + 8, true);
      const numChannels = view.getUint16(offset + 10, true);
      const sampleRate = view.getUint32(offset + 12, true);
      const bitsPerSample = view.getUint16(offset + 22, true);

      console.log(`   Format: ${audioFormat === 1 ? 'PCM' : 'Unknown'}`);
      console.log(`   Channels: ${numChannels}`);
      console.log(`   Sample Rate: ${sampleRate} Hz`);
      console.log(`   Bits per Sample: ${bitsPerSample}`);

      if (sampleRate !== 16000) {
        console.warn(`   ⚠️  Warning: Sample rate is ${sampleRate}Hz, expected 16000Hz`);
      }
    } else if (chunkId === 'data') {
      // Read audio data
      const dataOffset = offset + 8;
      const dataSize = chunkSize;
      const numSamples = dataSize / 2; // 16-bit = 2 bytes per sample

      console.log(`   Samples: ${numSamples} (${(numSamples / 16000).toFixed(2)}s duration)`);

      // Convert 16-bit PCM to Float32
      const samples = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const sample16 = view.getInt16(dataOffset + i * 2, true);
        samples[i] = sample16 / 32768.0; // Normalize to [-1.0, 1.0]
      }

      return samples;
    }

    offset += 8 + chunkSize;
  }

  throw new Error('No data chunk found in WAV file');
}

async function main() {
  const wavFile = process.argv[2] || 'callzero-founder-audio-16k.wav';

  try {
    // Check if file exists
    if (!fs.existsSync(wavFile)) {
      console.error(`\n❌ Error: File not found: ${wavFile}`);
      console.log('\nUsage: node test-wav-transcription.mjs <path-to-wav-file>');
      process.exit(1);
    }

    // Read WAV file
    const audioSamples = readWavFile(wavFile);

    // Initialize ASR
    console.log('\n🔧 Initializing ASR service...');
    const asr = new AsrService();
    await asr.initialize();
    console.log('   ✅ ASR initialized successfully!');

    // Transcribe
    console.log('\n🎵 Transcribing audio...');
    const startTime = Date.now();
    const result = await asr.transcribe(audioSamples);
    const duration = Date.now() - startTime;

    // Print results
    console.log('\n📝 Transcription Result:');
    console.log('='.repeat(50));
    console.log(result.text);
    console.log('='.repeat(50));
    console.log(`\n📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`⏱️  Processing time: ${(duration / 1000).toFixed(2)}s`);
    console.log(`⚡ Speed: ${((audioSamples.length / 16000) / (duration / 1000)).toFixed(1)}x real-time`);

    console.log('\n✅ Transcription complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
