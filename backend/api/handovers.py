from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.models import Handover, User, Match
from backend.schemas import HandoverResponse, HandoverSchedule, HandoverVerify
from backend.services.handover_service import verify_and_complete_handover
from backend.services.geospatial import get_safe_pickup_points

router = APIRouter(prefix="/handovers", tags=["Handovers"])


@router.get("/{id}", response_model=HandoverResponse)
def get_handover(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    handover = db.query(Handover).filter(Handover.id == id).first()
    if not handover:
        # Also allow finding by match_id if passed
        handover = db.query(Handover).filter(Handover.match_id == id).first()

    if not handover:
        raise HTTPException(status_code=404, detail="Handover record not found")

    is_donor = handover.donor_id == current_user.id
    is_recipient = handover.recipient_id == current_user.id
    is_volunteer = handover.volunteer_id == current_user.id
    is_admin = current_user.role == "admin"

    if not (is_donor or is_recipient or is_volunteer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to view this handover")

    resp = HandoverResponse.model_validate(handover)
    if handover.match and handover.match.donation:
        resp.donation_title = handover.match.donation.title
    
    donor = db.query(User).filter(User.id == handover.donor_id).first()
    recipient = db.query(User).filter(User.id == handover.recipient_id).first()
    resp.donor_name = donor.name if donor else None
    resp.recipient_name = recipient.name if recipient else None

    # OTP Secret Protection:
    # Recipient or assigned volunteer sees the OTP to show to donor during physical meetup.
    # Donor CANNOT see the OTP until completion.
    if is_recipient or is_volunteer or is_admin or handover.status == "completed":
        resp.verification_code = handover.verification_code
    else:
        resp.verification_code = None

    return resp


@router.get("/{id}/safe-points")
def get_pickup_recommendations(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    handover = db.query(Handover).filter(Handover.id == id).first()
    if not handover:
        handover = db.query(Handover).filter(Handover.match_id == id).first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover not found")

    # Get approximate centroid
    approx_lat = 37.7749
    approx_lng = -122.4194
    if handover.match and handover.match.donation:
        approx_lat = handover.match.donation.approx_lat
        approx_lng = handover.match.donation.approx_lng

    points = get_safe_pickup_points(approx_lat, approx_lng)
    return {"safe_points": points}


@router.post("/{id}/schedule", response_model=HandoverResponse)
def schedule_handover(
    id: int,
    sched_in: HandoverSchedule,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    handover = db.query(Handover).filter(Handover.id == id).first()
    if not handover:
        handover = db.query(Handover).filter(Handover.match_id == id).first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover not found")

    if current_user.id not in [handover.donor_id, handover.recipient_id] and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to schedule this handover")

    handover.safe_pickup_location = sched_in.safe_pickup_location
    if sched_in.scheduled_time:
        handover.scheduled_time = sched_in.scheduled_time

    db.commit()
    db.refresh(handover)
    return get_handover(id=handover.id, current_user=current_user, db=db)


@router.post("/{id}/verify", response_model=HandoverResponse)
def verify_handover(
    id: int,
    verify_in: HandoverVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    handover = db.query(Handover).filter(Handover.id == id).first()
    if not handover:
        handover = db.query(Handover).filter(Handover.match_id == id).first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover not found")

    # Donor or volunteer performs verification by checking recipient's OTP
    is_authorized = (current_user.id in [handover.donor_id, handover.volunteer_id]) or current_user.role == "admin"
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Only the donor or assigned volunteer can verify the recipient's OTP")

    success = verify_and_complete_handover(
        db=db,
        handover=handover,
        input_code=verify_in.verification_code,
        verifying_user=current_user
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 6-digit verification code. Please check the code with the recipient."
        )

    return get_handover(id=handover.id, current_user=current_user, db=db)
