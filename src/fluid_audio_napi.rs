use napi::bindgen_prelude::*;
use napi_derive::napi;

#[cfg(target_os = "macos")]
use crate::macos::fluid_audio::FluidASR;

// MARK: - ASR Service

#[napi]
pub struct AsrService {
    #[cfg(target_os = "macos")]
    inner: Option<FluidASR>,
}

#[napi]
impl AsrService {
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        Ok(Self {
            #[cfg(target_os = "macos")]
            inner: Some(FluidASR::new()),
            #[cfg(not(target_os = "macos"))]
            inner: None,
        })
    }

    /// Initialize ASR service with multilingual models (v3 - 25 languages)
    #[napi]
    pub async fn initialize(&self) -> Result<()> {
        #[cfg(target_os = "macos")]
        {
            if let Some(ref asr) = self.inner {
                asr.initialize().await
                    .map_err(|e| Error::from_reason(e))?;
                Ok(())
            } else {
                Err(Error::from_reason("ASR service not available"))
            }
        }
        #[cfg(not(target_os = "macos"))]
        {
            Err(Error::from_reason("ASR only available on macOS"))
        }
    }

    /// Check if models exist on disk
    #[napi]
    pub fn models_exist() -> Result<bool> {
        #[cfg(target_os = "macos")]
        {
            Ok(FluidASR::models_exist())
        }
        #[cfg(not(target_os = "macos"))]
        {
            Ok(false)
        }
    }

    /// Get the model cache directory path
    #[napi]
    pub fn get_model_path() -> Result<String> {
        #[cfg(target_os = "macos")]
        {
            Ok(FluidASR::get_model_path())
        }
        #[cfg(not(target_os = "macos"))]
        {
            Err(Error::from_reason("ASR only available on macOS"))
        }
    }

    /// Transcribe audio samples (must be 16kHz mono float32)
    #[napi]
    pub async fn transcribe(&self, samples: Float32Array) -> Result<TranscriptionResult> {
        #[cfg(target_os = "macos")]
        {
            if let Some(ref asr) = self.inner {
                let (text, confidence) = asr.transcribe(samples.to_vec()).await
                    .map_err(|e| Error::from_reason(e))?;
                Ok(TranscriptionResult { text, confidence })
            } else {
                Err(Error::from_reason("ASR service not available"))
            }
        }
        #[cfg(not(target_os = "macos"))]
        {
            Err(Error::from_reason("ASR only available on macOS"))
        }
    }
}

#[napi(object)]
pub struct TranscriptionResult {
    pub text: String,
    pub confidence: f64,
}

// MARK: - Audio Utilities

#[napi]
/// Convert audio buffer to 16kHz mono float32 samples for FluidAudio processing
pub fn resample_to_16khz_mono(samples: Float32Array, source_sample_rate: f64) -> Result<Float32Array> {
    let input = samples.to_vec();

    if source_sample_rate == 16000.0 {
        // Already at target sample rate
        return Ok(Float32Array::new(input));
    }

    // Simple linear interpolation resampling
    let ratio = 16000.0 / source_sample_rate;
    let output_len = (input.len() as f64 * ratio) as usize;
    let mut output = Vec::with_capacity(output_len);

    for i in 0..output_len {
        let src_pos = i as f64 / ratio;
        let idx = src_pos as usize;
        let frac = src_pos - idx as f64;

        if idx + 1 < input.len() {
            let a = input[idx];
            let b = input[idx + 1];
            output.push(a + (b - a) * frac as f32);
        } else if idx < input.len() {
            output.push(input[idx]);
        } else {
            output.push(0.0);
        }
    }

    Ok(Float32Array::new(output))
}
