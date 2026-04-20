import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice_cloning.cloner    import load_model, clone_voice, SUPPORTED_LANGS
from voice_cloning.evaluator import load_whisper, get_speaker_similarity, get_wer, get_quality_label
from voice_cloning.audio_utils import get_audio_info


REFERENCE_AUDIO = "storage/uploads/sample_1_en.wav"
TEXT = "Hello, this is a test of the voice cloning pipeline."
LANGUAGE = "en"
OUTPUT_PATH = "storage/outputs/test_output.wav"

#Run the pipeline 
def main():
    print("\nVoice Cloning Pipeline Test \n")

    # check that reference file exists
    if not os.path.exists(REFERENCE_AUDIO):
        print(f"ERROR: Reference audio not found at '{REFERENCE_AUDIO}'")
        print("Please update the REFERENCE_AUDIO path at the top of this file.")
        return

    # show reference audio info
    info = get_audio_info(REFERENCE_AUDIO)
    print(f"Reference audio: {REFERENCE_AUDIO}")
    print(f"  Duration : {info['duration_seconds']}s")
    print(f"  Sample rate: {info['sample_rate']} Hz")
    print(f"\nText     : {TEXT}")
    print(f"Language : {LANGUAGE}")
    print()

    # load models
    print("Loading models...")
    tts_model     = load_model(use_gpu=False)
    whisper_model = load_whisper(model_size="base")
    print()

    # clone
    print("Cloning voice...")
    os.makedirs("storage/outputs", exist_ok=True)
    result_path = clone_voice(
        model=tts_model,
        text=TEXT,
        ref_paths=[REFERENCE_AUDIO],
        language=LANGUAGE,
        output_path=OUTPUT_PATH,
    )
    print(f"Cloned audio saved to: {result_path}")
    print()

    #evaluate
    print("Running evaluation...")

    cosine = get_speaker_similarity(
    xtts_model=tts_model,
    ref_audio_paths=[REFERENCE_AUDIO],
    cloned_audio_path=result_path,
)

    wer_score, transcription = get_wer(
        whisper_model=whisper_model,
        target_text=TEXT,
        cloned_audio_path=result_path,
        lang=LANGUAGE,
    )

    label = get_quality_label(cosine)

    print("\nResults ")
    print(f"Cosine Similarity : {cosine:.4f} ({cosine * 100:.1f}%) — {label}")
    print(f"Word Error Rate   : {wer_score:.4f} ({wer_score * 100:.1f}%)")
    print(f"Transcription     : {transcription}")


if __name__ == "__main__":
    main()