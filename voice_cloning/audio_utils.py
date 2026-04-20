import os
import numpy as np
import soundfile as sf
import librosa

TARGET_SR = 16_000 
MIN_DURATION = 2.0 


def load_audio(path):
    """Load an audio file, convert to mono, and resample to 16 kHz.

    Args:
        path: Path to the audio file.

    Returns:
        Tuple of (audio_array, sample_rate).

    Raises:
        FileNotFoundError: If the file doesn't exist.
        ValueError: If the clip is too short.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")

    audio, sr = sf.read(path, dtype="float32")

    if audio.ndim > 1:
        audio = audio.mean(axis=1)

    if sr != TARGET_SR:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=TARGET_SR)
        sr = TARGET_SR

    duration = len(audio) / sr
    if duration < MIN_DURATION:
        raise ValueError(
            f"Audio too short ({duration:.1f}s). Need at least {MIN_DURATION}s."
        )

    return audio, sr


def save_audio(audio, sr, path):
    """Save an audio array to a .wav file.

    Args:
        audio: 1D numpy array of audio samples.
        sr: Sample rate.
        path: Where to save the file.

    Returns:
        Absolute path of the saved file.
    """
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    sf.write(path, audio, sr)
    return os.path.abspath(path)


def denoise_audio(audio, sr):
    """Clean up background noise from an audio signal.

    Args:
        audio: 1D numpy array of audio samples.
        sr: Sample rate of the audio.

    Returns:
        Denoised audio as a 1D numpy array.
    """
    import noisereduce as nr
    return nr.reduce_noise(y=audio, sr=sr, stationary=True, prop_decrease=0.75)


def get_audio_info(path):
    """Get basic info about an audio file without loading it fully.

    Args:
        path: Path to the audio file.

    Returns:
        Dict with sample_rate, duration_seconds, and channels.
    """
    info = sf.info(path)
    return {
        "sample_rate":      info.samplerate,
        "duration_seconds": round(info.duration, 3),
        "channels":         info.channels,
    }


def check_files_exist(paths):
    """Make sure all paths in a list actually exist.

    Args:
        paths: List of file paths to check.

    Raises:
        ValueError: If the list is empty.
        FileNotFoundError: If any path is missing.
    """
    if not paths:
        raise ValueError("Need at least one audio file.")

    for p in paths:
        if not os.path.exists(p):
            raise FileNotFoundError(f"File not found: {p}")
