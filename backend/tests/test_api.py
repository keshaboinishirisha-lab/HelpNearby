import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.core.database import SessionLocal, Base, engine
from backend.models import User, Donation, Request, Match, Handover, Category, ImpactMetric
from backend.services.geospatial import haversine_distance_km, fuzz_coordinates
from backend.services.need_scorer import compute_need_priority_score
from backend.services.trust_scorer import compute_trust_score
from backend.services.ai_service import suggest_category_and_condition

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Ensure test category exists
    cat = db.query(Category).filter(Category.slug == "test-books").first()
    if not cat:
        cat = Category(
            name="Test Books & Education",
            slug="test-books",
            description="Educational reading materials",
            icon="book",
            is_perishable=False,
            requires_special_handling=False,
            avg_weight_kg=2.0,
            urgency_weight=1.0
        )
        db.add(cat)
        db.commit()
    db.close()
    yield


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "GiveNearby"


def test_geospatial_distance_and_privacy():
    # San Francisco Civic Center to Mission Dolores (~1.5 km)
    dist = haversine_distance_km(37.7792, -122.4191, 37.7685, -122.4230)
    assert 1.0 <= dist <= 2.0

    # Test Zero-Leak Privacy Fuzzing
    exact_lat, exact_lng = 37.7749295, -122.4194155
    fuzz_lat, fuzz_lng, desc = fuzz_coordinates(exact_lat, exact_lng)

    # Must NOT be identical (zero leak)
    assert (fuzz_lat != exact_lat) or (fuzz_lng != exact_lng)
    
    # Distance between exact and approximate must be within ~1.5 km
    fuzz_dist = haversine_distance_km(exact_lat, exact_lng, fuzz_lat, fuzz_lng)
    assert fuzz_dist <= 2.0
    assert "Approx." in desc


def test_need_priority_scoring():
    emergency_score = compute_need_priority_score("emergency", None, "packaged-food", 3)
    low_score = compute_need_priority_score("low", None, "toys", 1)
    
    assert emergency_score > low_score
    assert emergency_score >= 70.0
    assert 0.0 <= low_score <= 100.0


def test_trust_scoring():
    unverified_score = compute_trust_score("unverified", 0, None, 0)
    verified_veteran_score = compute_trust_score("verified", 10, 4.9, 8)
    
    assert verified_veteran_score > unverified_score
    assert verified_veteran_score >= 85.0


def test_ai_assisted_categorization():
    res = suggest_category_and_condition("Chemistry high school textbook", "Like new with no markings")
    assert res["suggested_category_slug"] in ["books", "educational-materials"]
    assert res["suggested_condition"] == "like_new"
    assert res["confidence"] >= 0.85


