from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.deps import get_current_user, get_current_user_optional
from backend.models import Donation, User, Category, Request, Match, Notification
from backend.schemas import (
    DonationCreate, DonationUpdate, DonationPublicResponse, DonationDetailResponse
)
from backend.services.geospatial import fuzz_coordinates, haversine_distance_km
from backend.services.matching_engine import calculate_match

router = APIRouter(prefix="/donations", tags=["Donations"])


@router.get("", response_model=List[DonationPublicResponse])
def get_donations(
    category_id: Optional[int] = None,
    condition: Optional[str] = None,
    status_filter: Optional[str] = "available",
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = 25.0,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Donation)
    if status_filter:
        query = query.filter(Donation.status == status_filter)
    if category_id:
        query = query.filter(Donation.category_id == category_id)
    if condition:
        query = query.filter(Donation.condition == condition)
    if search:
        query = query.filter(Donation.title.ilike(f"%{search}%"))

    donations = query.order_by(Donation.created_at.desc()).all()

    # Filter by geospatial radius if viewer coordinates provided
    results = []
    for d in donations:
        if lat is not None and lng is not None:
            dist = haversine_distance_km(lat, lng, d.approx_lat, d.approx_lng)
            if dist > (radius_km or 25.0):
                continue

        resp = DonationPublicResponse.model_validate(d)
        if d.donor:
            resp.donor_name = d.donor.name
            resp.donor_trust_score = d.donor.trust_score
        results.append(resp)

    return results


@router.post("", response_model=DonationPublicResponse, status_code=status.HTTP_201_CREATED)
def create_donation(
    don_in: DonationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == don_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Generate privacy-preserving neighborhood coordinates
    f_lat, f_lng, f_desc = fuzz_coordinates(don_in.exact_lat, don_in.exact_lng)

    donation = Donation(
        donor_id=current_user.id,
        category_id=don_in.category_id,
        title=don_in.title,
        description=don_in.description,
        condition=don_in.condition,
        quantity=don_in.quantity,
        unit=don_in.unit,
        image_url=don_in.image_url,
        pickup_radius_km=don_in.pickup_radius_km,
        is_perishable=don_in.is_perishable or cat.is_perishable,
        expires_at=don_in.expires_at,
        status="available",
        
        # Privacy-safe approximate coordinates
        approx_lat=f_lat,
        approx_lng=f_lng,
        approx_address=f_desc,
        
        # Protected exact coordinates
        exact_lat=don_in.exact_lat,
        exact_lng=don_in.exact_lng,
        exact_address=don_in.exact_address
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)

    # Automatically scan open requests for immediate matching
    open_requests = db.query(Request).filter(
        Request.status == "open",
        Request.category_id == donation.category_id,
        Request.requester_id != current_user.id
    ).all()

    for req in open_requests:
        match_data = calculate_match(donation, req)
        if match_data and match_data["total_score"] >= 45.0:
            match = Match(
                donation_id=donation.id,
                request_id=req.id,
                distance_km=match_data["distance_km"],
                category_score=match_data["category_score"],
                distance_score=match_data["distance_score"],
                urgency_score=match_data["urgency_score"],
                need_score=match_data["need_score"],
                trust_score=match_data["trust_score"],
                availability_score=match_data["availability_score"],
                total_score=match_data["total_score"],
                match_rationale=match_data["match_rationale"],
                status="suggested"
            )
            db.add(match)
            # Notify requester of incoming match
            n_req = Notification(
                user_id=req.requester_id,
                title="New Match Found for Your Request!",
                message=f"A matching '{donation.title}' is available nearby (Match score: {int(match_data['total_score'])}/100).",
                type="match_found",
                link="/matches"
            )
            db.add(n_req)

    db.commit()
    db.refresh(donation)

    resp = DonationPublicResponse.model_validate(donation)
    resp.donor_name = current_user.name
    resp.donor_trust_score = current_user.trust_score
    return resp


@router.get("/my", response_model=List[DonationDetailResponse])
def get_my_donations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donations = db.query(Donation).filter(Donation.donor_id == current_user.id).order_by(Donation.created_at.desc()).all()
    results = []
    for d in donations:
        resp = DonationDetailResponse.model_validate(d)
        resp.exact_lat = d.exact_lat
        resp.exact_lng = d.exact_lng
        resp.exact_address = d.exact_address
        resp.donor_name = current_user.name
        resp.donor_trust_score = current_user.trust_score
        results.append(resp)
    return results


@router.get("/{id}", response_model=DonationDetailResponse)
def get_donation(
    id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    donation = db.query(Donation).filter(Donation.id == id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    resp = DonationDetailResponse.model_validate(donation)
    if donation.donor:
        resp.donor_name = donation.donor.name
        resp.donor_trust_score = donation.donor.trust_score

    # Privacy Protection:
    # Only the owner or an authorized recipient in a confirmed match gets exact address
    is_authorized = False
    if current_user:
        if current_user.id == donation.donor_id or current_user.role == "admin":
            is_authorized = True
        else:
            # Check if there is an accepted/confirmed match with this user
            accepted_match = db.query(Match).join(Request).filter(
                Match.donation_id == donation.id,
                Request.requester_id == current_user.id,
                Match.status.in_(["accepted_by_recipient", "confirmed", "completed"])
            ).first()
            if accepted_match:
                is_authorized = True

    if is_authorized:
        resp.exact_lat = donation.exact_lat
        resp.exact_lng = donation.exact_lng
        resp.exact_address = donation.exact_address
    else:
        resp.exact_lat = None
        resp.exact_lng = None
        resp.exact_address = None

    return resp


@router.put("/{id}", response_model=DonationPublicResponse)
def update_donation(
    id: int,
    don_in: DonationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donation = db.query(Donation).filter(Donation.id == id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    if donation.donor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this donation")

    if don_in.title is not None:
        donation.title = don_in.title
    if don_in.description is not None:
        donation.description = don_in.description
    if don_in.condition is not None:
        donation.condition = don_in.condition
    if don_in.quantity is not None:
        donation.quantity = don_in.quantity
    if don_in.pickup_radius_km is not None:
        donation.pickup_radius_km = don_in.pickup_radius_km
    if don_in.status is not None:
        donation.status = don_in.status
    if don_in.image_url is not None:
        donation.image_url = don_in.image_url

    db.commit()
    db.refresh(donation)
    return donation


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_donation(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donation = db.query(Donation).filter(Donation.id == id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    if donation.donor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this donation")

    donation.status = "cancelled"
    db.commit()
    return None
