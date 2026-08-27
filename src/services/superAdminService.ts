// ============================================================================
// BusTracker: Super Admin Service
// ALL real Supabase queries for the Super Admin Panel
// Replaces mockData.ts / mockDataDashboard.ts with live DB data
// ============================================================================

import { supabase } from "./supabase";

// ── Types ──

export interface DashboardStats {
    totalSchools: number;
    activeSchools: number;
    pendingSchools: number;
    blockedSchools: number;
    totalParents: number;
    totalStudents: number;
    totalDrivers: number;
    totalBuses: number;
    runningBuses: number;
    activeSubscriptions: number;
    totalRevenue: number;
    pendingWithdrawals: number;
}

export interface SchoolRecord {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    principal_name: string | null;
    principal_phone: string | null;
    status: string;
    admin_user_id: string | null;
    created_at: string;
    approved_at: string | null;
    // Aggregated counts (joined)
    bus_count?: number;
    driver_count?: number;
    student_count?: number;
    parent_count?: number;
    admin_name?: string;
}

export interface WithdrawalRecord {
    id: string;
    school_id: string;
    school_name?: string;
    requested_by: string | null;
    requester_name?: string;
    amount: number;
    bank_name: string | null;
    account_number: string | null;
    ifsc_code: string | null;
    account_holder: string | null;
    upi_id: string | null;
    notes: string | null;
    status: string;
    rejection_reason: string | null;
    processed_at: string | null;
    created_at: string;
}

export interface SubscriptionRecord {
    id: string;
    user_id: string;
    user_name?: string;
    user_phone?: string;
    plan_type: string;
    status: string;
    paid_start: string | null;
    paid_end: string | null;
    amount_paid: number | null;
    google_play_order_id: string | null;
    created_at: string;
}

// ════════════════════════════════════════════════════════════
// DASHBOARD STATS — Real COUNT queries from Supabase
// ════════════════════════════════════════════════════════════

