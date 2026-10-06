-- ==============================================================================
-- GiveNearby: Production Database Schema (Supabase PostgreSQL + PostGIS)
-- Architecture: Supabase / PostgreSQL with PostGIS Spatial Extensions & RLS
-- ==============================================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------
-- 1. USERS & ROLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(50) DEFAULT 'donor_recipient' NOT NULL CHECK (role IN ('donor_recipient', 'volunteer', 'ngo', 'admin')),
    organization_name VARCHAR(200),
    bio TEXT,
    verification_status VARCHAR(30) DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    trust_score NUMERIC(5, 2) DEFAULT 75.00 CHECK (trust_score >= 0.0 AND trust_score <= 100.0),
    approx_lat DOUBLE PRECISION,
    approx_lng DOUBLE PRECISION,
    approx_address VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_trust_score ON users(trust_score);

-- ------------------------------------------------------------------------------
-- 2. CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'package' NOT NULL,
    is_perishable BOOLEAN DEFAULT FALSE NOT NULL,
    requires_special_handling BOOLEAN DEFAULT FALSE NOT NULL,
    avg_weight_kg NUMERIC(6, 2) DEFAULT 2.0 NOT NULL,
    urgency_weight NUMERIC(4, 2) DEFAULT 1.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_categories_slug ON categories(slug);

-- ------------------------------------------------------------------------------
-- 3. DONATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity >= 1),
    unit VARCHAR(50) DEFAULT 'items' NOT NULL,
    image_url VARCHAR(500),
    
    -- Public Privacy Coordinates (Approximate Centroid)
    approx_lat DOUBLE PRECISION NOT NULL,
    approx_lng DOUBLE PRECISION NOT NULL,
    approx_address VARCHAR(255) NOT NULL,
    
    -- PostGIS Spatial Geometry for Hyperlocal Distance Calculations
    location_geom GEOMETRY(Point, 4326),
    
    -- Protected Exact Coordinates (Exchanged only upon accepted handover)
    exact_lat DOUBLE PRECISION,
    exact_lng DOUBLE PRECISION,
    exact_address VARCHAR(255),
    
    pickup_radius_km NUMERIC(5, 2) DEFAULT 10.0 NOT NULL,
    status VARCHAR(50) DEFAULT 'available' NOT NULL CHECK (status IN ('available', 'matched', 'in_handover', 'completed', 'cancelled', 'expired')),
    is_perishable BOOLEAN DEFAULT FALSE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_category ON donations(category_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_donations_geom ON donations USING GIST (location_geom);

-- ------------------------------------------------------------------------------
-- 4. REQUESTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity >= 1),
    unit VARCHAR(50) DEFAULT 'items' NOT NULL,
    urgency VARCHAR(50) DEFAULT 'medium' NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
    need_priority_score NUMERIC(5, 2) DEFAULT 50.00 NOT NULL CHECK (need_priority_score >= 0.0 AND need_priority_score <= 100.0),
    
    -- Public Privacy Coordinates
    approx_lat DOUBLE PRECISION NOT NULL,
    approx_lng DOUBLE PRECISION NOT NULL,
    approx_address VARCHAR(255) NOT NULL,
    
    location_geom GEOMETRY(Point, 4326),
    
    -- Protected Exact Coordinates
    exact_lat DOUBLE PRECISION,
    exact_lng DOUBLE PRECISION,
    exact_address VARCHAR(255),
    
    max_distance_km NUMERIC(5, 2) DEFAULT 15.0 NOT NULL,
    status VARCHAR(50) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'matched', 'in_handover', 'fulfilled', 'cancelled', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_requests_requester ON requests(requester_id);
CREATE INDEX idx_requests_category ON requests(category_id);
CREATE INDEX idx_requests_urgency ON requests(urgency);
CREATE INDEX idx_requests_need_score ON requests(need_priority_score DESC);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_geom ON requests USING GIST (location_geom);

