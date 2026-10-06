import pytest
import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import User, Handover, VolunteerTask

client = TestClient(app)


def test_rbac_and_admin_security():
    uid = uuid.uuid4().hex[:8]
    # Register standard user
    res = client.post("/api/auth/register", json={
        "name": "Standard User",
        "email": f"standard_{uid}@test.org",
        "password": "Password123!",
        "role": "donor_recipient"
    })
    token = res.json()["access_token"]

    # Try accessing admin stats -> 403 Forbidden
    admin_res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert admin_res.status_code == 403

    # Login with seeded admin account
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@givenearby.org",
        "password": "AdminSecurePassword2026!"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]

    # Access admin stats -> 200 OK
    admin_stats = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_stats.status_code == 200
    stats = admin_stats.json()
    assert "users_count" in stats
    assert "donations_count" in stats


def test_report_and_moderation():
    uid = uuid.uuid4().hex[:8]
    res = client.post("/api/auth/register", json={
        "name": "Reporter",
        "email": f"reporter_{uid}@test.org",
        "password": "Password123!",
        "role": "donor_recipient"
    })
    token = res.json()["access_token"]

    # Submit a safety report
    rep_res = client.post("/api/reports", json={
        "entity_type": "donation",
        "entity_id": 1,
        "reason": "Suspicious listing",
        "details": "Item appears incorrectly labeled or broken."
    }, headers={"Authorization": f"Bearer {token}"})
    assert rep_res.status_code == 201
    report_id = rep_res.json()["id"]

    # Admin resolves report
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@givenearby.org",
        "password": "AdminSecurePassword2026!"
    })
    admin_token = admin_login.json()["access_token"]

    resolve_res = client.post(
        f"/api/reports/{report_id}/resolve?action=resolve&admin_notes=Verified+and+addressed",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "resolved"


def test_volunteer_workflow():
    uid = uuid.uuid4().hex[:8]
    # Register volunteer
    vol_res = client.post("/api/auth/register", json={
        "name": "David Courier",
        "email": f"courier_{uid}@test.org",
        "password": "Password123!",
        "role": "volunteer"
    })
    assert vol_res.status_code == 201
    vol_token = vol_res.json()["access_token"]

    # Check available tasks
    tasks_res = client.get("/api/volunteers/tasks", headers={"Authorization": f"Bearer {vol_token}"})
    assert tasks_res.status_code == 200
    assert isinstance(tasks_res.json(), list)


def test_safe_points_recommendation():
    # Public recommendations
    login_res = client.post("/api/auth/login", json={
        "email": "donor@givenearby.org",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    points_res = client.get("/api/handovers/1/safe-points", headers={"Authorization": f"Bearer {token}"})
    # Even if handover 1 isn't found, 404 or points return appropriately
    assert points_res.status_code in [200, 404]
    if points_res.status_code == 200:
        assert "safe_points" in points_res.json()
        assert len(points_res.json()["safe_points"]) > 0
