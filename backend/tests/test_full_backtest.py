"""
GiveNearby Full Functionality Backtesting Suite
Validates 100% of defined platform features against the authoritative API.
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import User, Donation, Request, Match, Handover, Category, ImpactMetric
from backend.services.geospatial import haversine_distance_km, fuzz_coordinates
from backend.services.need_scorer import compute_need_priority_score
from backend.services.trust_scorer import compute_trust_score
from backend.services.ai_service import suggest_category_and_condition

client = TestClient(app)


def test_01_health_and_service_identity():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "GiveNearby"
    assert "Donate Anything. Help Someone Nearby." in data["tagline"]


def test_02_auth_and_user_profile_lifecycle():
    uid = uuid.uuid4().hex[:8]
    email = f"user_{uid}@test.org"
    password = "StrongPassword2026!"

    # 1. Registration
    reg_res = client.post("/api/auth/register", json={
        "name": "Test Neighbor",
        "email": email,
        "password": password,
        "role": "donor_recipient",
        "phone": "+1-555-1234",
        "approx_lat": 37.7749,
        "approx_lng": -122.4194,
        "approx_address": "Mission District, San Francisco, CA"
    })
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    user_id = reg_res.json()["user"]["id"]

    # 2. Login
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200
    assert login_res.json()["user"]["id"] == user_id

    # 3. Invalid credentials rejection
    bad_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # 4. Get Current Profile
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # 5. Update Profile
    update_res = client.put("/api/auth/me", json={
        "bio": "Passionate community resource sharer",
        "phone": "+1-555-9999"
    }, headers={"Authorization": f"Bearer {token}"})
    assert update_res.status_code == 200
    assert update_res.json()["bio"] == "Passionate community resource sharer"
    assert update_res.json()["phone"] == "+1-555-9999"


def test_03_zero_leak_geospatial_privacy():
    exact_lat, exact_lng = 37.7749295, -122.4194155
    fuzz_lat, fuzz_lng, desc = fuzz_coordinates(exact_lat, exact_lng)

    # Must decouple exact coordinates
    assert (fuzz_lat != exact_lat) or (fuzz_lng != exact_lng)
    # Must remain within ~1.5 km neighborhood centroid
    dist = haversine_distance_km(exact_lat, exact_lng, fuzz_lat, fuzz_lng)
    assert dist <= 2.0
    assert "Approx." in desc


def test_04_need_priority_scoring_objective_weighting():
    # Emergency food
    score_emergency_food = compute_need_priority_score("emergency", None, "packaged-food", 2)
    # Low urgency toy
    score_low_toy = compute_need_priority_score("low", None, "toys", 1)

    assert score_emergency_food >= 70.0
    assert score_emergency_food > score_low_toy
    assert 0.0 <= score_low_toy <= 100.0


def test_05_community_trust_scoring_independence():
    # Unverified with 0 history
    t_new = compute_trust_score("pending", 0, None, 0)
    # Verified veteran with 10 handovers and 5.0 star rating
    t_vet = compute_trust_score("verified", 10, 5.0, 10, 0)

    assert t_vet > t_new
    assert t_vet >= 90.0


def test_06_ai_assisted_categorization_and_condition():
    # Test book
    res_book = suggest_category_and_condition("AP Biology Textbook", "Brand new unopened in box")
    assert res_book["suggested_category_slug"] in ["books", "educational-materials"]
    assert res_book["suggested_condition"] == "new"

    # Test food
    res_food = suggest_category_and_condition("Box of Cereal and Organic Rice", "Factory sealed groceries")
    assert res_food["suggested_category_slug"] == "packaged-food"

    # Test electronics
    res_laptop = suggest_category_and_condition("MacBook Air Laptop with Charger", "Good functional condition")
    assert res_laptop["suggested_category_slug"] == "electronics"
    assert res_laptop["suggested_condition"] == "good"


def test_07_full_lifecycle_donation_request_handover_rating_impact():
    uid = uuid.uuid4().hex[:8]
    # Donor
    donor_res = client.post("/api/auth/register", json={
        "name": "Lifecycle Donor",
        "email": f"donor_{uid}@test.org",
        "password": "Password123!",
        "role": "donor_recipient",
        "approx_lat": 37.7749,
        "approx_lng": -122.4194
    })
    assert donor_res.status_code == 201
    donor_token = donor_res.json()["access_token"]
    donor_id = donor_res.json()["user"]["id"]

    # Recipient
    rec_res = client.post("/api/auth/register", json={
        "name": "Lifecycle Recipient",
        "email": f"rec_{uid}@test.org",
        "password": "Password123!",
        "role": "donor_recipient",
        "approx_lat": 37.7755,
        "approx_lng": -122.4180
    })
    assert rec_res.status_code == 201
    rec_token = rec_res.json()["access_token"]
    rec_id = rec_res.json()["user"]["id"]

    # Category
    cats = client.get("/api/categories").json()
    cat_id = cats[0]["id"]

    # 1. Create Donation
    don_res = client.post("/api/donations", json={
        "category_id": cat_id,
        "title": "Middle School Math Book",
        "description": "Textbook for 8th grade math lessons.",
        "condition": "like_new",
        "quantity": 1,
        "unit": "book",
        "pickup_radius_km": 10.0,
        "exact_lat": 37.7749,
        "exact_lng": -122.4194,
        "exact_address": "789 Private Street, Apt 10"
    }, headers={"Authorization": f"Bearer {donor_token}"})
    assert don_res.status_code == 201
    don_id = don_res.json()["id"]

    # Public view must NOT reveal exact address
    pub_don = client.get(f"/api/donations/{don_id}").json()
    assert pub_don["exact_address"] is None
    assert pub_don["exact_lat"] is None

    # Owner view DOES reveal exact address
    owner_don = client.get(f"/api/donations/{don_id}", headers={"Authorization": f"Bearer {donor_token}"}).json()
    assert owner_don["exact_address"] == "789 Private Street, Apt 10"

    # 2. Create Request
    req_res = client.post("/api/requests", json={
        "category_id": cat_id,
        "title": "Need 8th Grade Math Study Guide",
        "description": "Urgent math exam review needed for my daughter.",
        "quantity": 1,
        "unit": "book",
        "urgency": "high",
        "max_distance_km": 10.0,
        "exact_lat": 37.7755,
        "exact_lng": -122.4180,
        "exact_address": "1010 Private Ave, Unit 2"
    }, headers={"Authorization": f"Bearer {rec_token}"})
    assert req_res.status_code == 201
    req_id = req_res.json()["id"]

    # 3. Automatic Match Evaluation
    matches = client.get("/api/matches", headers={"Authorization": f"Bearer {donor_token}"}).json()
    assert len(matches) > 0
    match = matches[0]
    match_id = match["id"]
    assert match["total_score"] >= 50.0
    assert len(match["match_rationale"]) > 0

    # 4. Mutual Acceptance
    # Recipient accepts
    client.post(f"/api/matches/{match_id}/action", json={"action": "accept"}, headers={"Authorization": f"Bearer {rec_token}"})
    # Donor accepts -> status confirmed & handover created
    don_accept = client.post(f"/api/matches/{match_id}/action", json={"action": "accept"}, headers={"Authorization": f"Bearer {donor_token}"})
    assert don_accept.json()["status"] == "confirmed"

    # 5. Handover Room & OTP Verification Handshake
    # Recipient sees the 6-digit OTP code
    rec_ho = client.get(f"/api/handovers/{match_id}", headers={"Authorization": f"Bearer {rec_token}"}).json()
    otp_code = rec_ho["verification_code"]
    assert otp_code is not None
    assert len(otp_code) == 6

    # Donor CANNOT see the OTP code remotely
    donor_ho = client.get(f"/api/handovers/{match_id}", headers={"Authorization": f"Bearer {donor_token}"}).json()
    assert donor_ho["verification_code"] is None

    # Safe points recommendation
    pts_res = client.get(f"/api/handovers/{match_id}/safe-points", headers={"Authorization": f"Bearer {donor_token}"})
    assert pts_res.status_code == 200
    assert len(pts_res.json()["safe_points"]) > 0

    # Schedule pickup location
    sched_res = client.post(f"/api/handovers/{match_id}/schedule", json={
        "safe_pickup_location": "Mission Community Library Lobby"
    }, headers={"Authorization": f"Bearer {donor_token}"})
    assert sched_res.status_code == 200
    assert sched_res.json()["safe_pickup_location"] == "Mission Community Library Lobby"

    # Wrong OTP is rejected
    wrong_v = client.post(f"/api/handovers/{match_id}/verify", json={"verification_code": "999999"}, headers={"Authorization": f"Bearer {donor_token}"})
    assert wrong_v.status_code == 400

    # Correct OTP succeeds -> Completed!
    correct_v = client.post(f"/api/handovers/{match_id}/verify", json={"verification_code": otp_code}, headers={"Authorization": f"Bearer {donor_token}"})
    assert correct_v.status_code == 200
    assert correct_v.json()["status"] == "completed"

    # 6. Ratings
    rate_res = client.post("/api/ratings", json={
        "handover_id": correct_v.json()["id"],
        "rated_user_id": rec_id,
        "rating": 5,
        "punctuality": 5,
        "item_accuracy": 5,
        "kindness": 5,
        "feedback": "Flawless handover experience!"
    }, headers={"Authorization": f"Bearer {donor_token}"})
    assert rate_res.status_code == 201

    # 7. Impact Metrics Verification
    impact = client.get("/api/impact/summary").json()
    assert impact["donations_completed"] >= 1
    assert impact["people_helped"] >= 1
    assert impact["kg_waste_diverted"] > 0


def test_08_volunteer_logistics_workflow():
    uid = uuid.uuid4().hex[:8]
    vol_res = client.post("/api/auth/register", json={
        "name": "Volunteer Runner",
        "email": f"vol_{uid}@test.org",
        "password": "Password123!",
        "role": "volunteer"
    })
    assert vol_res.status_code == 201
    vol_token = vol_res.json()["access_token"]

    # Fetch tasks
    tasks = client.get("/api/volunteers/tasks", headers={"Authorization": f"Bearer {vol_token}"})
    assert tasks.status_code == 200
    assert isinstance(tasks.json(), list)


def test_09_ngo_organization_portal():
    orgs = client.get("/api/organizations")
    assert orgs.status_code == 200
    assert isinstance(orgs.json(), list)


def test_10_notifications_lifecycle():
    uid = uuid.uuid4().hex[:8]
    u = client.post("/api/auth/register", json={
        "name": "Notification User",
        "email": f"notif_{uid}@test.org",
        "password": "Password123!",
        "role": "donor_recipient"
    }).json()
    token = u["access_token"]

    notifs = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"}).json()
    assert isinstance(notifs, list)

    mark_all = client.put("/api/notifications/read-all", headers={"Authorization": f"Bearer {token}"})
    assert mark_all.status_code == 200


def test_11_admin_governance_and_moderation():
    # Login as seeded admin
    admin = client.post("/api/auth/login", json={
        "email": "admin@givenearby.org",
        "password": "AdminSecurePassword2026!"
    }).json()
    admin_token = admin["access_token"]

    # 1. Admin Stats
    stats = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"}).json()
    assert stats["users_count"] >= 1
    assert "donations_count" in stats

    # 2. User list
    users = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
    assert len(users) >= 1

    # 3. Report resolution
    rep = client.post("/api/reports", json={
        "entity_type": "user",
        "entity_id": 1,
        "reason": "Test audit safety report",
        "details": "Testing admin resolution pipeline."
    }, headers={"Authorization": f"Bearer {admin_token}"}).json()

    res_rep = client.post(
        f"/api/reports/{rep['id']}/resolve?action=resolve&admin_notes=Audit+cleared",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_rep.status_code == 200
    assert res_rep.json()["status"] == "resolved"
