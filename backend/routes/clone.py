import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from backend.config import settings
from backend.schemas import CloneRequest, CloneResponse
from voice_cloning.cloner import clone_voice


router = APIRouter(tags=["Clone"])


@router.post("/clone", response_model=CloneResponse)
async def run_clone(body: CloneRequest, request: Request):
    """Clone the voice using XTTS v2 and save the result.

    Args:
        body: CloneRequest with text, language, and reference file IDs.
        request: FastAPI request — used to access the model from app.state.

    Returns:
        CloneResponse with a clone_id to fetch the audio.
    """
    ref_paths = _get_ref_paths(body.file_ids)

    clone_id    = str(uuid.uuid4())
    output_path = settings.output_dir / f"{clone_id}.wav"

    try:
        clone_voice(
            model=request.app.state.tts_model,
            text=body.text,
            ref_paths=[str(p) for p in ref_paths],
            language=body.language,
            output_path=str(output_path),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return CloneResponse(clone_id=clone_id, language=body.language)


@router.get("/audio/{clone_id}")
async def get_audio(clone_id: str):
    """Stream the generated audio file back to the browser.

    Args:
        clone_id: UUID from a previous /clone call.

    Returns:
        WAV file as a streaming response.
    """
    path = settings.output_dir / f"{clone_id}.wav"

    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Audio not found for '{clone_id}'.")

    return FileResponse(str(path), media_type="audio/wav")


def _get_ref_paths(file_ids):
    """Convert file_ids to full paths and verify they all exist.

    Args:
        file_ids: List of UUIDs from previous /upload calls.

    Returns:
        List of Path objects.

    Raises:
        HTTPException 400 if any file is missing.
    """
    paths = []
    for fid in file_ids:
        p = settings.upload_dir / f"{fid}.wav"
        if not p.exists():
            raise HTTPException(
                status_code=400,
                detail=f"Reference file not found for '{fid}'. Upload it first.",
            )
        paths.append(p)
    return paths
