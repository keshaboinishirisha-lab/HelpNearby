import secrets
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from backend.models import Handover, Match, Donation, Request, ImpactMetric, User, Notification
from backend.core.config import settings


def generate_secure_otp(length: int = 6) -> str:
    """Generates a cryptographically strong numeric OTP code."""
    digits = "0123456789"
    return "".join(secrets.choice(digits) for _ in range(length))


def create_handover_for_match(
    db: Session,
    match: Match,
    safe_pickup_location: str,
    scheduled_time: Optional[datetime] = None
) -> Handover:
    """Initializes a safe handover session with a unique OTP."""
    otp_code = generate_secure_otp(settings.OTP_LENGTH)
    
    handover = Handover(
        match_id=match.id,
        donor_id=match.donation.donor_id,
        recipient_id=match.request.requester_id,
        volunteer_id=match.volunteer_id,
        safe_pickup_location=safe_pickup_location,
        scheduled_time=scheduled_time,
        verification_code=otp_code,
        status="scheduled"
    )
    db.add(handover)
    
    # Update statuses
    match.status = "confirmed"
    match.donation.status = "in_handover"
    match.request.status = "in_handover"
    
    # Notify both parties
    n_donor = Notification(
        user_id=match.donation.donor_id,
        title="Handover Scheduled!",
        message=f"Pickup scheduled at '{safe_pickup_location}'. When meeting, ask the recipient for their 6-digit verification code.",
        type="handover_scheduled",
        link=f"/handover/{match.id}"
    )
    n_recipient = Notification(
        user_id=match.request.requester_id,
        title="Handover Code Ready!",
        message=f"Your 6-digit verification code is ready. Show this code to the donor at '{safe_pickup_location}' to complete your pickup.",
        type="handover_scheduled",
        link=f"/handover/{match.id}"
    )
    db.add_all([n_donor, n_recipient])
    db.commit()
    db.refresh(handover)
    return handover


def verify_and_complete_handover(
    db: Session,
    handover: Handover,
    input_code: str,
    verifying_user: User
) -> bool:
    """
    Verifies the OTP code provided during the physical handover.
    Once verified:
    - Marks handover 'completed'
    - Marks donation 'completed'
    - Marks request 'fulfilled'
    - Updates donor & recipient trust score (+2.0 points for successful verified transaction)
    - Updates social impact counters (items reused, people helped, waste diverted)
    - Sends rating prompt notifications
    """
    if handover.status == "completed":
        return True

    # Check OTP (case-insensitive strip)
    if handover.verification_code.strip() != input_code.strip():
        return False

    handover.status = "completed"
    handover.completed_at = datetime.utcnow()
    handover.donor_confirmed = True
    handover.recipient_confirmed = True
    
    # Mark associated donation and request
    match = handover.match
    if match:
        match.status = "completed"
        if match.donation:
            match.donation.status = "completed"
        if match.request:
            match.request.status = "fulfilled"

    # Reward participants' trust scores
    donor = db.query(User).filter(User.id == handover.donor_id).first()
    recipient = db.query(User).filter(User.id == handover.recipient_id).first()
    if donor:
        donor.trust_score = min(100.0, (donor.trust_score or 75.0) + 2.5)
    if recipient:
        recipient.trust_score = min(100.0, (recipient.trust_score or 75.0) + 2.5)

    # Calculate and increment impact metrics
    category = match.donation.category if match and match.donation else None
    weight_kg = category.avg_weight_kg if category else 2.0
    is_food = category.slug == "packaged-food" if category else False
    qty = match.donation.quantity if match and match.donation else 1

    # Global impact record
    global_impact = db.query(ImpactMetric).filter(ImpactMetric.user_id == None).first()
    if not global_impact:
        global_impact = ImpactMetric(user_id=None)
        db.add(global_impact)
    
    global_impact.donations_completed += 1
    global_impact.requests_fulfilled += 1
    global_impact.people_helped += 1
    global_impact.items_reused += qty
    global_impact.kg_waste_diverted += round(weight_kg * qty, 1)
    if is_food:
        global_impact.kg_food_rescued += round(weight_kg * qty, 1)
    if handover.volunteer_id:
        global_impact.volunteer_deliveries += 1
        global_impact.volunteer_hours += 0.75

    # Notifications to leave ratings
    n_donor_rate = Notification(
        user_id=handover.donor_id,
        title="Donation Completed! Leave Feedback",
        message="Thank you for giving! Please leave quick feedback to help build community trust.",
        type="rating_prompt",
        link=f"/ratings/{handover.id}"
    )
    n_recipient_rate = Notification(
        user_id=handover.recipient_id,
        title="Item Received! Leave Feedback",
        message="Your request has been fulfilled. Please rate your handover experience.",
        type="rating_prompt",
        link=f"/ratings/{handover.id}"
    )
    db.add_all([n_donor_rate, n_recipient_rate])

    db.commit()
    db.refresh(handover)
    return True
