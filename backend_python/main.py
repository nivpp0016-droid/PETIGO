from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend_python.config import CORS_ORIGINS, PORT
from backend_python.database import init_db
from backend_python.auth import get_current_user
from backend_python.routers import auth, boxes, otp, device

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    init_db()
    yield

app = FastAPI(
    title="Universal Smart Parcel Box API",
    description="High-performance Python FastAPI backend for IoT Universal Smart Parcel Box",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handlers for exact Node.js API error response parity
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": str(exc.detail)}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0]["msg"] if exc.errors() else "Validation error"
    return JSONResponse(
        status_code=400,
        content={"error": first_error, "details": exc.errors()}
    )

# Health check
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "server": "running",
        "project": "Universal Smart Parcel Box"
    }

# Protected route check
@app.get("/api/protected", tags=["Authentication"])
def protected_route(user: dict = Depends(get_current_user)):
    return {
        "message": "Protected route accessed",
        "user": user
    }

# Include routers
app.include_router(auth.router)
app.include_router(boxes.router)
app.include_router(otp.router)
app.include_router(device.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend_python.main:app", host="0.0.0.0", port=PORT, reload=True)
