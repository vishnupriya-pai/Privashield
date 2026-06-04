"""
PrivaShield API — auth + adversarial image protection
  cd backend
  pip install -r requirements.txt
  uvicorn main:app --reload --host 0.0.0.0 --port 8001
"""

import base64
import io
import os

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from PIL import Image
from pydantic import BaseModel, Field

GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "1077337845085-rjlu5q5jlou94s8hmlc41csm3k2e7pqs.apps.googleusercontent.com",
)

app = FastAPI(title="PrivaShield API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth ──────────────────────────────────────────────────────────────────────

class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., description="JWT id_token from Google Sign-In")


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
def verify_google_token(body: GoogleAuthRequest):
    try:
        idinfo = id_token.verify_oauth2_token(
            body.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Google id_token: {exc}") from exc

    user = GoogleAuthUser(
        sub=idinfo.get("sub", ""),
        email=idinfo.get("email"),
        name=idinfo.get("name"),
        picture=idinfo.get("picture"),
    )
    if not user.sub:
        raise HTTPException(status_code=401, detail="Token missing subject (sub) claim.")
    return GoogleAuthSuccessResponse(status="success", user=user)


# ── Adversarial noise ─────────────────────────────────────────────────────────

def apply_adversarial_noise(img_array: np.ndarray, intensity: float) -> np.ndarray:
    """
    FGSM-style gradient descent adversarial noise (numpy, no ML framework).

    Three components:
      1. Finite-difference pseudo-gradient sign attack (FGSM principle)
      2. Frequency-domain phase perturbation via FFT
      3. Gaussian noise floor

    epsilon scales linearly with intensity (max 32 pixel units at 100%).
    """
    epsilon = max(1.0, intensity / 100.0 * 32.0)
    img_f = img_array.astype(np.float32)

    # 1. FGSM sign attack: sign of spatial gradient
    grad_x = np.roll(img_f, -1, axis=1) - np.roll(img_f, 1, axis=1)
    grad_y = np.roll(img_f, -1, axis=0) - np.roll(img_f, 1, axis=0)
    fgsm_noise = np.sign(grad_x + grad_y) * (epsilon * 0.45)

    # 2. Frequency-domain phase perturbation
    freq_noise = np.zeros_like(img_f)
    rng_freq = np.random.default_rng(seed=7)
    for c in range(img_f.shape[2]):
        fft = np.fft.fft2(img_f[:, :, c])
        mask = rng_freq.random(fft.shape) < 0.30
        phase_shift = rng_freq.uniform(-np.pi, np.pi, fft.shape) * (intensity / 100.0) * 0.25 * mask
        perturbed = np.abs(fft) * np.exp(1j * (np.angle(fft) + phase_shift))
        delta = np.fft.ifft2(perturbed).real - img_f[:, :, c]
        freq_noise[:, :, c] = np.clip(delta, -epsilon * 0.35, epsilon * 0.35)

    # 3. Gaussian noise floor
    rng_gauss = np.random.default_rng()
    gaussian = rng_gauss.normal(0.0, epsilon * 0.12, img_f.shape)

    protected = np.clip(img_f + fgsm_noise + freq_noise + gaussian, 0, 255).astype(np.uint8)
    return protected


@app.post("/api/protect")
async def protect_image(
    file: UploadFile = File(...),
    intensity: float = Form(default=50.0),
):
    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}") from exc

    # Cap resolution to avoid memory issues
    if max(img.size) > 1200:
        img.thumbnail((1200, 1200), Image.LANCZOS)

    protected_array = apply_adversarial_noise(np.array(img), float(intensity))

    out = io.BytesIO()
    Image.fromarray(protected_array).save(out, format="PNG")
    b64 = base64.b64encode(out.getvalue()).decode()

    return JSONResponse({"image": b64, "format": "png"})
