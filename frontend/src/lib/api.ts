// GiveNearby Frontend API Client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "donor_recipient" | "volunteer" | "ngo" | "admin";
  organization_name?: string;
  bio?: string;
  verification_status: "pending" | "verified" | "rejected";
  trust_score: number;
  approx_lat?: number;
  approx_lng?: number;
  approx_address?: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  is_perishable: boolean;
  requires_special_handling: boolean;
  avg_weight_kg: number;
  urgency_weight: number;
}

export interface Donation {
  id: number;
  donor_id: number;
  category_id: number;
  title: string;
  description: string;
  condition: "new" | "like_new" | "good" | "fair";
  quantity: number;
  unit: string;
  image_url?: string;
  approx_lat: number;
  approx_lng: number;
  approx_address: string;
  exact_lat?: number;
  exact_lng?: number;
  exact_address?: string;
  pickup_radius_km: number;
  status: "available" | "matched" | "in_handover" | "completed" | "cancelled" | "expired";
  is_perishable: boolean;
  expires_at?: string;
  created_at: string;
  category?: Category;
  donor_name?: string;
  donor_trust_score?: number;
}

export interface RequestItem {
  id: number;
  requester_id: number;
  category_id: number;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  urgency: "low" | "medium" | "high" | "emergency";
  need_priority_score: number;
  approx_lat: number;
  approx_lng: number;
  approx_address: string;
  exact_lat?: number;
  exact_lng?: number;
  exact_address?: string;
  max_distance_km: number;
  status: "open" | "matched" | "in_handover" | "fulfilled" | "cancelled" | "expired";
  created_at: string;
  category?: Category;
  requester_name?: string;
  requester_trust_score?: number;
}

export interface MatchItem {
  id: number;
  donation_id: number;
  request_id: number;
  distance_km: number;
  category_score: number;
  distance_score: number;
  urgency_score: number;
  need_score: number;
  trust_score: number;
  availability_score: number;
  total_score: number;
  match_rationale: string[];
  status: "suggested" | "accepted_by_recipient" | "accepted_by_donor" | "confirmed" | "declined" | "cancelled" | "completed";
  created_at: string;
  donation?: Donation;
  request?: RequestItem;
}

export interface Handover {
  id: number;
  match_id: number;
  donor_id: number;
  recipient_id: number;
  volunteer_id?: number;
  safe_pickup_location: string;
  scheduled_time?: string;
  verification_code?: string;
  status: "scheduled" | "in_progress" | "completed" | "failed" | "cancelled";
  donor_confirmed: boolean;
  recipient_confirmed: boolean;
  volunteer_confirmed: boolean;
  completed_at?: string;
  created_at: string;
  donation_title?: string;
  donor_name?: string;
  recipient_name?: string;
}

