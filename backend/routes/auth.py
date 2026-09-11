"""
Auth routes — register, login, get current user.
Uses simple JWT-style token stored in a header for the capstone scope.
"""
import os
import hashlib
import hmac
import base64
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "capstone_dev_secret_change_in_prod")


# ── simple token helpers (no external jwt lib required) ──

def _hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${hashed.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt, hashed = stored.split("$")
        check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
        return hmac.compare_digest(check.hex(), hashed)
    except Exception:
        return False


def _create_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": (datetime.utcnow() + timedelta(days=7)).isoformat(),
    }
    data = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    sig = hmac.new(SECRET_KEY.encode(), data.encode(), hashlib.sha256).hexdigest()
    return f"{data}.{sig}"


def decode_token(token: str) -> dict:
    try:
        data, sig = token.rsplit(".", 1)
        expected = hmac.new(SECRET_KEY.encode(), data.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise ValueError("Invalid signature")
        payload = json.loads(base64.urlsafe_b64decode(data.encode()).decode())
        if datetime.fromisoformat(payload["exp"]) < datetime.utcnow():
            raise ValueError("Token expired")
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def get_current_user(
    authorization: str = None,
    db: Session = Depends(get_db),
) -> User:
    from fastapi import Header
    raise HTTPException(status_code=401, detail="Use get_current_user_dep instead")


# Dependency used by other routes
from fastapi import Header

def get_current_user_dep(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── routes ──

@router.post("/register", response_model=dict)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        password_hash=_hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = _create_token(user.id, user.email)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}


@router.post("/login", response_model=dict)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not _verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = _create_token(user.id, user.email)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user_dep)):
    return current_user
