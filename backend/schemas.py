from pydantic import BaseModel, Field, field_validator
from voice_cloning.cloner import SUPPORTED_LANGS


class UploadResponse(BaseModel):
    """Returned after a successful file upload."""
    file_id:          str
    filename:         str
    duration_seconds: float
    message:          str = "Uploaded successfully."


class CloneRequest(BaseModel):
    """Body sent to POST /clone."""
    text:     str       = Field(..., min_length=1, max_length=2000)
    language: str       = Field(..., description="'en' or 'ar'")
    file_ids: list[str] = Field(..., min_length=1)

    @field_validator("language")
    @classmethod
    def check_lang(cls, v):
        """Reject unknown language codes early."""
        if v not in SUPPORTED_LANGS:
            raise ValueError(f"'{v}' not supported. Use: {sorted(SUPPORTED_LANGS)}")
        return v


class CloneResponse(BaseModel):
    """Returned after a successful cloning."""
    clone_id: str
    language: str
    message:  str = "Cloned successfully."


class EvaluateRequest(BaseModel):
    """Body sent to POST /evaluate."""
    clone_id:     str
    ref_file_ids: list[str] = Field(..., min_length=1)
    target_text:  str       = Field(..., min_length=1)
    language:     str       = "en" 


class EvaluateResponse(BaseModel):
    """Evaluation results returned to the frontend."""
    clone_id:          str
    cosine_similarity: float | None
    word_error_rate:   float | None
    transcription:     str
    quality_label:     str
    error:             str | None


class HealthResponse(BaseModel):
    """Simple health check response."""
    status:        str
    version:       str
    models_loaded: bool
