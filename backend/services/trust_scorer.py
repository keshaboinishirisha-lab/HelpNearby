from typing import List, Optional


def compute_trust_score(
    verification_status: str,
    completed_handovers: int,
    average_rating: Optional[float],
    total_ratings_count: int,
    reports_against_count: int = 0
) -> float:
    """
    Computes a community Trust Score (0 - 100).
    Explicitly kept independent of the Need Score to avoid socioeconomic discrimination.
    Factors:
    - Account identity verification (up to 25 pts)
    - Successful verified handovers track record (up to 35 pts)
    - Community ratings & feedback (up to 30 pts)
    - Clean conduct / absence of valid safety reports (up to 10 pts)
    """
    score = 0.0

    # 1. Identity / Verification (max 25)
    if verification_status == "verified":
        score += 25.0
    elif verification_status == "pending":
        score += 15.0
    else:
        score += 5.0

    # 2. Handover History (max 35)
    # Starts at 15 for new goodwill members, grows with successful handovers
    base_history = 15.0
    if completed_handovers > 0:
        handover_pts = min(20.0, completed_handovers * 4.0)
        score += base_history + handover_pts
    else:
        score += base_history

    # 3. Community Ratings (max 30)
    if total_ratings_count > 0 and average_rating is not None:
        # Scale 1-5 rating into 0-30 points
        score += (average_rating / 5.0) * 30.0
    else:
        # Baseline neutral rating of 4.5 for unrated members
        score += (4.5 / 5.0) * 30.0

    # 4. Clean Safety Record (max 10)
    penalty = reports_against_count * 10.0
    safety_pts = max(0.0, 10.0 - penalty)
    score += safety_pts

    return round(min(100.0, max(0.0, score)), 1)
