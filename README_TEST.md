# FluidAudio Integration - Quick Test

## Build & Test

```bash
# 1. Build the native module (already done!)
cargo build --release

# 2. Build the NAPI bindings
yarn install
yarn build

# 3. Run the test
node test-fluidaudio.mjs
```

## What the test does

1. ✅ Checks if models exist on disk
2. ✅ Downloads models if needed (~500MB, first run only)
3. ✅ Initializes FluidAudio ASR service
4. ✅ Tests transcription with sample audio
5. ✅ Displays model path and results

## Expected Output

```
🎤 FluidAudio ASR Test
==================================================

📦 Checking for models...
   Models on disk: ✅

🔧 Initializing ASR service...
   ✅ ASR initialized successfully!
   📂 Model cache: /Users/you/.cache/fluidaudio

🎵 Testing transcription with silent audio...
   Text: ""
   Confidence: 0.0%

✅ Test complete!
```

## Next Steps

Once this test passes, you can:
- Capture real audio from microphone
- Process in 2-second chunks for streaming
- Build your Tauri integration

## Troubleshooting

**"Cannot find module './index.cjs'"**:
```bash
yarn build  # Build NAPI bindings first
```

**Models downloading too slow**:
- Models are ~500MB total
- Only downloads once, then cached
- Check internet connection

**"ASR initialization failed"**:
- Make sure you're on macOS (FluidAudio requires macOS)
- Xcode Command Line Tools must be installed
- Check that `cargo build --release` succeeded
