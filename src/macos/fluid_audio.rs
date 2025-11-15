use swift_rs::{swift, Bool, Int, SRData, SRObject, SRString};
use std::sync::Arc;
use tokio::sync::Mutex;

// MARK: - Result Types

#[repr(C)]
pub struct TranscriptionResult {
    pub text: SRString,
    pub confidence: f64,
}

#[repr(C)]
pub struct FluidAudioError {
    pub message: SRString,
    pub code: Int,
}

// MARK: - Swift Function Declarations

// ASR functions
swift!(fn fluid_asr_initialize() -> Option<SRObject<FluidAudioError>>);
swift!(fn fluid_asr_is_initialized() -> Bool);
swift!(fn fluid_asr_transcribe(samples_data: SRData) -> Option<SRObject<TranscriptionResult>>);
swift!(fn fluid_asr_check_models_exist() -> Bool);
swift!(fn fluid_asr_get_model_path() -> SRString);
swift!(fn fluid_asr_cleanup());

// MARK: - Rust Wrapper Types

/// ASR Service wrapper for FluidAudio
pub struct FluidASR {
    initialized: Arc<Mutex<bool>>,
}

impl FluidASR {
    pub fn new() -> Self {
        Self {
            initialized: Arc::new(Mutex::new(false)),
        }
    }

    /// Initialize ASR with multilingual models (v3)
    pub async fn initialize(&self) -> Result<(), String> {
        // Extract error message BEFORE any await to avoid Send issues
        let error_message = {
            let result = unsafe { fluid_asr_initialize() };
            result.map(|error_obj| error_obj.message.to_string())
        };

        if let Some(error_msg) = error_message {
            return Err(error_msg);
        }

        let mut initialized = self.initialized.lock().await;
        *initialized = true;
        Ok(())
    }

    /// Check if models exist on disk
    pub fn models_exist() -> bool {
        unsafe { fluid_asr_check_models_exist() }
    }

    /// Get the model cache directory path
    pub fn get_model_path() -> String {
        unsafe { fluid_asr_get_model_path().to_string() }
    }

    /// Transcribe audio samples (16kHz mono float32)
    pub async fn transcribe(&self, samples: Vec<f32>) -> Result<(String, f64), String> {
        let initialized = self.initialized.lock().await;
        if !*initialized {
            return Err("ASR not initialized".to_string());
        }
        drop(initialized);

        // Convert Vec<f32> to bytes for SRData
        let byte_slice = unsafe {
            std::slice::from_raw_parts(
                samples.as_ptr() as *const u8,
                samples.len() * std::mem::size_of::<f32>(),
            )
        };
        let samples_data = SRData::from(byte_slice);

        let result = unsafe { fluid_asr_transcribe(samples_data) };

        match result {
            Some(obj) => Ok((obj.text.to_string(), obj.confidence)),
            None => Err("Transcription returned no result".to_string()),
        }
    }
}

impl Drop for FluidASR {
    fn drop(&mut self) {
        unsafe { fluid_asr_cleanup() }
    }
}

// MARK: - Tests

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_asr_initialization() {
        let asr = FluidASR::new();
        // Only run if models exist to avoid downloading during tests
        if FluidASR::models_exist() {
            let result = asr.initialize().await;
            assert!(result.is_ok());
        }
    }

    #[test]
    fn test_model_path() {
        let path = FluidASR::get_model_path();
        assert!(!path.is_empty());
    }
}