export async function getDashboardStats(): Promise<DashboardStats> {
    const [
        schoolsRes,
        parentsRes,
        studentsRes,
        driversRes,
        busesRes,
        runningBusesRes,
        activeSubsRes,
        revenueRes,
        pendingWithdrawalsRes,
    ] = await Promise.all([
        supabase.from("schools").select("status", { count: "exact", head: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "parent"),
        supabase.from("children").select("id", { count: "exact", head: true }),
        supabase.from("drivers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("buses").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("bus_live_locations").select("id", { count: "exact", head: true }).eq("is_broadcasting", true),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("amount_paid").eq("status", "active"),
        supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    // Count school statuses from the fetched data
    const schoolData = schoolsRes.data || [];
    const activeSchools = schoolData.filter((s: any) => s.status === "approved" || s.status === "active").length;
    const pendingSchools = schoolData.filter((s: any) => s.status === "pending").length;
    const blockedSchools = schoolData.filter((s: any) => s.status === "blocked").length;

    // Sum revenue
    const totalRevenue = (revenueRes.data || []).reduce(
        (sum: number, s: any) => sum + (parseFloat(s.amount_paid) || 0), 0
    );

    return {
        totalSchools: schoolsRes.count ?? schoolData.length,
        activeSchools,
        pendingSchools,
        blockedSchools,
        totalParents: parentsRes.count ?? 0,
        totalStudents: studentsRes.count ?? 0,
        totalDrivers: driversRes.count ?? 0,
        totalBuses: busesRes.count ?? 0,
        runningBuses: runningBusesRes.count ?? 0,
        activeSubscriptions: activeSubsRes.count ?? 0,
        totalRevenue,
        pendingWithdrawals: pendingWithdrawalsRes.count ?? 0,
    };
}

// ════════════════════════════════════════════════════════════
// SCHOOL MANAGEMENT
// ════════════════════════════════════════════════════════════

export async function getAllSchools(): Promise<SchoolRecord[]> {
    const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as SchoolRecord[];
}

export async function getSchoolRequests(): Promise<SchoolRecord[]> {
    const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as SchoolRecord[];
}

export async function approveSchool(schoolId: string): Promise<{ success: boolean; error?: string }> {
    const { data: schoolData, error } = await supabase
        .from("schools")
        .update({
            status: "approved",
            approved_at: new Date().toISOString(),
        })
        .eq("id", schoolId)
        .select("id, admin_user_id")
        .single();

    if (error) return { success: false, error: error.message };

    // Also activate school members if any exist
    await supabase
        .from("school_members")
        .update({ is_active: true })
        .eq("school_id", schoolId);

    // Activate the school admin profile if linked
    if (schoolData?.admin_user_id) {
        await supabase
            .from("profiles")
            .update({ is_active: true })
            .eq("id", schoolData.admin_user_id);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
        actor_user_id: (await supabase.auth.getUser()).data?.user?.id,
        action: "school_approved",
        entity_type: "school",
        entity_id: schoolId,
        metadata: { approved_at: new Date().toISOString() },
    });

    return { success: true };
}

export async function rejectSchool(schoolId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("schools")
        .update({ status: "rejected" })
        .eq("id", schoolId);

    if (error) return { success: false, error: error.message };

    // Also mark school members inactive if any exist
    await supabase
        .from("school_members")
        .update({ is_active: false })
        .eq("school_id", schoolId);

    await supabase.from("audit_logs").insert({
        actor_user_id: (await supabase.auth.getUser()).data?.user?.id,
        action: "school_rejected",
        entity_type: "school",
        entity_id: schoolId,
        metadata: { reason: reason || "No reason provided" },
    });

    return { success: true };
}

export async function blockSchool(schoolId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("schools")
        .update({ status: "blocked" })
        .eq("id", schoolId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function unblockSchool(schoolId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("schools")
        .update({ status: "approved" })
        .eq("id", schoolId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function blockUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function unblockUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("id", userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function sendSystemNotification(params: {
    title: string;
    body: string;
    userId?: string;
    schoolId?: string;
    type?: string;
}): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from("notifications").insert({
        user_id: params.userId || (await supabase.auth.getUser()).data?.user?.id,
        title: params.title,
        body: params.body,
        type: params.type || "system",
        is_read: false,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ════════════════════════════════════════════════════════════
// WITHDRAWAL REQUESTS
// ════════════════════════════════════════════════════════════

export async function getWithdrawalRequests(): Promise<WithdrawalRecord[]> {
    const { data, error } = await supabase
        .from("withdrawal_requests")
        .select(`
            *,
            schools!inner(name),
            profiles:requested_by(full_name)
        `)
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
        ...row,
        school_name: row.schools?.name || "Unknown",
        requester_name: row.profiles?.full_name || "Unknown",
    }));
}

export async function approveWithdrawal(withdrawalId: string): Promise<{ success: boolean; error?: string }> {
    const userId = (await supabase.auth.getUser()).data?.user?.id;
    const { error } = await supabase
        .from("withdrawal_requests")
        .update({
            status: "completed",
            processed_by: userId,
            processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

    if (error) return { success: false, error: error.message };

    await supabase.from("audit_logs").insert({
        actor_user_id: userId,
        action: "withdrawal_approved",
        entity_type: "withdrawal_request",
        entity_id: withdrawalId,
    });

    return { success: true };
}

export async function rejectWithdrawal(withdrawalId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const userId = (await supabase.auth.getUser()).data?.user?.id;
    const { error } = await supabase
        .from("withdrawal_requests")
        .update({
            status: "rejected",
            rejection_reason: reason || null,
            processed_by: userId,
            processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

/** School admin: create a withdrawal request for their school */
export async function createWithdrawalRequest(
    schoolId: string,
    amount: number,
    bankDetails: {
        bank_name?: string;
        account_number?: string;
        ifsc_code?: string;
        account_holder?: string;
        upi_id?: string;
        notes?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    const userId = (await supabase.auth.getUser()).data?.user?.id;
    const { error } = await supabase.from("withdrawal_requests").insert({
        school_id: schoolId,
        requested_by: userId,
        amount,
        ...bankDetails,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ════════════════════════════════════════════════════════════

export async function getAllSubscriptions(): Promise<SubscriptionRecord[]> {
    const { data, error } = await supabase
        .from("subscriptions")
        .select(`
            *,
            profiles:user_id(full_name, phone)
        `)
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
        ...row,
        user_name: row.profiles?.full_name || "Unknown",
        user_phone: row.profiles?.phone || "",
    }));
}

// ════════════════════════════════════════════════════════════
// PARENTS / DRIVERS / STUDENTS
// ════════════════════════════════════════════════════════════

export async function getAllParents(): Promise<any[]> {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, created_at, role")
        .eq("role", "parent")
        .order("created_at", { ascending: false });

    return data || [];
}

export async function getAllDrivers(): Promise<any[]> {
    const { data, error } = await supabase
        .from("drivers")
        .select(`
            *,
            profiles:user_id(full_name, phone)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row: any) => ({
        ...row,
        driver_name: row.profiles?.full_name || "Unknown",
        driver_phone: row.profiles?.phone || "",
    }));
}

export async function getAllBuses(): Promise<any[]> {
    const { data, error } = await supabase
        .from("buses")
        .select(`
            *,
            schools!inner(name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row: any) => ({
        ...row,
        school_name: row.schools?.name || "Unknown",
    }));
}

export async function getAllStudents(): Promise<any[]> {
    const { data, error } = await supabase
        .from("children")
        .select(`
            *,
            schools!inner(name),
            buses(bus_number)
        `)
        .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row: any) => ({
        ...row,
        school_name: row.schools?.name || "Unknown",
        bus_number: row.buses?.bus_number || "—",
    }));
}

// ════════════════════════════════════════════════════════════
// AUDIT LOGS
// ════════════════════════════════════════════════════════════

export async function getAuditLogs(limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
        .from("audit_logs")
        .select(`
            *,
            profiles:actor_user_id(full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error || !data) return [];
    return data.map((row: any) => ({
        ...row,
        actor_name: row.profiles?.full_name || "System",
    }));
}
