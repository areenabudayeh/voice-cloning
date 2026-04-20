from fastapi import APIRouter
from backend.routes import upload, clone, evaluate

api_router = APIRouter()
api_router.include_router(upload.router)
api_router.include_router(clone.router)
api_router.include_router(evaluate.router)
