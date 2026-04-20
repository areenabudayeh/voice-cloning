from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from backend.config import settings
from backend.schemas import EvaluateRequest, EvaluateResponse
from voice_cloning.evaluator import  get_speaker_similarity, get_wer, get_quality_label

router = APIRouter(tags=["Evaluate"])


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(body: EvaluateRequest, request: Request):
    """
    Evaluate cloned audio (similarity, WER, transcription).
    """
    cloned_path   = _get_clone_path(body.clone_id)
    ref_paths     = _get_ref_paths(body.ref_file_ids)

    whisper_model = request.app.state.whisper_model
    xtts_model    = request.app.state.tts_model   

    error         = None
    cosine        = None
    wer           = None
    transcription = ""

    try:
        cosine = get_speaker_similarity(
            xtts_model=xtts_model,
            ref_audio_paths=[str(p) for p in ref_paths],
            cloned_audio_path=str(cloned_path),
        )
    except Exception as e:
        error = f"Speaker similarity failed: {e}"

    try:
        wer, transcription = get_wer(
            whisper_model, body.target_text, str(cloned_path), lang=body.language
        )
    except Exception as e:
        error = (error or "") + f" | WER failed: {e}"

    label = get_quality_label(cosine) if cosine is not None else "Unknown"

    return EvaluateResponse(
        clone_id=body.clone_id,
        cosine_similarity=cosine,
        word_error_rate=wer,
        transcription=transcription,
        quality_label=label,
        error=error,
    )


def _get_clone_path(clone_id):
    p = settings.output_dir / f"{clone_id}.wav"
    if not p.exists():
        raise HTTPException(status_code=404, detail=f"Cloned audio not found for '{clone_id}'.")
    return p


def _get_ref_paths(file_ids):
    paths = []
    for fid in file_ids:
        p = settings.upload_dir / f"{fid}.wav"
        if not p.exists():
            raise HTTPException(status_code=400, detail=f"Reference file not found: '{fid}'.")
        paths.append(p)
    return paths


