import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(String(50), default="donor_recipient", nullable=False)  # donor_recipient, volunteer, ngo, admin
    organization_name = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    verification_status = Column(String(30), default="verified")  # pending, verified, rejected
    trust_score = Column(Float, default=75.0)  # 0 to 100
    approx_lat = Column(Float, nullable=True)
    approx_lng = Column(Float, nullable=True)
    approx_address = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    donations = relationship("Donation", back_populates="donor", foreign_keys="Donation.donor_id")
    requests = relationship("Request", back_populates="requester", foreign_keys="Request.requester_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="package")
    is_perishable = Column(Boolean, default=False)
    requires_special_handling = Column(Boolean, default=False)
    avg_weight_kg = Column(Float, default=2.0)  # Used for defensible waste diverted analytics
    urgency_weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    donations = relationship("Donation", back_populates="category")
    requests = relationship("Request", back_populates="category")


class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    condition = Column(String(50), default="good")  # new, like_new, good, fair
    quantity = Column(Integer, default=1)
    unit = Column(String(50), default="items")
    image_url = Column(String(500), nullable=True)
    
    # Public privacy-preserving coordinates (approximate centroid)
    approx_lat = Column(Float, nullable=False)
    approx_lng = Column(Float, nullable=False)
    approx_address = Column(String(255), nullable=False)
    
    # Protected exact coordinates (exchanged strictly upon accepted handover)
    exact_lat = Column(Float, nullable=True)
    exact_lng = Column(Float, nullable=True)
    exact_address = Column(String(255), nullable=True)
    
    pickup_radius_km = Column(Float, default=10.0)
    status = Column(String(50), default="available", index=True)  # available, matched, in_handover, completed, cancelled, expired
    is_perishable = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    donor = relationship("User", back_populates="donations", foreign_keys=[donor_id])
    category = relationship("Category", back_populates="donations")
    matches = relationship("Match", back_populates="donation", cascade="all, delete-orphan")


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    quantity = Column(Integer, default=1)
    unit = Column(String(50), default="items")
    urgency = Column(String(50), default="medium")  # low, medium, high, emergency
    need_priority_score = Column(Float, default=50.0, index=True)  # Computed 0-100
    
    # Public privacy-preserving coordinates
    approx_lat = Column(Float, nullable=False)
    approx_lng = Column(Float, nullable=False)
    approx_address = Column(String(255), nullable=False)
    
    # Protected exact coordinates
    exact_lat = Column(Float, nullable=True)
    exact_lng = Column(Float, nullable=True)
    exact_address = Column(String(255), nullable=True)
    
    max_distance_km = Column(Float, default=15.0)
    status = Column(String(50), default="open", index=True)  # open, matched, in_handover, fulfilled, cancelled, expired
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    requester = relationship("User", back_populates="requests", foreign_keys=[requester_id])
    category = relationship("Category", back_populates="requests")
    matches = relationship("Match", back_populates="request", cascade="all, delete-orphan")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False, index=True)
    
    # Geospatial and multi-factor transparent scores
    distance_km = Column(Float, nullable=False)
    category_score = Column(Float, default=100.0)
    distance_score = Column(Float, default=0.0)
    urgency_score = Column(Float, default=0.0)
    need_score = Column(Float, default=0.0)
    trust_score = Column(Float, default=0.0)
    availability_score = Column(Float, default=0.0)
    total_score = Column(Float, nullable=False, index=True)  # 0 to 100
    
    match_rationale = Column(JSON, nullable=True)  # Structured explanation bullets
    status = Column(String(50), default="suggested", index=True)  # suggested, accepted_by_recipient, accepted_by_donor, confirmed, declined, cancelled, completed
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    donation = relationship("Donation", back_populates="matches")
    request = relationship("Request", back_populates="matches")
    handover = relationship("Handover", back_populates="match", uselist=False, cascade="all, delete-orphan")


class Handover(Base):
    __tablename__ = "handovers"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), unique=True, nullable=False)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    safe_pickup_location = Column(String(255), nullable=False)
    scheduled_time = Column(DateTime, nullable=True)
    verification_code = Column(String(20), nullable=False)  # 6-digit cryptographic OTP
    
    status = Column(String(50), default="scheduled", index=True)  # scheduled, in_progress, completed, failed, cancelled
    donor_confirmed = Column(Boolean, default=False)
    recipient_confirmed = Column(Boolean, default=False)
    volunteer_confirmed = Column(Boolean, default=False)
    completion_notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    match = relationship("Match", back_populates="handover")
    ratings = relationship("Rating", back_populates="handover", cascade="all, delete-orphan")
    volunteer_tasks = relationship("VolunteerTask", back_populates="handover", cascade="all, delete-orphan")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    handover_id = Column(Integer, ForeignKey("handovers.id"), nullable=False, index=True)
    rater_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rated_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    feedback = Column(Text, nullable=True)
    punctuality = Column(Integer, default=5)
    item_accuracy = Column(Integer, default=5)
    kindness = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    handover = relationship("Handover", back_populates="ratings")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reported_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    entity_type = Column(String(50), nullable=False)  # user, donation, request, handover
    entity_id = Column(Integer, nullable=False)
    reason = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)
    status = Column(String(50), default="pending", index=True)  # pending, reviewing, resolved, dismissed
    admin_notes = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # match_found, match_accepted, handover_scheduled, handover_completed, rating_received
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="notifications")


class VolunteerTask(Base):
    __tablename__ = "volunteer_tasks"

    id = Column(Integer, primary_key=True, index=True)
    handover_id = Column(Integer, ForeignKey("handovers.id"), nullable=False, index=True)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    status = Column(String(50), default="available", index=True)  # available, accepted, picked_up, in_transit, delivered, cancelled
    pickup_address = Column(String(255), nullable=False)
    dropoff_address = Column(String(255), nullable=False)
    distance_km = Column(Float, default=3.5)
    estimated_hours = Column(Float, default=0.75)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    handover = relationship("Handover", back_populates="volunteer_tasks")


class ImpactMetric(Base):
    __tablename__ = "impact_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Null for global
    donations_completed = Column(Integer, default=0)
    requests_fulfilled = Column(Integer, default=0)
    people_helped = Column(Integer, default=0)
    items_reused = Column(Integer, default=0)
    kg_food_rescued = Column(Float, default=0.0)
    kg_waste_diverted = Column(Float, default=0.0)
    volunteer_deliveries = Column(Integer, default=0)
    volunteer_hours = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