export interface ImpactSummary {
  donations_completed: number;
  requests_fulfilled: number;
  people_helped: number;
  items_reused: number;
  kg_food_rescued: number;
  kg_waste_diverted: number;
  volunteer_deliveries: number;
  volunteer_hours: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface VolunteerTask {
  id: number;
  handover_id: number;
  volunteer_id?: number;
  status: "available" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled";
  pickup_address: string;
  dropoff_address: string;
  distance_km: number;
  estimated_hours: number;
  notes?: string;
  created_at: string;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("givenearby_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = "Network request failed";
    try {
      const err = await response.json();
      errMessage = err.detail || JSON.stringify(err);
    } catch {
      errMessage = response.statusText;
    }
    throw new Error(errMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: any) => request<{ access_token: string; token_type: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) => request<{ access_token: string; token_type: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request<User>("/auth/me"),
  updateProfile: (data: any) => request<User>("/auth/me", { method: "PUT", body: JSON.stringify(data) }),

  // Categories
  getCategories: () => request<Category[]>("/categories"),

  // Donations
  getDonations: (params?: { category_id?: number; condition?: string; status_filter?: string; lat?: number; lng?: number; radius_km?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
      });
    }
    return request<Donation[]>(`/donations?${query.toString()}`);
  },
  getDonation: (id: number) => request<Donation>(`/donations/${id}`),
  createDonation: (data: any) => request<Donation>("/donations", { method: "POST", body: JSON.stringify(data) }),
  getMyDonations: () => request<Donation[]>("/donations/my"),
  updateDonation: (id: number, data: any) => request<Donation>(`/donations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDonation: (id: number) => request<void>(`/donations/${id}`, { method: "DELETE" }),

  // Requests
  getRequests: (params?: { category_id?: number; urgency?: string; status_filter?: string; lat?: number; lng?: number; radius_km?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
      });
    }
    return request<RequestItem[]>(`/requests?${query.toString()}`);
  },
  getRequest: (id: number) => request<RequestItem>(`/requests/${id}`),
  createRequest: (data: any) => request<RequestItem>("/requests", { method: "POST", body: JSON.stringify(data) }),
  getMyRequests: () => request<RequestItem[]>("/requests/my"),
  updateRequest: (id: number, data: any) => request<RequestItem>(`/requests/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRequest: (id: number) => request<void>(`/requests/${id}`, { method: "DELETE" }),

  // Matches
  getMatches: (status_filter?: string) => {
    const q = status_filter ? `?status_filter=${status_filter}` : "";
    return request<MatchItem[]>(`/matches${q}`);
  },
  getMatch: (id: number) => request<MatchItem>(`/matches/${id}`),
  actOnMatch: (id: number, action: "accept" | "decline") => request<MatchItem>(`/matches/${id}/action`, { method: "POST", body: JSON.stringify({ action }) }),

  // Handovers
  getHandover: (id: number) => request<Handover>(`/handovers/${id}`),
  getSafePoints: (id: number) => request<{ safe_points: Array<{ name: string; type: string; note: string }> }>(`/handovers/${id}/safe-points`),
  scheduleHandover: (id: number, data: { safe_pickup_location: string; scheduled_time?: string }) => request<Handover>(`/handovers/${id}/schedule`, { method: "POST", body: JSON.stringify(data) }),
  verifyHandover: (id: number, verification_code: string) => request<Handover>(`/handovers/${id}/verify`, { method: "POST", body: JSON.stringify({ verification_code }) }),

  // Ratings
  createRating: (data: { handover_id: number; rated_user_id: number; rating: number; feedback?: string; punctuality?: number; item_accuracy?: number; kindness?: number }) => request<any>("/ratings", { method: "POST", body: JSON.stringify(data) }),
  getUserRatings: (userId: number) => request<any[]>(`/ratings/user/${userId}`),

  // Reports
  createReport: (data: { reported_user_id?: number; entity_type: string; entity_id: number; reason: string; details: string }) => request<any>("/reports", { method: "POST", body: JSON.stringify(data) }),
  getReports: (status_filter?: string) => request<any[]>(`/reports${status_filter ? `?status_filter=${status_filter}` : ""}`),
  resolveReport: (id: number, action: "resolve" | "dismiss", admin_notes?: string) => request<any>(`/reports/${id}/resolve?action=${action}${admin_notes ? `&admin_notes=${encodeURIComponent(admin_notes)}` : ""}`, { method: "POST" }),

  // Volunteers
  getVolunteerTasks: (status_filter?: string) => request<VolunteerTask[]>(`/volunteers/tasks${status_filter ? `?status_filter=${status_filter}` : ""}`),
  acceptVolunteerTask: (taskId: number) => request<VolunteerTask>(`/volunteers/tasks/${taskId}/accept`, { method: "POST" }),
  updateVolunteerTaskStatus: (taskId: number, status: string) => request<VolunteerTask>(`/volunteers/tasks/${taskId}/status?status_update=${status}`, { method: "POST" }),

  // Organizations
  getOrganizations: () => request<User[]>("/organizations"),
  getOrganizationRequests: (id: number) => request<RequestItem[]>(`/organizations/${id}/requests`),

  // Impact
  getImpactSummary: () => request<ImpactSummary>("/impact/summary"),

  // Notifications
  getNotifications: () => request<NotificationItem[]>("/notifications"),
  markNotificationRead: (id: number) => request<NotificationItem>(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => request<any>("/notifications/read-all", { method: "PUT" }),

  // Admin
  getAdminStats: () => request<any>("/admin/stats"),
  getAdminUsers: () => request<User[]>("/admin/users"),
  verifyUser: (id: number, status: string) => request<User>(`/admin/users/${id}/verify?verification_status=${status}`, { method: "PUT" }),
  toggleUserStatus: (id: number, isActive: boolean) => request<User>(`/admin/users/${id}/status?is_active=${isActive}`, { method: "PUT" }),

  // AI Assist
  suggestCategory: (title: string, description: string = "") => request<{
    suggested_category_slug: string;
    suggested_category_name: string;
    suggested_condition: string;
    confidence: number;
    reasoning: string;
  }>("/ai/suggest-category", { method: "POST", body: JSON.stringify({ title, description }) }),
};
