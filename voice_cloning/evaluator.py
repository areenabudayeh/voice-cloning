import re
import numpy as np
import whisper
from jiwer import wer as calc_wer
from voice_cloning.audio_utils import TARGET_SR


def load_whisper(model_size="large"):
    """Load a Whisper model.

    Args:
        model_size: Model size (tiny/base/small/medium/large).

    Returns:
        Loaded Whisper model.
    """
    print(f"Loading Whisper ({model_size})...")
    model = whisper.load_model(model_size)
    print("Whisper ready.")
    return model


def get_speaker_similarity(xtts_model, ref_audio_paths, cloned_audio_path):
    """Compare speaker identity using XTTS v2 conditioning latents.

    Args:
        xtts_model: The loaded XTTS v2 model (same one used for cloning).
        ref_audio_paths: List of reference audio paths.
        cloned_audio_path: Path to the cloned audio file.

    Returns:
        Cosine similarity score in [-1, 1]. Higher means more similar voice.
    """
    from voice_cloning.cloner import get_speaker_embedding
    ref_emb    = get_speaker_embedding(xtts_model, ref_audio_paths)
    cloned_emb = get_speaker_embedding(xtts_model, [cloned_audio_path])
    norms = np.linalg.norm(ref_emb) * np.linalg.norm(cloned_emb)
    return round(float(np.dot(ref_emb, cloned_emb) / norms), 4) if norms else 0.0


def normalize_english(text):
    """Lowercase, remove punctuation, and collapse spaces."""
    text = re.sub(r"[^\w\s]", " ", text.lower())
    return re.sub(r"\s+", " ", text).strip()


def normalize_arabic(text):
    """Normalize Arabic text for WER comparison.
    """
    text = re.sub(r'[\u0617-\u061A\u064B-\u065F\u0640]', '', text)  
    text = re.sub(r'[أإآٱ]', 'ا', text)   
    text = re.sub(r'ة', 'ه', text)          
    text = re.sub(r'ى', 'ي', text)          
    text = re.sub(r'ؤ', 'و', text)          
    text = re.sub(r'ئ', 'ي', text)         
    text = re.sub(r'[^\w\s\u0600-\u06FF]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def get_wer(whisper_model, target_text, cloned_audio_path, lang="auto"):
    """Transcribe cloned audio and compute Word Error Rate.

    Args:
        whisper_model: Loaded Whisper model.
        target_text: Ground-truth transcript.
        cloned_audio_path: Path to generated audio.
        lang: Language — "en", "ar", or "auto".

    Returns:
        Tuple of (wer_score, transcription).
    """
    kwargs = {"temperature": 0, "beam_size": 5}

    if lang == "ar":
        kwargs["language"] = "ar"
        kwargs["initial_prompt"] = "هذا نص عربي."
    elif lang == "en":
        kwargs["language"] = "en"

    transcription = whisper_model.transcribe(
        cloned_audio_path, **kwargs
    )["text"].strip()

    normalize = normalize_arabic if lang == "ar" else normalize_english
    score = calc_wer(normalize(target_text), normalize(transcription))
    return round(float(score), 4), transcription


def get_quality_label(cosine_score):
    """Return High / Moderate / Low based on cosine similarity."""
    if cosine_score >= 0.85: return "High"
    if cosine_score >= 0.70: return "Moderate"
    return "Low"