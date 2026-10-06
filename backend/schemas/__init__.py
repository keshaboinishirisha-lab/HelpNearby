from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


# User & Auth Schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None
    role: Optional[str] = "donor_recipient"  # donor_recipient, volunteer, ngo
    organization_name: Optional[str] = None
    approx_lat: Optional[float] = 37.7749
    approx_lng: Optional[float] = -122.4194
    approx_address: Optional[str] = "San Francisco, CA"


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    organization_name: Optional[str] = None
    approx_lat: Optional[float] = None
    approx_lng: Optional[float] = None
    approx_address: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    organization_name: Optional[str] = None
    bio: Optional[str] = None
    verification_status: str
    trust_score: float
    approx_lat: Optional[float] = None
    approx_lng: Optional[float] = None
    approx_address: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Category Schemas
class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: str
    is_perishable: bool
    requires_special_handling: bool
    avg_weight_kg: float
    urgency_weight: float

    model_config = ConfigDict(from_attributes=True)


class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = "package"
    is_perishable: Optional[bool] = False
    requires_special_handling: Optional[bool] = False
    avg_weight_kg: Optional[float] = 2.0
    urgency_weight: Optional[float] = 1.0


# Donation Schemas
class DonationCreate(BaseModel):
    category_id: int
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    condition: str = "good"  # new, like_new, good, fair
    quantity: int = Field(default=1, ge=1)
    unit: str = "items"
    image_url: Optional[str] = None
    pickup_radius_km: float = 10.0
    is_perishable: bool = False
    expires_at: Optional[datetime] = None
    
    # Coordinates: Exact coordinates are stored securely; approximate coordinates are derived for public display
    exact_lat: float
    exact_lng: float
    exact_address: str


class DonationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    quantity: Optional[int] = None
    pickup_radius_km: Optional[float] = None
    status: Optional[str] = None
    image_url: Optional[str] = None


class DonationPublicResponse(BaseModel):
    id: int
    donor_id: int
    category_id: int
    title: str
    description: str
    condition: str
    quantity: int
    unit: str
    image_url: Optional[str] = None
    approx_lat: float
    approx_lng: float
    approx_address: str
    pickup_radius_km: float
    status: str
    is_perishable: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    category: Optional[CategoryResponse] = None
    donor_name: Optional[str] = None
    donor_trust_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class DonationDetailResponse(DonationPublicResponse):
    exact_lat: Optional[float] = None
    exact_lng: Optional[float] = None
    exact_address: Optional[str] = None


# Request Schemas
class RequestCreate(BaseModel):
    category_id: int
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    quantity: int = Field(default=1, ge=1)
    unit: str = "items"
    urgency: str = "medium"  # low, medium, high, emergency
    max_distance_km: float = 15.0
    
    exact_lat: float
    exact_lng: float
    exact_address: str


class RequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[int] = None
    urgency: Optional[str] = None
    status: Optional[str] = None


class RequestPublicResponse(BaseModel):
    id: int
    requester_id: int
    category_id: int
    title: str
    description: str
    quantity: int
    unit: str
    urgency: str
    need_priority_score: float
    approx_lat: float
    approx_lng: float
    approx_address: str
    max_distance_km: float
    status: str
    created_at: datetime
    category: Optional[CategoryResponse] = None
    requester_name: Optional[str] = None
    requester_trust_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class RequestDetailResponse(RequestPublicResponse):
    exact_lat: Optional[float] = None
    exact_lng: Optional[float] = None
    exact_address: Optional[str] = None


# Match Schemas
class MatchResponse(BaseModel):
    id: int
    donation_id: int
    request_id: int
    distance_km: float
    category_score: float
    distance_score: float
    urgency_score: float
    need_score: float
    trust_score: float
    availability_score: float
    total_score: float
    match_rationale: List[str]
    status: str
    created_at: datetime
    donation: Optional[DonationPublicResponse] = None
    request: Optional[RequestPublicResponse] = None

    model_config = ConfigDict(from_attributes=True)


class MatchAction(BaseModel):
    action: str  # accept, decline


# Handover Schemas
class HandoverSchedule(BaseModel):
    safe_pickup_location: str
    scheduled_time: Optional[datetime] = None


class HandoverVerify(BaseModel):
    verification_code: str  # 6-digit OTP provided by recipient


class HandoverResponse(BaseModel):
    id: int
    match_id: int
    donor_id: int
    recipient_id: int
    volunteer_id: Optional[int] = None
    safe_pickup_location: str
    scheduled_time: Optional[datetime] = None
    verification_code: Optional[str] = None  # Returned only to recipient/volunteer or donor after verification
    status: str
    donor_confirmed: bool
    recipient_confirmed: bool
    volunteer_confirmed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    donation_title: Optional[str] = None
    donor_name: Optional[str] = None
    recipient_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Rating Schemas
class RatingCreate(BaseModel):
    handover_id: int
    rated_user_id: int
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = None
    punctuality: int = Field(default=5, ge=1, le=5)
    item_accuracy: int = Field(default=5, ge=1, le=5)
    kindness: int = Field(default=5, ge=1, le=5)


class RatingResponse(BaseModel):
    id: int
    handover_id: int
    rater_id: int
    rated_user_id: int
    rating: int
    feedback: Optional[str] = None
    punctuality: int
    item_accuracy: int
    kindness: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Report Schemas
class ReportCreate(BaseModel):
    reported_user_id: Optional[int] = None
    entity_type: str  # user, donation, request, handover
    entity_id: int
    reason: str
    details: str


class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    reported_user_id: Optional[int] = None
    entity_type: str
    entity_id: int
    reason: str
    details: str
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Volunteer Task Schemas
class VolunteerTaskResponse(BaseModel):
    id: int
    handover_id: int
    volunteer_id: Optional[int] = None
    status: str
    pickup_address: str
    dropoff_address: str
    distance_km: float
    estimated_hours: float
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Impact Schemas
class ImpactSummary(BaseModel):
    donations_completed: int
    requests_fulfilled: int
    people_helped: int
    items_reused: int
    kg_food_rescued: float
    kg_waste_diverted: float
    volunteer_deliveries: int
    volunteer_hours: float


# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# AI Assistance Schemas
class AICategorySuggestRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    image_url: Optional[str] = None


class AICategorySuggestResponse(BaseModel):
    suggested_category_slug: str
    suggested_category_name: str
    suggested_condition: str
    confidence: float
    reasoning: str
