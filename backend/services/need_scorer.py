from datetime import datetime, timezone
from typing import Optional


def compute_need_priority_score(
    urgency: str,
    created_at: Optional[datetime],
    category_slug: str,
    quantity: int,
    requester_role: str = "donor_recipient"
) -> float:
    """
    Computes an objective, transparent Need Priority Score (0 - 100).
    Factors:
    - Urgency level stated (up to 35 pts)
    - Waiting time elapsed (up to 20 pts)
    - Category essentiality / human-necessity weight (up to 25 pts)
    - Requested quantity scale / reasonableness (up to 10 pts)
    - Vulnerability / verified role factor (e.g. verified NGO / community shelter) (up to 10 pts)
    """
    score = 0.0

    # 1. Stated Urgency (max 35)
    urgency_map = {
        "emergency": 35.0,
        "high": 27.0,
        "medium": 18.0,
        "low": 10.0
    }
    score += urgency_map.get(urgency.lower(), 18.0)

    # 2. Category Essentiality (max 25)
    essential_categories = {
        "packaged-food": 25.0,
        "baby-essentials": 24.0,
        "medical-accessibility": 25.0,
        "winter-clothing-blankets": 22.0,
        "educational-materials": 20.0,
        "books": 16.0,
        "clothes": 17.0,
        "household": 15.0,
        "electronics": 14.0,
        "toys": 12.0
    }
    score += essential_categories.get(category_slug, 15.0)

    # 3. Waiting Duration (max 20)
    if created_at:
        now = datetime.utcnow()
        delta_days = (now - created_at).total_seconds() / 86400.0
        # 1 pt per 2 days waiting, up to 20 points
        wait_pts = min(20.0, delta_days * 0.5)
        score += wait_pts
    else:
        score += 5.0

    # 4. Modest / High-Fulfillment Quantity (max 10)
    # Modest quantities (1-5 units) are easier to fulfill immediately and prevent hoarding
    if 1 <= quantity <= 5:
        score += 10.0
    elif 6 <= quantity <= 15:
        score += 7.0
    else:
        score += 4.0

    # 5. Organization / Verified Community Institution (max 10)
    if requester_role in ["ngo", "organization"]:
        score += 10.0
    else:
        score += 5.0

    # Bound to [0.0, 100.0]
    return round(min(100.0, max(0.0, score)), 1)
