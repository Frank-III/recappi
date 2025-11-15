#!/usr/bin/env node

// Minimal CLI to test FluidAudio ASR integration
import { AsrService } from './index.cjs';

console.log('🎤 FluidAudio ASR Test');
console.log('='.repeat(50));

async function main() {
  try {
    // Check if models exist
    console.log('\n📦 Checking for models...');
    const modelsExist = AsrService.modelsExist();
    console.log(`   Models on disk: ${modelsExist ? '✅' : '❌'}`);

    if (!modelsExist) {
      console.log('\n⚠️  Models not found. Will download (~500MB)...');
      console.log('   This may take a few minutes on first run.');
    }

    // Initialize ASR
    console.log('\n🔧 Initializing ASR service...');
    const asr = new AsrService();
    await asr.initialize();
    console.log('   ✅ ASR initialized successfully!');

    // Get model path
    const modelPath = AsrService.getModelPath();
    console.log(`   📂 Model cache: ${modelPath}`);

    // Create test audio (1 second of silence at 16kHz)
    console.log('\n🎵 Testing transcription with silent audio...');
    const testAudio = new Float32Array(16000).fill(0);

    const result = await asr.transcribe(testAudio);
    console.log(`   Text: "${result.text}"`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);

    console.log('\n✅ Test complete!');
    console.log('\n💡 Next steps:');
    console.log('   - Integration is working!');
    console.log('   - Use Web Audio API to capture real microphone input');
    console.log('   - Process audio in 2-second chunks for streaming');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
