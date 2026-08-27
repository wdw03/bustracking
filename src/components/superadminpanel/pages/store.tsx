// ============================================================================
// Super Admin Store — Connected to Supabase
// Fetches real data from DB on mount, with local reducer for UI state
// ============================================================================

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { AdminRecord } from "./pagekit";
import { buses, drivers, parents, schools, students, subscriptions, payments } from "./mockData";
import {
    getAllSchools,
    getAllParents,
    getAllDrivers,
    getAllBuses,
    getAllStudents,
    getAllSubscriptions,
    getWithdrawalRequests,
} from "../../../services/superAdminService";

export type CollectionKey = "schools" | "parents" | "students" | "drivers" | "buses" | "subscriptions" | "payments" | "routes";
type State = Record<CollectionKey, AdminRecord[]> & { notifications: string[]; audit: AdminRecord[]; loaded: boolean };
type Action =
    | { type: "add"; collection: CollectionKey; record: AdminRecord }
    | { type: "update"; collection: CollectionKey; id: string; patch: Partial<AdminRecord> }
    | { type: "remove"; collection: CollectionKey; id: string }
    | { type: "notification"; message: string }
    | { type: "audit"; action: string; target: string }
    | { type: "hydrate"; collection: CollectionKey; records: AdminRecord[] }
    | { type: "loaded" };

// Start with mock data as initial state, then hydrate from Supabase
const initialState: State = {
    schools,
    parents,
    students,
    drivers,
    buses,
    subscriptions,
    payments,
    routes: [],
    notifications: [],
    audit: [],
    loaded: false,
};

function reducer(state: State, action: Action): State {
    if (action.type === "hydrate") {
        return { ...state, [action.collection]: action.records };
    }
    if (action.type === "loaded") {
        return { ...state, loaded: true };
    }
    if (action.type === "add") {
        return {
            ...state,
            [action.collection]: [action.record, ...state[action.collection]],
            audit: [{ id: `LOG-${Date.now()}`, title: `Added ${action.collection.slice(0, -1)}`, subtitle: action.record.title, status: "completed", icon: "add-circle" }, ...state.audit],
        };
    }
    if (action.type === "update") {
        return {
            ...state,
            [action.collection]: state[action.collection].map((record) => record.id === action.id ? { ...record, ...action.patch } : record),
            audit: [{ id: `LOG-${Date.now()}`, title: `Updated ${action.collection.slice(0, -1)}`, subtitle: `${action.id} · ${action.patch.status ?? "details changed"}`, status: "completed", icon: "create" }, ...state.audit],
        };
    }
    if (action.type === "remove") {
        return {
            ...state,
            [action.collection]: state[action.collection].map((record) => record.id === action.id ? { ...record, status: "inactive" } : record),
            audit: [{ id: `LOG-${Date.now()}`, title: `Archived ${action.collection.slice(0, -1)}`, subtitle: action.id, status: "completed", icon: "trash" }, ...state.audit],
        };
    }
    if (action.type === "notification") {
        return { ...state, notifications: [action.message, ...state.notifications] };
    }
    // audit action
    return {
        ...state,
        audit: [{ id: `LOG-${Date.now()}`, title: action.action, subtitle: action.target, status: "completed", icon: "finger-print" }, ...state.audit],
    };
}

