from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.core.database import get_db
from backend.models import User, Request, Donation
from backend.schemas import UserResponse, RequestPublicResponse

router = APIRouter(prefix="/organizations", tags=["Organizations & NGOs"])


@router.get("", response_model=List[UserResponse])
def get_verified_organizations(db: Session = Depends(get_db)):
    """Lists community organizations, shelters, and NGOs."""
    return db.query(User).filter(
        User.role == "ngo",
        User.is_active == True
    ).all()


@router.get("/{id}/requests", response_model=List[RequestPublicResponse])
def get_organization_requests(id: int, db: Session = Depends(get_db)):
    org = db.query(User).filter(User.id == id, User.role == "ngo").first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    requests = db.query(Request).filter(
        Request.requester_id == org.id,
        Request.status == "open"
    ).all()
    results = []
    for r in requests:
        resp = RequestPublicResponse.from_orm(r)
        resp.requester_name = org.organization_name or org.name
        resp.requester_trust_score = org.trust_score
        results.append(resp)
    return results
