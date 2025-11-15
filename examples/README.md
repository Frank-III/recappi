# FluidAudio Real-time Transcription CLI

Complete standalone example demonstrating real-time microphone transcription using FluidAudio.

## Features

- ✅ Real-time microphone capture (16kHz mono)
- ✅ Streaming transcription (2-second chunks)
- ✅ 25 language support (auto-detected)
- ✅ On-device processing (Apple Neural Engine)
- ✅ ~100x real-time speed
- ✅ Confidence scores
- ✅ Full session summary

## Prerequisites

1. **macOS** (FluidAudio requires macOS)
2. **Screen Recording Permission** (macOS will prompt on first run)

## Installation

```bash
# From the examples directory
cd examples
npm install
npm run build
```

## Usage

```bash
# Start real-time transcription
npm start

# Or use the dev command (rebuilds TypeScript)
npm run dev
```

## How It Works

1. **Captures audio** using recappi's native `tapGlobalAudio()` API
2. **Resamples** to 16kHz mono automatically if needed
3. **Buffers audio** in 2-second chunks (32,000 samples @ 16kHz)
4. **Transcribes** each chunk using FluidAudio ASR
5. **Prints** results in real-time with timestamps and confidence
6. **Summarizes** full transcription when you stop (Ctrl+C)

## Output Example

```
🎤 FluidAudio Real-time Transcription CLI
==================================================

🔧 Initializing FluidAudio ASR...
✅ ASR initialized successfully!
📂 Model cache: /Users/you/Library/Application Support/FluidAudio/Models

🎤 Starting microphone recording...
   Sample rate: 16kHz mono
   Press Ctrl+C to stop

──────────────────────────────────────────────────

[10:30:15] 95.2% (102.4x)
Hey, I'm Vincent, and I'm CEO of Code Zero.
──────────────────────────────────────────────────

[10:30:17] 94.8% (98.1x)
I was previously an ML engineer at Google.
──────────────────────────────────────────────────

^C
🛑 Stopping recording...

==================================================
📝 FULL TRANSCRIPTION
==================================================
Hey, I'm Vincent, and I'm CEO of Code Zero. I was previously an ML engineer at Google.

==================================================
📊 STATISTICS
==================================================
Segments: 2
Average confidence: 95.0%
Total processing time: 1.18s
```

## Architecture

```
Microphone/System Audio
    ↓
recappi tapGlobalAudio() (native capture)
    ↓
Automatic resampling to 16kHz mono
    ↓
2-second chunks (Float32Array)
    ↓
FluidAudio ASR (@recappi/sdk)
    ↓
Real-time transcription output
```

## Configuration

Edit `src/index.ts` to customize:

```typescript
// Chunk size (samples)
private readonly CHUNK_SIZE = 32000; // 2 seconds at 16kHz

// Sample rate
private readonly SAMPLE_RATE = 16000; // FluidAudio requires 16kHz
```

## Troubleshooting

**"Screen Recording Permission Required"**:
- macOS will prompt for permission on first run
- Go to System Settings → Privacy & Security → Screen Recording
- Enable permission for Terminal/Node

**"ASR not initialized"**:
- Models will download automatically on first run (~500MB)
- Check internet connection
- Ensure enough disk space

**No audio being captured**:
- Grant Screen Recording permission (macOS requirement for audio capture)
- Ensure audio is playing or speak into microphone
- Check System Settings → Sound → Input

**Poor transcription quality**:
- Speak clearly and at normal volume
- Reduce background noise
- Check microphone input level

## Performance

- **Speed**: ~100x real-time (M4 Pro)
- **Latency**: ~2 seconds (configurable)
- **Languages**: 25 European languages (auto-detected)
- **Memory**: ~1GB RAM (models loaded)

## Next Steps

- Integrate with your application
- Add speaker diarization (who spoke when)
- Save transcriptions to file
- Stream to web UI via WebSocket
- Export as subtitles/captions

## Files

```
examples/
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── src/
│   └── index.ts         # Main CLI implementation
├── dist/                # Compiled JavaScript (after build)
└── README.md           # This file
```

## Credits

- [FluidAudio](https://github.com/FluidInference/FluidAudio) - On-device ASR
- [Sox](http://sox.sourceforge.net/) - Audio recording toolkit
- [swift-rs](https://github.com/Brendonovich/swift-rs) - Swift-Rust bridge
