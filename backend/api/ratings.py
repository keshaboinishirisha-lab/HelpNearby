from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.models import Rating, Handover, User
from backend.schemas import RatingCreate, RatingResponse
from backend.services.trust_scorer import compute_trust_score

router = APIRouter(prefix="/ratings", tags=["Ratings"])


@router.post("", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def create_rating(
    rate_in: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    handover = db.query(Handover).filter(Handover.id == rate_in.handover_id).first()
    if not handover:
        handover = db.query(Handover).filter(Handover.match_id == rate_in.handover_id).first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover not found")

    if handover.status != "completed":
        raise HTTPException(status_code=400, detail="Ratings can only be submitted after a completed handover")

    # Verify participation
    if current_user.id not in [handover.donor_id, handover.recipient_id, handover.volunteer_id]:
        raise HTTPException(status_code=403, detail="You did not participate in this handover")

    # Check for duplicate
    existing = db.query(Rating).filter(
        Rating.handover_id == rate_in.handover_id,
        Rating.rater_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already rated this handover")

    rating = Rating(
        handover_id=rate_in.handover_id,
        rater_id=current_user.id,
        rated_user_id=rate_in.rated_user_id,
        rating=rate_in.rating,
        feedback=rate_in.feedback,
        punctuality=rate_in.punctuality,
        item_accuracy=rate_in.item_accuracy,
        kindness=rate_in.kindness
    )
    db.add(rating)
    db.commit()

    # Recalculate recipient/rated user's trust score
    rated_user = db.query(User).filter(User.id == rate_in.rated_user_id).first()
    if rated_user:
        user_ratings = db.query(Rating).filter(Rating.rated_user_id == rated_user.id).all()
        avg_rating = sum(r.rating for r in user_ratings) / len(user_ratings) if user_ratings else 5.0
        
        # Count completed handovers
        completed_count = db.query(Handover).filter(
            (Handover.donor_id == rated_user.id) | (Handover.recipient_id == rated_user.id),
            Handover.status == "completed"
        ).count()

        rated_user.trust_score = compute_trust_score(
            verification_status=rated_user.verification_status,
            completed_handovers=completed_count,
            average_rating=avg_rating,
            total_ratings_count=len(user_ratings)
        )
        db.commit()

    db.refresh(rating)
    return rating


@router.get("/user/{user_id}", response_model=List[RatingResponse])
def get_user_ratings(user_id: int, db: Session = Depends(get_db)):
    return db.query(Rating).filter(Rating.rated_user_id == user_id).order_by(Rating.created_at.desc()).all()
