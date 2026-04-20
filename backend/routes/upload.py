import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.config import settings
from backend.schemas import UploadResponse
from voice_cloning.audio_utils import load_audio, save_audio, get_audio_info, TARGET_SR, denoise_audio

router = APIRouter(prefix="/upload", tags=["Upload"])

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"}


@router.post("", response_model=UploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    """Accept a reference audio file and store it after normalising to 16 kHz WAV.

    Args:
        file: The uploaded audio file from the form.

    Returns:
        UploadResponse with file_id and duration info.
    """
    _check_ext(file.filename)

    file_id   = str(uuid.uuid4())
    suffix    = Path(file.filename).suffix.lower()
    temp_path = settings.upload_dir / f"tmp_{file_id}{suffix}"
    wav_temp  = settings.upload_dir / f"tmp_{file_id}.wav"
    save_path = settings.upload_dir / f"{file_id}.wav"

    try:
        settings.upload_dir.mkdir(parents=True, exist_ok=True)

        with temp_path.open("wb") as f:
            shutil.copyfileobj(file.file, f)

        converted = _to_wav(temp_path, wav_temp)
        
        audio, sr = load_audio(str(converted))
        audio = denoise_audio(audio, sr)        
        save_audio(audio, TARGET_SR, str(save_path))


    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path.exists():
            temp_path.unlink()
        if wav_temp.exists():
            wav_temp.unlink()

    info = get_audio_info(str(save_path))

    return UploadResponse(
        file_id=file_id,
        filename=file.filename or "audio.wav",
        duration_seconds=info["duration_seconds"],
    )


def _check_ext(filename):
    """Raise 400 if the file extension is not supported.

    Args:
        filename: Original filename from the upload.
    """
    if not filename:
        raise HTTPException(status_code=400, detail="File has no name.")

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )


def _to_wav(source, destination):
    """Convert any audio file to WAV using pydub + ffmpeg.

    Args:
        source: Path to the original uploaded file.
        destination: Path to write the converted WAV.

    Returns:
        Path to the WAV file.

    Raises:
        ValueError: If conversion fails (usually means ffmpeg is not installed).
    """
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(str(source))
        audio.export(str(destination), format="wav")
        return destination
    except Exception as e:
        raise ValueError(
            f"Could not convert audio to WAV: {e}. "
            f"Make sure ffmpeg is installed on your system."
        )
