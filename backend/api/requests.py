from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.deps import get_current_user, get_current_user_optional
from backend.models import Request, User, Category, Donation, Match, Notification
from backend.schemas import (
    RequestCreate, RequestUpdate, RequestPublicResponse, RequestDetailResponse
)
from backend.services.geospatial import fuzz_coordinates, haversine_distance_km
from backend.services.need_scorer import compute_need_priority_score
from backend.services.matching_engine import calculate_match

router = APIRouter(prefix="/requests", tags=["Requests"])


@router.get("", response_model=List[RequestPublicResponse])
def get_requests(
    category_id: Optional[int] = None,
    urgency: Optional[str] = None,
    status_filter: Optional[str] = "open",
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = 25.0,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Request)
    if status_filter:
        query = query.filter(Request.status == status_filter)
    if category_id:
        query = query.filter(Request.category_id == category_id)
    if urgency:
        query = query.filter(Request.urgency == urgency)
    if search:
        query = query.filter(Request.title.ilike(f"%{search}%"))

    # Need priority ordering (highest need first)
    requests = query.order_by(Request.need_priority_score.desc(), Request.created_at.desc()).all()

    results = []
    for r in requests:
        if lat is not None and lng is not None:
            dist = haversine_distance_km(lat, lng, r.approx_lat, r.approx_lng)
            if dist > (radius_km or 25.0):
                continue

        resp = RequestPublicResponse.model_validate(r)
        if r.requester:
            resp.requester_name = r.requester.name
            resp.requester_trust_score = r.requester.trust_score
        results.append(resp)

    return results


@router.post("", response_model=RequestPublicResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    req_in: RequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == req_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Generate privacy-preserving neighborhood coordinates
    f_lat, f_lng, f_desc = fuzz_coordinates(req_in.exact_lat, req_in.exact_lng)

    # Compute objective need priority score
    need_score = compute_need_priority_score(
        urgency=req_in.urgency,
        created_at=None,
        category_slug=cat.slug,
        quantity=req_in.quantity,
        requester_role=current_user.role
    )

    request_obj = Request(
        requester_id=current_user.id,
        category_id=req_in.category_id,
        title=req_in.title,
        description=req_in.description,
        quantity=req_in.quantity,
        unit=req_in.unit,
        urgency=req_in.urgency,
        need_priority_score=need_score,
        max_distance_km=req_in.max_distance_km,
        status="open",
        
        # Privacy-safe approximate coordinates
        approx_lat=f_lat,
        approx_lng=f_lng,
        approx_address=f_desc,
        
        # Protected exact coordinates
        exact_lat=req_in.exact_lat,
        exact_lng=req_in.exact_lng,
        exact_address=req_in.exact_address
    )
    db.add(request_obj)
    db.commit()
    db.refresh(request_obj)

    # Scan available donations for immediate matches
    available_donations = db.query(Donation).filter(
        Donation.status == "available",
        Donation.category_id == request_obj.category_id,
        Donation.donor_id != current_user.id
    ).all()

    for don in available_donations:
        match_data = calculate_match(don, request_obj)
        if match_data and match_data["total_score"] >= 45.0:
            match = Match(
                donation_id=don.id,
                request_id=request_obj.id,
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
            # Notify donor of matched request
            n_don = Notification(
                user_id=don.donor_id,
                title="Someone Nearby Needs Your Donation!",
                message=f"A matching request '{request_obj.title}' was posted nearby ({int(match_data['total_score'])}/100 score).",
                type="match_found",
                link="/matches"
            )
            db.add(n_don)

    db.commit()
    db.refresh(request_obj)

    resp = RequestPublicResponse.model_validate(request_obj)
    resp.requester_name = current_user.name
    resp.requester_trust_score = current_user.trust_score
    return resp


@router.get("/my", response_model=List[RequestDetailResponse])
def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(Request).filter(Request.requester_id == current_user.id).order_by(Request.created_at.desc()).all()
    results = []
    for r in requests:
        resp = RequestDetailResponse.model_validate(r)
        resp.exact_lat = r.exact_lat
        resp.exact_lng = r.exact_lng
        resp.exact_address = r.exact_address
        resp.requester_name = current_user.name
        resp.requester_trust_score = current_user.trust_score
        results.append(resp)
    return results


@router.get("/{id}", response_model=RequestDetailResponse)
def get_request(
    id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    req = db.query(Request).filter(Request.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    resp = RequestDetailResponse.model_validate(req)
    if req.requester:
        resp.requester_name = req.requester.name
        resp.requester_trust_score = req.requester.trust_score

    # Privacy Protection
    is_authorized = False
    if current_user:
        if current_user.id == req.requester_id or current_user.role == "admin":
            is_authorized = True
        else:
            accepted_match = db.query(Match).join(Donation).filter(
                Match.request_id == req.id,
                Donation.donor_id == current_user.id,
                Match.status.in_(["accepted_by_donor", "confirmed", "completed"])
            ).first()
            if accepted_match:
                is_authorized = True

    if is_authorized:
        resp.exact_lat = req.exact_lat
        resp.exact_lng = req.exact_lng
        resp.exact_address = req.exact_address
    else:
        resp.exact_lat = None
        resp.exact_lng = None
        resp.exact_address = None

    return resp


@router.put("/{id}", response_model=RequestPublicResponse)
def update_request(
    id: int,
    req_in: RequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(Request).filter(Request.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.requester_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this request")

    if req_in.title is not None:
        req.title = req_in.title
    if req_in.description is not None:
        req.description = req_in.description
    if req_in.quantity is not None:
        req.quantity = req_in.quantity
    if req_in.urgency is not None:
        req.urgency = req_in.urgency
        # Recompute need score when urgency changes
        req.need_priority_score = compute_need_priority_score(
            urgency=req.urgency,
            created_at=req.created_at,
            category_slug=req.category.slug if req.category else "household",
            quantity=req.quantity,
            requester_role=current_user.role
        )
    if req_in.status is not None:
        req.status = req_in.status

    db.commit()
    db.refresh(req)
    return req


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(Request).filter(Request.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.requester_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to cancel this request")

    req.status = "cancelled"
    db.commit()
    return None
