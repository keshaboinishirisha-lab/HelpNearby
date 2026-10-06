from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.models import Match, Donation, Request, User, Notification
from backend.schemas import MatchResponse, MatchAction
from backend.services.handover_service import create_handover_for_match

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.get("", response_model=List[MatchResponse])
def get_user_matches(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Match).join(Donation).join(Request).filter(
        (Donation.donor_id == current_user.id) | (Request.requester_id == current_user.id)
    )
    if status_filter:
        query = query.filter(Match.status == status_filter)

    matches = query.order_by(Match.total_score.desc(), Match.created_at.desc()).all()
    return matches


@router.get("/{id}", response_model=MatchResponse)
def get_match_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    is_participant = (
        match.donation.donor_id == current_user.id
        or match.request.requester_id == current_user.id
        or current_user.role == "admin"
        or match.volunteer_id == current_user.id
    )
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized to view this match")

    return match


@router.post("/{id}/action", response_model=MatchResponse)
def act_on_match(
    id: int,
    action_in: MatchAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    is_donor = match.donation.donor_id == current_user.id
    is_requester = match.request.requester_id == current_user.id

    if not is_donor and not is_requester and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to act on this match")

    action = action_in.action.lower()

    if action == "decline":
        match.status = "declined"
        db.commit()
        db.refresh(match)
        return match

    if action == "accept":
        if is_requester:
            if match.status == "suggested":
                match.status = "accepted_by_recipient"
                # Notify donor
                n = Notification(
                    user_id=match.donation.donor_id,
                    title="Recipient Accepted Your Match!",
                    message=f"The recipient of '{match.request.title}' accepted your match. Confirm to schedule safe handover.",
                    type="match_accepted",
                    link=f"/matches/{match.id}"
                )
                db.add(n)
            elif match.status == "accepted_by_donor":
                # Both accepted -> confirm & create handover!
                match.status = "confirmed"
                create_handover_for_match(
                    db=db,
                    match=match,
                    safe_pickup_location="Nearest Community Center (Public Lobby)"
                )

        elif is_donor:
            if match.status == "suggested":
                match.status = "accepted_by_donor"
                # Notify recipient
                n = Notification(
                    user_id=match.request.requester_id,
                    title="Donor Confirmed Match!",
                    message=f"The donor of '{match.donation.title}' accepted your match. Confirm to schedule pickup.",
                    type="match_accepted",
                    link=f"/matches/{match.id}"
                )
                db.add(n)
            elif match.status == "accepted_by_recipient":
                # Both accepted -> confirm & create handover!
                match.status = "confirmed"
                create_handover_for_match(
                    db=db,
                    match=match,
                    safe_pickup_location="Nearest Community Center (Public Lobby)"
                )

        db.commit()
        db.refresh(match)
        return match

    raise HTTPException(status_code=400, detail=f"Unsupported action: {action}")
