from pathlib import Path
from pydantic_settings import BaseSettings


ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """App configuration loaded from .env file."""

    app_name:    str  = "Voice Cloning API" 
    app_version: str  = "1.0.0"
    debug:       bool = False

    upload_dir: Path = ROOT / "storage" / "uploads"
    output_dir: Path = ROOT / "storage" / "outputs"

    max_upload_mb: int = 25

    # set to true if you have a GPU
    use_gpu: bool = False

    whisper_size: str = "large"
    allowed_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_file          = ROOT / ".env"
        env_file_encoding = "utf-8"
        case_sensitive    = False

    def ensure_dirs(self):
        """Create storage folders if they don't exist yet."""
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    @property
    def max_upload_bytes(self):
        """Upload size limit in bytes."""
        return self.max_upload_mb * 1024 * 1024

settings = Settings()
