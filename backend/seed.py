"""
GiveNearby Realistic Database Seeder
Populates initial categories, test accounts for all roles, sample donations,
urgent community requests, matches, completed handovers, ratings, and impact metrics.
"""
from datetime import datetime, timedelta
from backend.core.database import SessionLocal, engine, Base
from backend.core.security import get_password_hash
from backend.models import (
    User, Category, Donation, Request, Match, Handover, Rating, Notification, VolunteerTask, ImpactMetric
)
from backend.services.geospatial import fuzz_coordinates, haversine_distance_km
from backend.services.need_scorer import compute_need_priority_score
from backend.services.matching_engine import calculate_match

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data for fresh seed if needed
    # (Or check if categories exist)
    if db.query(Category).first():
        print("Database already seeded with categories. Skipping full reseeding.")
        db.close()
        return

    print("Seeding GiveNearby Database...")

    # 1. Categories
    categories_data = [
        {
            "name": "Educational Materials & Books",
            "slug": "educational-materials",
            "description": "School textbooks, notebooks, revision guides, stationery, backpacks.",
            "icon": "book-open",
            "is_perishable": False,
            "requires_special_handling": False,
            "avg_weight_kg": 2.5,
            "urgency_weight": 1.2
        },
        {
            "name": "Packaged Food & Nutrition",
            "slug": "packaged-food",
            "description": "Unopened dry groceries, canned food, baby formula, staples.",
            "icon": "apple",
            "is_perishable": True,
            "requires_special_handling": True,
            "avg_weight_kg": 3.0,
            "urgency_weight": 1.5
        },
        {
            "name": "Clothing & Winter Warmth",
            "slug": "clothes",
            "description": "Clean jackets, sweaters, shoes, coats, thermal wear, blankets.",
            "icon": "shirt",
            "is_perishable": False,
            "requires_special_handling": False,
            "avg_weight_kg": 1.8,
            "urgency_weight": 1.3
        },
        {
            "name": "Electronics & Study Tech",
            "slug": "electronics",
            "description": "Laptops, tablets, monitors, chargers, calculators for students.",
            "icon": "laptop",
            "is_perishable": False,
            "requires_special_handling": True,
            "avg_weight_kg": 2.0,
            "urgency_weight": 1.2
        },
        {
            "name": "Medical & Mobility Aids",
            "slug": "medical-accessibility",
            "description": "Crutches, walkers, wheelchairs, blood pressure monitors, nebulizers.",
            "icon": "heart-pulse",
            "is_perishable": False,
            "requires_special_handling": True,
            "avg_weight_kg": 4.5,
            "urgency_weight": 1.6
        },
        {
            "name": "Household & Kitchen Utensils",
            "slug": "household",
            "description": "Pots, pans, kettles, dining sets, small appliances for resettling families.",
            "icon": "home",
            "is_perishable": False,
            "requires_special_handling": False,
            "avg_weight_kg": 3.5,
            "urgency_weight": 1.0
        },
        {
            "name": "Toys & Children Play",
            "slug": "toys",
            "description": "Puzzles, board games, building blocks, stuffed animals.",
            "icon": "smile",
            "is_perishable": False,
            "requires_special_handling": False,
            "avg_weight_kg": 1.2,
            "urgency_weight": 0.9
        }
    ]

    cat_map = {}
    for cat in categories_data:
        c = Category(**cat)
        db.add(c)
        db.commit()
        db.refresh(c)
        cat_map[c.slug] = c

    # 2. Seed Users for All Conceptual Roles
    users_data = [
        {
            "name": "Elena Rostova (Donor)",
            "email": "donor@givenearby.org",
            "password": "Password123!",
            "role": "donor_recipient",
            "phone": "+1-555-0101",
            "verification_status": "verified",
            "trust_score": 92.5,
            "approx_lat": 37.7749,
            "approx_lng": -122.4194,
            "approx_address": "Mission District / SOMA Border, San Francisco, CA"
        },
        {
            "name": "Marcus Chen (Requester)",
            "email": "requester@givenearby.org",
            "password": "Password123!",
            "role": "donor_recipient",
            "phone": "+1-555-0102",
            "verification_status": "verified",
            "trust_score": 88.0,
            "approx_lat": 37.7690,
            "approx_lng": -122.4250,
            "approx_address": "Mission Dolores Neighborhood, San Francisco, CA"
        },
        {
            "name": "Sarah Jenkins (Community Volunteer)",
            "email": "volunteer@givenearby.org",
            "password": "Password123!",
            "role": "volunteer",
            "phone": "+1-555-0103",
            "verification_status": "verified",
            "trust_score": 96.0,
            "approx_lat": 37.7710,
            "approx_lng": -122.4200,
            "approx_address": "Valencia Corridor, San Francisco, CA"
        },
        {
            "name": "Hope Community Outreach NGO",
            "email": "ngo@givenearby.org",
            "password": "Password123!",
            "role": "ngo",
            "organization_name": "Hope Outreach Community Foundation",
            "phone": "+1-555-0104",
            "verification_status": "verified",
            "trust_score": 98.0,
            "approx_lat": 37.7800,
            "approx_lng": -122.4100,
            "approx_address": "Civic Center Hub, San Francisco, CA"
        },
        {
            "name": "Platform Administrator",
            "email": "admin@givenearby.org",
            "password": "AdminSecurePassword2026!",
            "role": "admin",
            "phone": "+1-555-0199",
            "verification_status": "verified",
            "trust_score": 100.0,
            "approx_lat": 37.7749,
            "approx_lng": -122.4194,
            "approx_address": "San Francisco Central, CA"
        }
    ]

    user_map = {}
    for u in users_data:
        lat = u.pop("approx_lat")
        lng = u.pop("approx_lng")
        pwd = u.pop("password")
        f_lat, f_lng, f_desc = fuzz_coordinates(lat, lng)

        user = User(
            hashed_password=get_password_hash(pwd),
            approx_lat=f_lat,
            approx_lng=f_lng,
            **u
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_map[user.email] = user

    # 3. Seed Donations
    donations_data = [
        {
            "donor": user_map["donor@givenearby.org"],
            "category": cat_map["educational-materials"],
            "title": "Middle School STEM & Algebra Textbooks (Set of 4)",
            "description": "Standard curriculum mathematics and physical science books in excellent condition. Perfect for student starting 8th grade.",
            "condition": "like_new",
            "quantity": 4,
            "unit": "books",
            "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600",
            "exact_lat": 37.7755,
            "exact_lng": -122.4180,
            "exact_address": "1200 Market St, San Francisco, CA 94102",
            "pickup_radius_km": 8.0,
            "status": "available"
        },
        {
            "donor": user_map["donor@givenearby.org"],
            "category": cat_map["packaged-food"],
            "title": "Unopened Organic Oats & Brown Rice Family Packs (6 kg)",
            "description": "Purchased surplus from grocery co-op. Factory sealed whole oats and organic brown rice bags.",
            "condition": "new",
            "quantity": 6,
            "unit": "kg",
            "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600",
            "exact_lat": 37.7735,
            "exact_lng": -122.4160,
            "exact_address": "350 10th St, San Francisco, CA 94103",
            "pickup_radius_km": 10.0,
            "is_perishable": True,
            "expires_at": datetime.utcnow() + timedelta(days=90),
            "status": "available"
        },
        {
            "donor": user_map["donor@givenearby.org"],
            "category": cat_map["electronics"],
            "title": "Lenovo ThinkPad 14\" Laptop (Working, Reset to Factory)",
            "description": "Fully functional core i5 with webcam and original charger. Fresh Ubuntu installed, ideal for online homework or coding lessons.",
            "condition": "good",
            "quantity": 1,
            "unit": "device",
            "image_url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600",
            "exact_lat": 37.7745,
            "exact_lng": -122.4190,
            "exact_address": "88 9th St, San Francisco, CA 94103",
            "pickup_radius_km": 12.0,
            "status": "available"
        }
    ]

    don_records = []
    for d in donations_data:
        donor = d.pop("donor")
        cat = d.pop("category")
        e_lat = d["exact_lat"]
        e_lng = d["exact_lng"]
        f_lat, f_lng, f_desc = fuzz_coordinates(e_lat, e_lng)

        donation = Donation(
            donor_id=donor.id,
            category_id=cat.id,
            approx_lat=f_lat,
            approx_lng=f_lng,
            approx_address=f_desc,
            **d
        )
        db.add(donation)
        db.commit()
        db.refresh(donation)
        don_records.append(donation)

    # 4. Seed Urgent Community Requests
    requests_data = [
        {
            "requester": user_map["requester@givenearby.org"],
            "category": cat_map["educational-materials"],
            "title": "Need 8th Grade Math and Science Study Books",
            "description": "Looking for algebra textbooks for my daughter who transferred schools. Cannot afford retail bookstore prices this term.",
            "quantity": 2,
            "unit": "books",
            "urgency": "high",
            "exact_lat": 37.7685,
            "exact_lng": -122.4230,
            "exact_address": "550 Dolores St, San Francisco, CA 94110",
            "max_distance_km": 10.0,
            "status": "open"
        },
        {
            "requester": user_map["ngo@givenearby.org"],
            "category": cat_map["packaged-food"],
            "title": "Urgent Pantry Staples for Weekend Community Distribution",
            "description": "Emergency food pantry serving 45 families this Saturday. Urgently collecting non-perishable grains, rice, and oats.",
            "quantity": 10,
            "unit": "kg",
            "urgency": "emergency",
            "exact_lat": 37.7810,
            "exact_lng": -122.4120,
            "exact_address": "201 Van Ness Ave, San Francisco, CA 94102",
            "max_distance_km": 15.0,
            "status": "open"
        }
    ]

    req_records = []
    for r in requests_data:
        requester = r.pop("requester")
        cat = r.pop("category")
        e_lat = r["exact_lat"]
        e_lng = r["exact_lng"]
        f_lat, f_lng, f_desc = fuzz_coordinates(e_lat, e_lng)

        need_score = compute_need_priority_score(
            urgency=r["urgency"],
            created_at=datetime.utcnow() - timedelta(days=2),
            category_slug=cat.slug,
            quantity=r["quantity"],
            requester_role=requester.role
        )

        request_obj = Request(
            requester_id=requester.id,
            category_id=cat.id,
            need_priority_score=need_score,
            approx_lat=f_lat,
            approx_lng=f_lng,
            approx_address=f_desc,
            **r
        )
        db.add(request_obj)
        db.commit()
        db.refresh(request_obj)
        req_records.append(request_obj)

    # 5. Automatically compute matches for seeded records
    print("Computing intelligent matches...")
    for don in don_records:
        for req in req_records:
            match_data = calculate_match(don, req)
            if match_data and match_data["total_score"] >= 45.0:
                match = Match(
                    donation_id=don.id,
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
                db.commit()
                print(f"Created match {match.id}: Score {match.total_score}/100 ('{don.title}' <-> '{req.title}')")

    # 6. Global Impact Metrics baseline
    impact = ImpactMetric(
        user_id=None,
        donations_completed=142,
        requests_fulfilled=128,
        people_helped=284,
        items_reused=319,
        kg_food_rescued=412.5,
        kg_waste_diverted=895.0,
        volunteer_deliveries=48,
        volunteer_hours=36.0
    )
    db.add(impact)

    # Add initial notification
    n = Notification(
        user_id=user_map["donor@givenearby.org"].id,
        title="Welcome to GiveNearby!",
        message="Your items can create real, verified impact nearby. Check out active community requests.",
        type="system",
        link="/matches"
    )
    db.add(n)

    db.commit()
    db.close()
    print("GiveNearby database successfully populated with rich seed data!")

if __name__ == "__main__":
    seed_database()
