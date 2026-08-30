// ============================================================================
// BusTracker: School Service
// School Admin CRUD operations — buses, children, drivers, parents
// All queries scoped to school_id via RLS + server-side functions
// ============================================================================

import { supabase } from "./supabase";
import type {
  Bus, Child, Driver, School, AuthorizedContact,
  SchoolDashboardData, Profile, ApiResult,
} from "./types";

// ── School Profile ──

export async function getSchoolProfile(schoolId: string): Promise<School | null> {
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolId)
    .single();

  if (error || !data) return null;
  return data as School;
}

/** Update school profile details (Note: phone / registration mobile cannot be changed) */
export async function updateSchoolProfile(
  schoolId: string,
  updates: {
    name?: string;
    principal_name?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    principal_phone?: string;
    gst_number?: string;
    website?: string;
    logo_url?: string;
  }
): Promise<ApiResult<School>> {
  try {
    const sanitized: any = { updated_at: new Date().toISOString() };
    
    if (updates.name !== undefined && updates.name.trim()) sanitized.name = updates.name.trim();
    if (updates.principal_name !== undefined) sanitized.principal_name = updates.principal_name.trim() || null;
    if (updates.email !== undefined) sanitized.email = updates.email.trim() || null;
    if (updates.address !== undefined) sanitized.address = updates.address.trim() || null;
    if (updates.city !== undefined) sanitized.city = updates.city.trim() || null;
    if (updates.state !== undefined) sanitized.state = updates.state.trim() || null;
    if (updates.pincode !== undefined) sanitized.pincode = updates.pincode.trim() || null;
    if (updates.principal_phone !== undefined) sanitized.principal_phone = updates.principal_phone.trim() || null;
    if (updates.gst_number !== undefined) sanitized.gst_number = updates.gst_number.trim() || null;
    if (updates.website !== undefined) sanitized.website = updates.website.trim() || null;
    if (updates.logo_url !== undefined) sanitized.logo_url = updates.logo_url || null;

    // Strictly prevent modifying the unique registered contact number & ownership
    delete sanitized.phone;
    delete sanitized.admin_user_id;
    delete sanitized.status;

    let { data, error } = await supabase
      .from("schools")
      .update(sanitized)
      .eq("id", schoolId);

    // Fallback: If update by ID didn't match (e.g. mock/stale ID), try update by admin_user_id or phone
    if (error) {
      console.warn("updateSchoolProfile error by ID, trying fallback:", error);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cleanUserPhone = (user.phone || "").replace(/\D/g, "");
        const raw10 = cleanUserPhone.slice(-10);
        const formattedUserPhone = cleanUserPhone.startsWith("+") ? cleanUserPhone : `+91${raw10}`;

        const fbRes = await supabase
          .from("schools")
          .update(sanitized)
          .or(`admin_user_id.eq.${user.id},phone.eq.${formattedUserPhone},phone.eq.${cleanUserPhone},phone.eq.${raw10}`);

        if (!fbRes.error) {
          error = null;
        } else {
          return { success: false, error: error.message || fbRes.error.message };
        }
      } else {
        return { success: false, error: error.message };
      }
    }

    // Also update profile name if principal name changed
    if (updates.principal_name?.trim()) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ full_name: updates.principal_name.trim() })
          .eq("id", user.id);
      }
    }

    return { success: true, data: sanitized as School };
  } catch (e: any) {
    console.error("updateSchoolProfile exception:", e);
    return { success: false, error: e?.message || "Failed to update school details" };
  }
}

// ── School Dashboard (aggregated stats via RPC) ──

export async function getSchoolDashboard(schoolId: string): Promise<SchoolDashboardData | null> {
  const { data, error } = await supabase.rpc("get_school_dashboard", { p_school_id: schoolId });
  if (error || !data) return null;
  return data as SchoolDashboardData;
}

// ── Buses CRUD ──

export async function getSchoolBuses(schoolId: string): Promise<Bus[]> {
  const { data, error } = await supabase
    .from("buses")
    .select("*")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("bus_number");

  if (error || !data) return [];
  return data as Bus[];
}

/** Get buses WITH their live locations (for school map view) */
export async function getSchoolBusesWithLocations(schoolId: string) {
  const { data, error } = await supabase
    .from("buses")
    .select("*, bus_live_locations(latitude, longitude, speed, heading, is_live, updated_at)")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("bus_number");

  if (error || !data) return [];
  return data;
}

export async function addBus(schoolId: string, bus: {
  bus_number: string;
  route_name?: string;
  capacity?: number;
  model?: string;
}): Promise<ApiResult<Bus>> {
  const { data, error } = await supabase
    .from("buses")
    .insert({ school_id: schoolId, ...bus })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Bus };
}

