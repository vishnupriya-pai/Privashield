"""
PrivaShield auth API — run locally:
  cd backend
  pip install -r requirements.txt
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel, Field

# Must match the OAuth 2.0 Web client ID used in the mobile app (webClientId).
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


class GoogleAuthRequest(BaseModel):
    """Google Sign-In id_token from the client."""

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
        raise HTTPException(
            status_code=401,
            detail=f"Invalid Google id_token: {exc}",
        ) from exc

    user = GoogleAuthUser(
        sub=idinfo.get("sub", ""),
        email=idinfo.get("email"),
        name=idinfo.get("name"),
        picture=idinfo.get("picture"),
    )

    if not user.sub:
        raise HTTPException(status_code=401, detail="Token missing subject (sub) claim.")

    return GoogleAuthSuccessResponse(status="success", user=user)