-- ------------------------------------------------------------------------------
-- 5. MATCHES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    distance_km NUMERIC(6, 2) NOT NULL,
    category_score NUMERIC(5, 2) DEFAULT 100.0 NOT NULL,
    distance_score NUMERIC(5, 2) DEFAULT 0.0 NOT NULL,
    urgency_score NUMERIC(5, 2) DEFAULT 0.0 NOT NULL,
    need_score NUMERIC(5, 2) DEFAULT 0.0 NOT NULL,
    trust_score NUMERIC(5, 2) DEFAULT 0.0 NOT NULL,
    availability_score NUMERIC(5, 2) DEFAULT 0.0 NOT NULL,
    total_score NUMERIC(5, 2) NOT NULL CHECK (total_score >= 0.0 AND total_score <= 100.0),
    match_rationale JSONB,
    status VARCHAR(50) DEFAULT 'suggested' NOT NULL CHECK (status IN ('suggested', 'accepted_by_recipient', 'accepted_by_donor', 'confirmed', 'declined', 'cancelled', 'completed')),
    volunteer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_donation_request_match UNIQUE (donation_id, request_id)
);

CREATE INDEX idx_matches_donation ON matches(donation_id);
CREATE INDEX idx_matches_request ON matches(request_id);
CREATE INDEX idx_matches_total_score ON matches(total_score DESC);
CREATE INDEX idx_matches_status ON matches(status);

-- ------------------------------------------------------------------------------
-- 6. SAFE HANDOVERS (OTP / Verification Cycle)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS handovers (
    id SERIAL PRIMARY KEY,
    match_id INTEGER UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    volunteer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    safe_pickup_location VARCHAR(255) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    verification_code VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled')),
    donor_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    recipient_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    volunteer_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    completion_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_handovers_match ON handovers(match_id);
CREATE INDEX idx_handovers_status ON handovers(status);

-- ------------------------------------------------------------------------------
-- 7. RATINGS & TRUST VERIFICATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    handover_id INTEGER NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
    rater_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    rated_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    punctuality INTEGER DEFAULT 5 CHECK (punctuality >= 1 AND punctuality <= 5),
    item_accuracy INTEGER DEFAULT 5 CHECK (item_accuracy >= 1 AND item_accuracy <= 5),
    kindness INTEGER DEFAULT 5 CHECK (kindness >= 1 AND kindness <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_handover_rater UNIQUE (handover_id, rater_id)
);

CREATE INDEX idx_ratings_rated_user ON ratings(rated_user_id);

-- ------------------------------------------------------------------------------
-- 8. REPORTS & MODERATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reported_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_reports_status ON reports(status);

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- ------------------------------------------------------------------------------
-- 10. VOLUNTEER TASKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteer_tasks (
    id SERIAL PRIMARY KEY,
    handover_id INTEGER NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
    volunteer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
    pickup_address VARCHAR(255) NOT NULL,
    dropoff_address VARCHAR(255) NOT NULL,
    distance_km NUMERIC(5, 2) DEFAULT 3.5,
    estimated_hours NUMERIC(4, 2) DEFAULT 0.75,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_volunteer_tasks_status ON volunteer_tasks(status);

-- ------------------------------------------------------------------------------
-- 11. IMPACT METRICS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS impact_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    donations_completed INTEGER DEFAULT 0 NOT NULL,
    requests_fulfilled INTEGER DEFAULT 0 NOT NULL,
    people_helped INTEGER DEFAULT 0 NOT NULL,
    items_reused INTEGER DEFAULT 0 NOT NULL,
    kg_food_rescued NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    kg_waste_diverted NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    volunteer_deliveries INTEGER DEFAULT 0 NOT NULL,
    volunteer_hours NUMERIC(8, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Donations: Anyone can view active donations
CREATE POLICY "Public donations viewable by all" ON donations FOR SELECT USING (status = 'available' OR status = 'matched');
-- Requests: Anyone can view open requests
CREATE POLICY "Public requests viewable by all" ON requests FOR SELECT USING (status = 'open' OR status = 'matched');
-- Notifications: Only owner can view notifications
CREATE POLICY "Users can only read own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
