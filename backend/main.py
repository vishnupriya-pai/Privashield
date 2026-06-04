"""
PrivaShield API — hardened backend
  Rate-limited, magic-byte validated, CORS-restricted, security-headered.
"""

import base64
import io
import os
import time
from collections import defaultdict
from threading import Lock

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from PIL import Image
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# ── Config ────────────────────────────────────────────────────────────────────

GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "1077337845085-rjlu5q5jlou94s8hmlc41csm3k2e7pqs.apps.googleusercontent.com",
)

MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB

# Allowed image magic bytes  {prefix: label}
IMAGE_SIGNATURES: dict[bytes, str] = {
    b"\xff\xd8\xff": "JPEG",
    b"\x89PNG\r\n\x1a\n": "PNG",
    b"GIF87a": "GIF",
    b"GIF89a": "GIF",
    b"RIFF": "WEBP",  # RIFF....WEBP — checked further below
}

# CORS: allow Replit dev domain + localhost for development
_REPLIT_DOMAIN = os.getenv("REPLIT_DEV_DOMAIN", "")
ALLOWED_ORIGINS: list[str] = [
    "http://localhost:5000",
    "http://localhost:3000",
]
if _REPLIT_DOMAIN:
    ALLOWED_ORIGINS.append(f"https://{_REPLIT_DOMAIN}")

# ── Rate limiter ───────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app = FastAPI(title="PrivaShield API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware ─────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=600,
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cache-Control"] = "no-store"
    return response


# ── Helpers ────────────────────────────────────────────────────────────────────

def validate_image_bytes(data: bytes) -> str:
    """Return image format string or raise HTTPException."""
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit.")
    if len(data) < 12:
        raise HTTPException(status_code=400, detail="File too small to be a valid image.")

    for magic, fmt in IMAGE_SIGNATURES.items():
        if data.startswith(magic):
            if fmt == "WEBP":
                # RIFF....WEBP — bytes 8-12 must be b'WEBP'
                if data[8:12] != b"WEBP":
                    continue
            return fmt

    raise HTTPException(
        status_code=415,
        detail="Unsupported file type. Only JPEG, PNG, GIF, and WebP are accepted.",
    )


# ── Auth ───────────────────────────────────────────────────────────────────────

class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., min_length=20, max_length=4096)


class GoogleAuthUser(BaseModel):
    sub: str
    email: str | None = None
    name: str | None = None
    picture: str | None = None


class GoogleAuthSuccessResponse(BaseModel):
    status: str = "success"
    user: GoogleAuthUser


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/google", response_model=GoogleAuthSuccessResponse)
@limiter.limit("5/minute")
def verify_google_token(request: Request, body: GoogleAuthRequest):
    try:
        idinfo = id_token.verify_oauth2_token(
            body.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired Google token.") from exc

    # Enforce token not expired (verify_oauth2_token already checks, belt-and-suspenders)
    now = int(time.time())
    if idinfo.get("exp", 0) < now:
        raise HTTPException(status_code=401, detail="Token has expired.")

    user = GoogleAuthUser(
        sub=idinfo.get("sub", ""),
        email=idinfo.get("email"),
        name=idinfo.get("name"),
        picture=idinfo.get("picture"),
    )
    if not user.sub:
        raise HTTPException(status_code=401, detail="Token missing subject claim.")
    return GoogleAuthSuccessResponse(status="success", user=user)


# ── Adversarial noise ──────────────────────────────────────────────────────────

def apply_adversarial_noise(img_array: np.ndarray, intensity: float) -> np.ndarray:
    """FGSM-style adversarial noise: gradient sign + FFT phase perturbation + Gaussian."""
    epsilon = max(1.0, min(intensity, 100.0) / 100.0 * 32.0)
    img_f = img_array.astype(np.float32)

    # 1. FGSM sign attack
    grad_x = np.roll(img_f, -1, axis=1) - np.roll(img_f, 1, axis=1)
    grad_y = np.roll(img_f, -1, axis=0) - np.roll(img_f, 1, axis=0)
    fgsm_noise = np.sign(grad_x + grad_y) * (epsilon * 0.45)

    # 2. Frequency-domain phase perturbation (FFT)
    freq_noise = np.zeros_like(img_f)
    rng_freq = np.random.default_rng()
    for c in range(img_f.shape[2]):
        fft = np.fft.fft2(img_f[:, :, c])
        mask = rng_freq.random(fft.shape) < 0.30
        phase_shift = (
            rng_freq.uniform(-np.pi, np.pi, fft.shape)
            * (intensity / 100.0)
            * 0.25
            * mask
        )
        perturbed = np.abs(fft) * np.exp(1j * (np.angle(fft) + phase_shift))
        delta = np.fft.ifft2(perturbed).real - img_f[:, :, c]
        freq_noise[:, :, c] = np.clip(delta, -epsilon * 0.35, epsilon * 0.35)

    # 3. Gaussian noise floor
    rng_gauss = np.random.default_rng()
    gaussian = rng_gauss.normal(0.0, epsilon * 0.12, img_f.shape)

    protected = np.clip(img_f + fgsm_noise + freq_noise + gaussian, 0, 255).astype(np.uint8)
    return protected


@app.post("/api/protect")
@limiter.limit("20/minute")
async def protect_image(
    request: Request,
    file: UploadFile = File(...),
    intensity: float = Form(default=50.0),
):
    # 1. Read and validate file
    contents = await file.read()
    validate_image_bytes(contents)

    # 2. Clamp intensity strictly
    intensity = max(0.0, min(float(intensity), 100.0))

    # 3. Decode and cap resolution
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not decode image: {exc}") from exc

    if max(img.size) > 1200:
        img.thumbnail((1200, 1200), Image.LANCZOS)

    # 4. Apply noise (strips all EXIF — PIL convert("RGB") already does this)
    protected_array = apply_adversarial_noise(np.array(img), intensity)

    # 5. Encode output as PNG (no metadata)
    out = io.BytesIO()
    result_img = Image.fromarray(protected_array)
    result_img.save(out, format="PNG", optimize=False)
    b64 = base64.b64encode(out.getvalue()).decode()

    return JSONResponse(
        {"image": b64, "format": "png"},
        headers={"Content-Security-Policy": "default-src 'none'"},
    )