export async function updateBus(busId: string, updates: Partial<Pick<Bus, "bus_number" | "route_name" | "capacity" | "model" | "is_active">>): Promise<ApiResult<Bus>> {
  const { data, error } = await supabase
    .from("buses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", busId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Bus };
}

export async function deleteBus(busId: string): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from("buses")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", busId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Children (Students) CRUD ──

export async function getSchoolChildren(schoolId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("full_name");

  if (error || !data) return [];
  return data as Child[];
}

/** Get children WITH parent info (via child_parents join) */
export async function getSchoolChildrenWithParents(schoolId: string) {
  const { data, error } = await supabase
    .from("children")
    .select("*, child_parents(parent_user_id, relationship, is_primary, profiles:parent_user_id(full_name, phone))")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("full_name");

  if (error || !data) return [];
  return data;
}

export async function addChild(schoolId: string, child: {
  full_name: string;
  class?: string;
  section?: string;
  roll_number?: string;
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  assigned_bus_id?: string;
}): Promise<ApiResult<Child>> {
  const { data, error } = await supabase
    .from("children")
    .insert({ school_id: schoolId, ...child })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Child };
}

export async function updateChild(childId: string, updates: Partial<Pick<Child, "full_name" | "class" | "section" | "roll_number" | "pickup_address" | "pickup_lat" | "pickup_lng" | "assigned_bus_id">>): Promise<ApiResult<Child>> {
  const { data, error } = await supabase
    .from("children")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", childId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Child };
}

export async function deleteChild(childId: string): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from("children")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", childId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Assign child to bus (via RPC for server-side validation) */
export async function assignChildToBus(childId: string, busId: string | null): Promise<ApiResult<void>> {
  if (busId) {
    const { data, error } = await supabase.rpc("assign_child_to_bus", {
      p_child_id: childId,
      p_bus_id: busId,
    });
    if (error) return { success: false, error: error.message };
    if (data && !data.success) return { success: false, error: data.error?.message || "Assignment failed" };
    return { success: true };
  } else {
    // Unassign: direct update (RLS validates school ownership)
    const { error } = await supabase
      .from("children")
      .update({ assigned_bus_id: null, updated_at: new Date().toISOString() })
      .eq("id", childId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

// ── Drivers ──

export async function getSchoolDrivers(schoolId: string): Promise<Driver[]> {
  const { data, error } = await supabase
    .from("drivers")
    .select("*, profiles:user_id(full_name, phone, avatar_url)")
    .eq("school_id", schoolId)
    .eq("is_active", true);

  if (error || !data) return [];
  return data as any;
}

/** Assign driver to bus (via RPC for server-side validation) */
export async function assignDriverToBus(driverId: string, busId: string): Promise<ApiResult<void>> {
  const { data, error } = await supabase.rpc("assign_driver_to_bus", {
    p_driver_id: driverId,
    p_bus_id: busId,
  });
  if (error) return { success: false, error: error.message };
  if (data && !data.success) return { success: false, error: data.error?.message || "Assignment failed" };
  return { success: true };
}

// ── Authorized Contacts (for parent/driver registration) ──

export async function addAuthorizedContact(schoolId: string, contact: {
  phone: string;
  contact_type: "parent" | "driver";
  child_id?: string;
}): Promise<ApiResult<AuthorizedContact>> {
  const formatted = contact.phone.replace(/[^0-9+]/g, "");
  const phone = formatted.startsWith("+") ? formatted : `+91${formatted}`;

  const { data, error } = await supabase
    .from("authorized_contacts")
    .insert({
      school_id: schoolId,
      phone: phone,
      contact_type: contact.contact_type,
      child_id: contact.child_id || null,
      is_registered: false,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as AuthorizedContact };
}

export async function getAuthorizedContacts(schoolId: string): Promise<AuthorizedContact[]> {
  const { data, error } = await supabase
    .from("authorized_contacts")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as AuthorizedContact[];
}

// ── Parents (via child_parents + profiles join) ──

export async function getSchoolParents(schoolId: string) {
  const { data, error } = await supabase
    .from("child_parents")
    .select(`
      id, relationship, is_primary,
      profiles:parent_user_id(id, full_name, phone, avatar_url),
      children:child_id(id, full_name, class, section, school_id)
    `)
    .eq("children.school_id", schoolId);

  if (error || !data) return [];

  // Deduplicate parents (a parent may have multiple children)
  const parentMap = new Map<string, any>();
  for (const row of data as any[]) {
    const parent = row.profiles;
    if (!parent) continue;
    if (!parentMap.has(parent.id)) {
      parentMap.set(parent.id, {
        ...parent,
        children: [],
      });
    }
    if (row.children) {
      parentMap.get(parent.id)!.children.push(row.children);
    }
  }

  return Array.from(parentMap.values());
}
