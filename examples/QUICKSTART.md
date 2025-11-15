# Quick Start - Real-time Transcription CLI

## Run the Example

```bash
# From examples directory
cd examples
npm start
```

That's it! The CLI will:
1. ✅ Initialize FluidAudio ASR (downloads models if needed)
2. ✅ Start capturing audio from your system
3. ✅ Transcribe in real-time (2-second chunks)
4. ✅ Show results with timestamps and confidence scores

## Sample Output

```
🎤 FluidAudio Real-time Transcription CLI
   Using native recappi audio capture
==================================================

🔧 Initializing FluidAudio ASR...
✅ ASR initialized successfully!
📂 Model cache: /Users/you/Library/Application Support/FluidAudio/Models

🎤 Starting audio capture...
   Capturing: Global system audio (including microphone)
   Processing: 2-second chunks
   Press Ctrl+C to stop

──────────────────────────────────────────────────
✅ Audio capture started (48000Hz → 16kHz)
   Speak or play audio to see transcriptions...

[10:30:15] 95.2% | 102.4x real-time
Hey, I'm Vincent, and I'm CEO of Code Zero.
──────────────────────────────────────────────────

[10:30:17] 94.8% | 98.1x real-time
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
Total words: 17
```

## What Gets Captured

**Global Audio** includes:
- Microphone input
- System audio (music, videos, etc.)
- Application audio
- Everything your Mac can hear

macOS will prompt for **Screen Recording permission** on first run (required for audio capture).

## Stop Recording

Press **Ctrl+C** to stop and see the full summary.

## Notes

- No external tools needed (Sox, etc.)
- Uses recappi's native audio capture
- Automatically resamples to 16kHz
- Works with any audio playing on your Mac
