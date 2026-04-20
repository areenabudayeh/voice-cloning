from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.routes import api_router
from backend.schemas import HealthResponse
from voice_cloning.cloner import load_model
from voice_cloning.evaluator import load_whisper


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, clean up on shutdown."""
    # startup
    settings.ensure_dirs()

    app.state.tts_model     = load_model(use_gpu=settings.use_gpu)
    app.state.whisper_model = load_whisper(model_size=settings.whisper_size)
    app.state.models_loaded = True

    print("All models ready. Server is up.")
    yield

    # shutdown
    app.state.models_loaded = False
    print("Shutting down.")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health():
    """Quick check that the server is up and models are loaded."""
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        models_loaded=getattr(app.state, "models_loaded", False),
    )
