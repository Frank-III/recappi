import Foundation
import FluidAudio
import SwiftRs

// Error wrapper for better error handling
public class FluidAudioError: NSObject {
    public var message: SRString
    public var code: Int

    init(message: String, code: Int = -1) {
        self.message = SRString(message)
        self.code = code
        super.init()
    }
}

// Result structures for returning data to Rust
public class TranscriptionResult: NSObject {
    public var text: SRString
    public var confidence: Double

    init(text: String, confidence: Double) {
        self.text = SRString(text)
        self.confidence = confidence
        super.init()
    }
}

// Main ASR Bridge class - holds state
class ASRBridgeState {
    var asrManager: AsrManager?
    var models: AsrModels?
    var isInitialized: Bool = false
}

// Global state management
private var asrState = ASRBridgeState()

// MARK: - Initialization functions

@_cdecl("fluid_asr_initialize")
public func fluidAsrInitialize() -> FluidAudioError? {
    let semaphore = DispatchSemaphore(value: 0)
    var resultError: FluidAudioError?

    Task {
        do {
            // Download and load models - v3 is default (multilingual)
            asrState.models = try await AsrModels.downloadAndLoad()

            // Initialize ASR manager
            asrState.asrManager = AsrManager(config: .default)
            if let models = asrState.models {
                try await asrState.asrManager?.initialize(models: models)
            }

            asrState.isInitialized = true
            print("FluidAudio ASR initialized successfully (multilingual v3)")
        } catch {
            resultError = FluidAudioError(
                message: "Failed to initialize ASR: \(error.localizedDescription)",
                code: -1
            )
            print("FluidAudio ASR initialization error: \(error)")
        }
        semaphore.signal()
    }

    semaphore.wait()
    return resultError
}

@_cdecl("fluid_asr_is_initialized")
public func fluidAsrIsInitialized() -> Bool {
    return asrState.isInitialized
}

// MARK: - Transcription functions

@_cdecl("fluid_asr_transcribe")
public func fluidAsrTranscribe(samplesData: SRData) -> TranscriptionResult? {
    guard asrState.isInitialized, let manager = asrState.asrManager else {
        return nil
    }

    let semaphore = DispatchSemaphore(value: 0)
    var result: TranscriptionResult?

    Task {
        do {
            // Convert SRData (bytes) back to [Float]
            let bytes = samplesData.toArray()
            let floats = bytes.withUnsafeBytes { (ptr: UnsafeRawBufferPointer) -> [Float] in
                let buffer = ptr.bindMemory(to: Float.self)
                return Array(buffer)
            }

            // Perform transcription
            let transcriptionResult = try await manager.transcribe(floats, source: .microphone)

            // Create result object
            result = TranscriptionResult(
                text: transcriptionResult.text,
                confidence: Double(transcriptionResult.confidence)
            )
        } catch {
            print("Transcription failed: \(error.localizedDescription)")
            result = nil
        }
        semaphore.signal()
    }

    semaphore.wait()
    return result
}

// MARK: - Model management functions

@_cdecl("fluid_asr_check_models_exist")
public func fluidAsrCheckModelsExist() -> Bool {
    let baseCacheDir = AsrModels.defaultCacheDirectory().deletingLastPathComponent()
    let v3CacheDir = baseCacheDir.appendingPathComponent("parakeet-tdt-0.6b-v3-coreml")

    return FileManager.default.fileExists(atPath: v3CacheDir.path)
}

@_cdecl("fluid_asr_get_model_path")
public func fluidAsrGetModelPath() -> SRString {
    let baseCacheDir = AsrModels.defaultCacheDirectory().deletingLastPathComponent()
    return SRString(baseCacheDir.path)
}

// MARK: - Cleanup

@_cdecl("fluid_asr_cleanup")
public func fluidAsrCleanup() {
    asrState.asrManager = nil
    asrState.models = nil
    asrState.isInitialized = false
    print("FluidAudio ASR cleaned up")
}
