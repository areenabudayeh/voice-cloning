import os
import torch
from TTS.api import TTS
from voice_cloning.audio_utils import check_files_exist


SUPPORTED_LANGS = {"en", "ar"}
MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2" 


def load_model(use_gpu=None):
    """Load the XTTS v2 model and return it.

    Args:
        use_gpu: True/False or None (auto-detect CUDA).

    Returns:
        Loaded TTS model object.
    """
    if use_gpu is None:
        use_gpu = torch.cuda.is_available()

    os.environ["COQUI_TOS_AGREED"] = "1"

    device = "cuda" if use_gpu else "cpu"
    print(f"Loading XTTS v2 on {device}...")

    model = TTS(MODEL_NAME, gpu=use_gpu)
    print("XTTS v2 ready.")

    return model


def clone_voice(model, text, ref_paths, language, output_path):
    """Run voice cloning and save the result to a file.

    Args:
        model: The loaded XTTS v2 model.
        text: Text to synthesise.
        ref_paths: List of reference audio paths .
        language: "en" or "ar".
        output_path: Where to save the generated audio.

    Returns:
        Absolute path to the saved audio file.

    Raises:
        ValueError: If text is empty or language is not supported.
        FileNotFoundError: If any reference file is missing.
    """
    if not text or not text.strip():
        raise ValueError("Text can't be empty.")

    if language not in SUPPORTED_LANGS:
        raise ValueError(f"Language '{language}' not supported. Use: {sorted(SUPPORTED_LANGS)}")

    check_files_exist(ref_paths)

    model.tts_to_file(
        text=text,
        speaker_wav=ref_paths,
        language=language,
        file_path=output_path,
    )

    return os.path.abspath(output_path)


def get_speaker_embedding(model, ref_paths):
    """Extract a voice identity vector from reference audio files.

    The evaluator uses this to compute cosine similarity.

    Args:
        model: The loaded XTTS v2 model.
        ref_paths: List of reference audio file paths.

    Returns:
        1D numpy array representing the speaker's voice.
    """
    import numpy as np

    check_files_exist(ref_paths)

    _, emb = model.synthesizer.tts_model.get_conditioning_latents(
        audio_path=ref_paths
    )
    return emb.detach().cpu().numpy().flatten()
