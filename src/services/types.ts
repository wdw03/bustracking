// ============================================================================
// BusTracker: TypeScript Types — matches Supabase schema exactly
// Source: supabase/migrations/003_tables.sql + 002_enums.sql
// ============================================================================

// ── Enums (from 002_enums.sql) ──

export type UserRole = "super_admin" | "school_admin" | "parent" | "driver";
export type SchoolStatus = "pending" | "approved" | "rejected" | "blocked";
export type ContactType = "parent" | "driver";
export type SubscriptionStatusEnum = "trial" | "active" | "expired" | "cancelled";
export type PlanType = "free_trial" | "monthly" | "quarterly" | "yearly";
export type TripType = "pickup" | "drop";
export type TripStatus = "in_progress" | "completed" | "cancelled";
export type NotificationType = "bus_nearby" | "subscription" | "system" | "school_update" | "trip_started" | "trip_ended";
export type PlatformType = "android" | "ios" | "web";

// ── Table Types (from 003_tables.sql) ──

export type Profile = {
  id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type School = {
  id: string;
  name: string;
  admin_user_id: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  principal_name: string | null;
  principal_phone: string | null;
  gst_number: string | null;
  website: string | null;
  logo_url: string | null;
  status: SchoolStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SchoolMember = {
  id: string;
  school_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Bus = {
  id: string;
  school_id: string;
  bus_number: string;
  route_name: string | null;
  capacity: number | null;
  model: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Child = {
  id: string;
  school_id: string;
  full_name: string;
  class: string | null;
  section: string | null;
  roll_number: string | null;
  pickup_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  assigned_bus_id: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthorizedContact = {
  id: string;
  school_id: string;
  phone: string;
  contact_type: ContactType;
  child_id: string | null;
  is_registered: boolean;
  created_at: string;
  updated_at: string;
};

export type ChildParent = {
  id: string;
  child_id: string;
  parent_user_id: string;
  relationship: "father" | "mother" | "guardian" | "other";
  is_primary: boolean;
  created_at: string;
};

export type Driver = {
  id: string;
  user_id: string;
  school_id: string;
  assigned_bus_id: string | null;
  license_number: string | null;
  license_expiry: string | null;
  experience_years: number;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusLiveLocation = {
  bus_id: string;
  driver_id: string | null;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number | null;
  is_live: boolean;
  updated_at: string;
};

export type Trip = {
  id: string;
  bus_id: string;
  driver_id: string;
  school_id: string;
  trip_type: TripType;
  started_at: string | null;
  ended_at: string | null;
  status: TripStatus;
  created_at: string;
};

export type TripLocation = {
  id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  recorded_at: string;
};

export type BusStop = {
  id: string;
  bus_id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
  stop_order: number;
  scheduled_time: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  features: any[];
  google_product_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  school_id: string | null;
  plan_id: string | null;
  plan_type: PlanType;
  status: SubscriptionStatusEnum;
  trial_start: string | null;
  trial_end: string | null;
  paid_start: string | null;
  paid_end: string | null;
  google_play_order_id: string | null;
  google_purchase_token: string | null;
  amount_paid: number;
  created_at: string;
  updated_at: string;
};

export type PushToken = {
  id: string;
  user_id: string;
  token: string;
  platform: PlatformType;
  device_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_user_id: string | null;
  school_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

// ── API Response Helpers ──

export type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ── Dashboard RPC Response Types ──

export type ParentDashboardData = {
  profile: Pick<Profile, "id" | "phone" | "full_name" | "avatar_url" | "role"> & {
    relation?: string;
    address?: string;
  };
  subscription: {
    has_subscription?: boolean;
    is_active?: boolean;
    plan_type?: PlanType;
    status?: SubscriptionStatusEnum;
    trial_end?: string;
    paid_end?: string;
    trial_days_left?: number;
    plan_name?: string;
    can_track?: boolean;
    expires_at?: string | null;
  };
  school?: {
    id?: string;
    name?: string;
    phone?: string;
    address?: string;
  };
  children: Array<{
    id: string;
    full_name: string;
    class: string | null;
    section: string | null;
    roll_number?: string | null;
    admission_number?: string | null;
    blood_group?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    assigned_bus_id: string | null;
    bus_number: string | null;
    route_name: string | null;
    vehicle_number?: string | null;
    driver_name?: string | null;
    driver_phone?: string | null;
    driver_exp?: string | null;
    school_name?: string | null;
    school_phone?: string | null;
    school_address?: string | null;
    photo_url: string | null;
  }>;
  unread_notifications: number;
};

export type DriverDashboardData = {
  profile: Pick<Profile, "id" | "full_name" | "phone" | "avatar_url">;
  driver: {
    id: string;
    assigned_bus_id: string | null;
    license_number: string | null;
    rating: number;
  };
  bus: {
    id: string;
    bus_number: string;
    route_name: string | null;
    capacity: number | null;
  } | null;
  school: {
    id: string;
    name: string;
    phone: string;
  } | null;
  active_trip: {
    id: string;
    trip_type: TripType;
    started_at: string;
  } | null;
  students_on_bus: Array<{
    id: string;
    full_name: string;
    class: string | null;
    section: string | null;
    pickup_address: string | null;
  }>;
};

export type SchoolDashboardData = {
  school: School;
  stats: {
    student_count: number;
    bus_count: number;
    driver_count: number;
    active_trips: number;
  };
  active_buses: Array<{
    bus_id: string;
    bus_number: string;
    latitude: number;
    longitude: number;
    speed: number;
    is_live: boolean;
    updated_at: string;
  }>;
};
