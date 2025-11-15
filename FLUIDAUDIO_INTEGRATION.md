# FluidAudio Integration for Tauri Apps

This project integrates FluidAudio's powerful on-device AI capabilities (ASR, Speaker Diarization, VAD) into your Tauri application through a Swift-to-Rust bridge using `swift-rs` and NAPI bindings.

## Architecture

```
Tauri App (TypeScript/JavaScript)
    ↓
NAPI Bindings (@recappi/sdk)
    ↓
Rust FFI Layer (src/macos/fluid_audio.rs)
    ↓
Swift-rs Bridge
    ↓
Swift Wrapper (FluidAudioBridge)
    ↓
FluidAudio SDK (Swift Package)
    ↓
Apple Neural Engine (ANE)
```

## Features

- **Automatic Speech Recognition (ASR)**: Transcribe audio in 25 European languages
- **Speaker Diarization**: Identify and separate different speakers
- **Voice Activity Detection (VAD)**: Detect speech regions in audio
- **Optimized for Apple Silicon**: Runs on Apple Neural Engine for maximum performance
- **Privacy-First**: All processing happens locally on-device

## Prerequisites

1. **macOS 13.0+** (for FluidAudio)
2. **Xcode 14+** with Swift 5.9+
3. **Rust** with cargo
4. **Node.js 18+** with npm/yarn/pnpm
5. **Tauri CLI** installed

## Build Instructions

### 1. Install Dependencies

```bash
# Install Rust dependencies
cargo build

# Install Node dependencies
yarn install
# or npm install
```

### 2. Build the Native Module

```bash
# Build the NAPI module with Swift integration
yarn build
# or npm run build
```

This will:

- Compile the Swift package (FluidAudioBridge)
- Build the Rust FFI bindings
- Generate NAPI bindings for TypeScript

### 3. First Run - Model Download

On first use, FluidAudio will automatically download the required models from HuggingFace:

- ASR models (~500MB)
- Diarization models (~100MB)
- VAD models (~50MB)

Models are cached in `~/.cache/fluidaudio/Models/`

## Usage in Tauri

### Basic Transcription

```typescript
import { FluidASR } from "./fluid-audio";

async function transcribeAudio() {
  const asr = new FluidASR();

  // Initialize with multilingual support
  await asr.initialize(true);

  // Transcribe audio (16kHz mono float32)
  const result = await asr.transcribe(audioSamples);
  console.log("Text:", result.text);
  console.log("Confidence:", result.confidence);
}
```

### Speaker Diarization

```typescript
import { FluidDiarizer } from "./fluid-audio";

async function identifySpeakers() {
  const diarizer = new FluidDiarizer(true); // offline mode
  await diarizer.initialize(0.6); // threshold

  const segments = await diarizer.process(audioSamples);
  for (const segment of segments) {
    console.log(
      `Speaker ${segment.speakerId}: ${segment.startTime}s - ${segment.endTime}s`,
    );
  }
}
```

### Voice Activity Detection

```typescript
import { FluidVAD } from "./fluid-audio";

async function detectSpeech() {
  const vad = new FluidVAD();
  await vad.initialize(0.75);

  const segments = await vad.process(audioSamples);
  const speechSegments = segments.filter((s) => s.isSpeech);
  console.log("Speech segments:", speechSegments);
}
```

### Complete Pipeline

```typescript
import { FluidAudioPipeline } from "./fluid-audio";

async function analyzeAudio() {
  const pipeline = new FluidAudioPipeline();
  await pipeline.initialize();

  const analysis = await pipeline.processAudio(audioSamples);
  console.log("Transcription:", analysis.transcription);
  console.log("Speakers:", analysis.speakers);
  console.log("Speech segments:", analysis.speechSegments);
}
```

## Integration with Tauri Commands

In your Tauri Rust backend:

```rust
#[tauri::command]
async fn transcribe_audio(samples: Vec<f32>) -> Result<String, String> {
    // The audio processing happens through the NAPI module
    // Call from frontend JavaScript/TypeScript
    Ok("Use JavaScript API directly".to_string())
}
```

In your frontend:

```typescript
// Frontend code in Tauri app
import { FluidASR } from "@recappi/sdk/fluid-audio";

const asr = new FluidASR();
await asr.initialize();

// Get audio from user
const audioData = await recordAudio();
const transcription = await asr.transcribe(audioData);
```

## Configuration

### Environment Variables

- `REGISTRY_URL`: Override model download URL (for mirrors/proxies)
- `https_proxy`: HTTP proxy for model downloads

### Model Versions

- **ASR v3**: Multilingual (25 languages) - Default
- **ASR v2**: English-only with higher recall
- Configure during initialization: `asr.initialize(true)` for v3, `false` for v2

## Performance

- **ASR**: ~190x real-time on M4 Pro
- **Diarization**: Real-time processing
- **VAD**: Near-instantaneous
- All processing on Apple Neural Engine (ANE)

## Troubleshooting

### Build Issues

1. **Swift compilation fails**:

   ```bash
   # Ensure Xcode command line tools are installed
   xcode-select --install
   ```

2. **swift-rs linking errors**:
   - Check minimum macOS version in Package.swift matches build.rs
   - Default is macOS 13.0

3. **Model download fails**:
   ```bash
   # Use proxy if behind firewall
   export https_proxy=http://proxy:8080
   yarn build
   ```

### Runtime Issues

1. **"ASR not initialized"**:
   - Call `await asr.initialize()` before transcribing
   - Check console for model download progress

2. **Poor transcription quality**:
   - Ensure audio is 16kHz mono
   - Use the resampling utility: `resampleTo16khzMono()`
   - Check audio levels aren't too low

3. **Memory usage**:
   - Models use ~1GB RAM when loaded
   - Unload services when not needed

## Language Support

The v3 model supports automatic language detection for:

- Bulgarian, Croatian, Czech, Danish, Dutch
- English, Estonian, Finnish, French, German
- Greek, Hungarian, Italian, Latvian, Lithuanian
- Maltese, Polish, Portuguese, Romanian, Slovak
- Slovenian, Spanish, Swedish, Russian, Ukrainian

## License

- This integration: MIT
- FluidAudio SDK: Apache 2.0
- Models: Various open-source licenses (MIT/Apache)

## Credits

- [FluidAudio](https://github.com/FluidInference/FluidAudio) by Fluid Inference
- [swift-rs](https://github.com/Brendonovich/swift-rs) for Swift-Rust bridging
- Parakeet, Pyannote, and Silero for the underlying models

## Support

- FluidAudio Discord: https://discord.gg/WNsvaCtmDe
- Issues: Create an issue in this repository
- FluidAudio Docs: https://deepwiki.com/FluidInference/FluidAudio