const AdminStoreContext = createContext<{ state: State; dispatch: React.Dispatch<Action>; refresh: () => Promise<void> } | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Hydrate from Supabase on mount
    const refresh = useCallback(async () => {
        try {
            const [schoolsData, parentsData, driversData, busesData, studentsData, subsData, withdrawalsData] = await Promise.all([
                getAllSchools(),
                getAllParents(),
                getAllDrivers(),
                getAllBuses(),
                getAllStudents(),
                getAllSubscriptions(),
                getWithdrawalRequests(),
            ]);

            // Convert to AdminRecord format — always hydrate to reflect real DB state
            dispatch({
                type: "hydrate",
                collection: "schools",
                records: (schoolsData || []).map((s) => ({
                    id: s.id,
                    title: s.name,
                    subtitle: `${s.principal_name || "—"} · ${s.city || "—"}`,
                    status: s.status,
                    icon: "business",
                    phone: s.phone,
                    email: s.email || undefined,
                    address: s.address || undefined,
                    fields: [
                        `📍 ${s.address || "—"} · ${s.city || "—"}, ${s.state || "—"} ${s.pincode || ""}`,
                        `👤 Principal: ${s.principal_name || "—"} (${s.principal_phone || "—"})`,
                        `📅 Registered: ${new Date(s.created_at).toLocaleDateString("en-IN")}`,
                    ],
                })),
            });

            dispatch({
                type: "hydrate",
                collection: "parents",
                records: (parentsData || []).map((p: any) => ({
                    id: p.id,
                    title: p.full_name,
                    subtitle: p.phone || "—",
                    status: "active",
                    icon: "people",
                })),
            });

            dispatch({
                type: "hydrate",
                collection: "drivers",
                records: (driversData || []).map((d: any) => ({
                    id: d.id,
                    title: d.driver_name || d.full_name || "Unknown",
                    subtitle: `${d.driver_phone || "—"} · License: ${d.license_number || "—"}`,
                    status: d.is_active ? "active" : "inactive",
                    icon: "person",
                })),
            });

            dispatch({
                type: "hydrate",
                collection: "buses",
                records: (busesData || []).map((b: any) => ({
                    id: b.id,
                    title: b.bus_number || "Unknown",
                    subtitle: `${b.school_name || "—"} · ${b.vehicle_number || "—"}`,
                    status: b.is_active ? "active" : "inactive",
                    icon: "bus",
                })),
            });

            dispatch({
                type: "hydrate",
                collection: "students",
                records: (studentsData || []).map((s: any) => ({
                    id: s.id,
                    title: s.full_name || "Unknown",
                    subtitle: `${s.school_name || "—"} · ${s.class_name || "—"} · Bus: ${s.bus_number || "—"}`,
                    status: "active",
                    icon: "school",
                })),
            });

            dispatch({
                type: "hydrate",
                collection: "subscriptions",
                records: (subsData || []).map((s: any) => ({
                    id: s.id,
                    title: s.user_name || "Unknown",
                    subtitle: `${s.plan_type || "—"} · ₹${s.amount_paid || 0} · ${s.user_phone || ""}`,
                    status: s.status,
                    icon: "card",
                })),
            });

            dispatch({
                type: "hydrate",
                collection: "payments",
                records: (withdrawalsData || []).map((w) => ({
                    id: w.id,
                    title: `WD-${w.id.slice(0, 8).toUpperCase()}`,
                    subtitle: `${w.school_name || "—"} · ₹${w.amount}`,
                    status: w.status,
                    icon: "wallet",
                })),
            });

            dispatch({ type: "loaded" });
        } catch (err) {
            console.warn("Store hydration error:", err);
            dispatch({ type: "loaded" });
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    return (
        <AdminStoreContext.Provider value={{ state, dispatch, refresh }}>
            {children}
        </AdminStoreContext.Provider>
    );
}

export function useAdminStore() {
    const value = useContext(AdminStoreContext);
    if (!value) throw new Error("useAdminStore must be used inside SuperAdminProvider");
    return value;
}

export function useAdminCollection(collection: CollectionKey) {
    const { state, dispatch } = useAdminStore();
    return useMemo(() => ({
        records: state[collection],
        add: (record: AdminRecord) => dispatch({ type: "add", collection, record }),
        update: (id: string, patch: Partial<AdminRecord>) => dispatch({ type: "update", collection, id, patch }),
        remove: (id: string) => dispatch({ type: "remove", collection, id }),
    }), [state, dispatch, collection]);
}
