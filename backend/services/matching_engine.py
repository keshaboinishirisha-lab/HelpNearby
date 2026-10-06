from typing import Dict, Any, List, Optional
from backend.services.geospatial import haversine_distance_km
from backend.models import Donation, Request, Category, User


def calculate_match(donation: Donation, request: Request) -> Optional[Dict[str, Any]]:
    """
    Evaluates compatibility between an available donation and a nearby request.
    Returns None if hard constraints are violated (e.g., mismatched category, distance exceeds radius).
    Otherwise returns a detailed score breakdown and human-readable explanation rationale.
    """
    # 1. Hard Constraint: Category Compatibility
    if donation.category_id != request.category_id:
        return None

    # Calculate distance using exact coordinates where available, or approximate
    don_lat = donation.exact_lat or donation.approx_lat
    don_lng = donation.exact_lng or donation.approx_lng
    req_lat = request.exact_lat or request.approx_lat
    req_lng = request.exact_lng or request.approx_lng

    dist_km = haversine_distance_km(don_lat, don_lng, req_lat, req_lng)

    # 2. Hard Constraint: Distance vs Radius
    max_allowed = max(donation.pickup_radius_km, request.max_distance_km)
    if dist_km > max_allowed:
        return None

    rationale: List[str] = []

    # Category Match (Weight: 25%)
    category_score = 100.0
    rationale.append(f"✓ Exact Category match in {donation.category.name if donation.category else 'requested category'}")

    # Distance Score (Weight: 25%)
    # Distance scoring curve: closer = higher score
    if dist_km <= 2.0:
        distance_score = 100.0
        rationale.append(f"✓ Walking distance ({dist_km} km away)")
    elif dist_km <= 5.0:
        distance_score = 90.0
        rationale.append(f"✓ Hyperlocal neighborhood ({dist_km} km away)")
    elif dist_km <= 10.0:
        distance_score = 75.0
        rationale.append(f"✓ Short transit distance ({dist_km} km away)")
    else:
        # Linear degradation beyond 10km down to 40
        distance_score = max(40.0, 100.0 - (dist_km * 4.0))
        rationale.append(f"✓ Within delivery radius ({dist_km} km away)")

    # Need Priority Score (Weight: 25%)
    need_score = request.need_priority_score or 50.0
    if need_score >= 80.0:
        rationale.append(f"✓ Urgent community need (Priority Score: {int(need_score)}/100)")
    elif need_score >= 60.0:
        rationale.append(f"✓ High priority request (Priority Score: {int(need_score)}/100)")
    else:
        rationale.append(f"✓ Standard community request (Priority Score: {int(need_score)}/100)")

    # Trust Score (Weight: 15%)
    # Blended trust of donor and requester
    donor_trust = donation.donor.trust_score if donation.donor else 75.0
    req_trust = request.requester.trust_score if request.requester else 75.0
    trust_score = round((donor_trust * 0.5) + (req_trust * 0.5), 1)
    if trust_score >= 85.0:
        rationale.append(f"✓ Highly verified and trusted community members ({int(trust_score)}/100 trust)")
    else:
        rationale.append(f"✓ Good standing community members ({int(trust_score)}/100 trust)")

    # Availability & Quantity Compatibility (Weight: 10%)
    availability_score = 100.0
    if donation.quantity >= request.quantity:
        availability_score = 100.0
        rationale.append(f"✓ Full quantity available ({donation.quantity} offered vs {request.quantity} requested)")
    else:
        # Partial fulfillment
        ratio = donation.quantity / max(1, request.quantity)
        availability_score = round(ratio * 80.0, 1)
        rationale.append(f"✓ Partial fulfillment available ({donation.quantity} of {request.quantity} requested)")

    # Total Score Calculation (0 - 100)
    total_score = (
        (category_score * 0.25)
        + (distance_score * 0.25)
        + (need_score * 0.25)
        + (trust_score * 0.15)
        + (availability_score * 0.10)
    )
    total_score = round(min(100.0, max(0.0, total_score)), 1)

    return {
        "donation_id": donation.id,
        "request_id": request.id,
        "distance_km": dist_km,
        "category_score": category_score,
        "distance_score": distance_score,
        "urgency_score": 100.0 if request.urgency == "emergency" else (80.0 if request.urgency == "high" else 60.0),
        "need_score": need_score,
        "trust_score": trust_score,
        "availability_score": availability_score,
        "total_score": total_score,
        "match_rationale": rationale
    }
