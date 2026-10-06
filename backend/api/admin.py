from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.core.database import get_db
from backend.core.deps import require_role
from backend.models import User, Donation, Request, Match, Handover, Report, ImpactMetric
from backend.schemas import UserResponse

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    _admin = Depends(require_role("admin"))
):
    return {
        "users_count": db.query(User).count(),
        "donations_count": db.query(Donation).count(),
        "requests_count": db.query(Request).count(),
        "matches_count": db.query(Match).count(),
        "handovers_completed": db.query(Handover).filter(Handover.status == "completed").count(),
        "pending_reports_count": db.query(Report).filter(Report.status == "pending").count()
    }


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    _admin = Depends(require_role("admin"))
):
    return db.query(User).order_by(User.created_at.desc()).limit(100).all()


@router.put("/users/{id}/verify", response_model=UserResponse)
def verify_user_badge(
    id: int,
    verification_status: str,  # verified, rejected, pending
    db: Session = Depends(get_db),
    _admin = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.verification_status = verification_status
    if verification_status == "verified":
        user.trust_score = min(100.0, user.trust_score + 15.0)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{id}/status", response_model=UserResponse)
def toggle_user_active(
    id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    _admin = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user