def test_full_critical_donation_to_handover_workflow():
    import uuid
    uid = uuid.uuid4().hex[:8]
    # 1. Register Donor
    donor_res = client.post("/api/auth/register", json={
        "name": "Alice Donor",
        "email": f"alice_{uid}@test.org",
        "password": "SecurePassword123!",
        "role": "donor_recipient",
        "approx_lat": 37.7749,
        "approx_lng": -122.4194
    })
    assert donor_res.status_code == 201
    donor_token = donor_res.json()["access_token"]
    donor_id = donor_res.json()["user"]["id"]

    # 2. Register Requester
    rec_res = client.post("/api/auth/register", json={
        "name": "Bob Requester",
        "email": f"bob_{uid}@test.org",
        "password": "SecurePassword123!",
        "role": "donor_recipient",
        "approx_lat": 37.7760,
        "approx_lng": -122.4180
    })
    assert rec_res.status_code == 201
    rec_token = rec_res.json()["access_token"]
    rec_id = rec_res.json()["user"]["id"]

    # Get category ID
    cats = client.get("/api/categories").json()
    cat_id = cats[0]["id"]

    # 3. Create Donation
    don_res = client.post("/api/donations", json={
        "category_id": cat_id,
        "title": "Geometry Textbook for Grade 9",
        "description": "Clean condition textbook for local high schooler.",
        "condition": "good",
        "quantity": 1,
        "unit": "book",
        "exact_lat": 37.7749,
        "exact_lng": -122.4194,
        "exact_address": "123 Private Donor Street, Apt 4B",
        "pickup_radius_km": 10.0
    }, headers={"Authorization": f"Bearer {donor_token}"})
    assert don_res.status_code == 201
    donation_id = don_res.json()["id"]

    # Verify public listing obfuscates exact address
    pub_don = client.get(f"/api/donations/{donation_id}").json()
    assert pub_don["exact_address"] is None
    assert pub_don["exact_lat"] is None

    # 4. Create Request
    req_res = client.post("/api/requests", json={
        "category_id": cat_id,
        "title": "Need High School Geometry Book",
        "description": "Urgent math study guide needed for term finals.",
        "quantity": 1,
        "unit": "book",
        "urgency": "high",
        "exact_lat": 37.7755,
        "exact_lng": -122.4185,
        "exact_address": "456 Private Requester Avenue",
        "max_distance_km": 10.0
    }, headers={"Authorization": f"Bearer {rec_token}"})
    assert req_res.status_code == 201
    request_id = req_res.json()["id"]

    # 5. Check Matches
    matches_res = client.get("/api/matches", headers={"Authorization": f"Bearer {donor_token}"})
    assert matches_res.status_code == 200
    matches = matches_res.json()
    assert len(matches) > 0
    match_id = matches[0]["id"]
    assert matches[0]["total_score"] >= 50.0
    assert len(matches[0]["match_rationale"]) > 0

    # 6. Mutual Acceptance
    # Requester accepts
    rec_act = client.post(f"/api/matches/{match_id}/action", json={"action": "accept"}, headers={"Authorization": f"Bearer {rec_token}"})
    assert rec_act.status_code == 200

    # Donor accepts -> triggers confirmed status and creates Handover with OTP
    don_act = client.post(f"/api/matches/{match_id}/action", json={"action": "accept"}, headers={"Authorization": f"Bearer {donor_token}"})
    assert don_act.status_code == 200
    assert don_act.json()["status"] == "confirmed"

    # 7. Handover & OTP Verification
    # Recipient checks handover to see 6-digit OTP code
    rec_ho = client.get(f"/api/handovers/{match_id}", headers={"Authorization": f"Bearer {rec_token}"})
    assert rec_ho.status_code == 200
    otp_code = rec_ho.json()["verification_code"]
    assert otp_code is not None
    assert len(otp_code) == 6

    # Donor checks handover -> OTP must NOT be revealed to donor
    donor_ho = client.get(f"/api/handovers/{match_id}", headers={"Authorization": f"Bearer {donor_token}"})
    assert donor_ho.json()["verification_code"] is None

    # Test invalid OTP code fails
    fail_verify = client.post(f"/api/handovers/{match_id}/verify", json={"verification_code": "000000"}, headers={"Authorization": f"Bearer {donor_token}"})
    assert fail_verify.status_code == 400

    # Correct OTP code succeeds
    success_verify = client.post(f"/api/handovers/{match_id}/verify", json={"verification_code": otp_code}, headers={"Authorization": f"Bearer {donor_token}"})
    assert success_verify.status_code == 200
    assert success_verify.json()["status"] == "completed"

    # 8. Submit Rating
    rating_res = client.post("/api/ratings", json={
        "handover_id": success_verify.json()["id"],
        "rated_user_id": rec_id,
        "rating": 5,
        "feedback": "Smooth, friendly, and punctual handover!",
        "punctuality": 5,
        "item_accuracy": 5,
        "kindness": 5
    }, headers={"Authorization": f"Bearer {donor_token}"})
    assert rating_res.status_code == 201

    # 9. Verify Impact Summary incremented
    impact_res = client.get("/api/impact/summary")
    assert impact_res.status_code == 200
    impact = impact_res.json()
    assert impact["donations_completed"] >= 1
    assert impact["items_reused"] >= 1
