import React, { createContext, ReactNode, useContext, useMemo, useReducer } from "react";
import { AdminRecord } from "./pagekit";
import { buses, drivers, parents, schools, students, subscriptions, payments } from "./mockData";

export type CollectionKey = "schools" | "parents" | "students" | "drivers" | "buses" | "subscriptions" | "payments" | "routes";
type State = Record<CollectionKey, AdminRecord[]> & { notifications: string[]; audit: AdminRecord[] };
type Action = { type: "add"; collection: CollectionKey; record: AdminRecord } | { type: "update"; collection: CollectionKey; id: string; patch: Partial<AdminRecord> } | { type: "remove"; collection: CollectionKey; id: string } | { type: "notification"; message: string } | { type: "audit"; action: string; target: string };

const initialState: State = { schools, parents, students, drivers, buses, subscriptions, payments, routes: [{ id: "R-101", title: "Dwarka Morning Route", subtitle: "Bluebells · Bus 101 · 8 stops", status: "active", icon: "git-branch" }, { id: "R-203", title: "Golf Course Road Route", subtitle: "St. Xavier's · Bus 203 · 6 stops", status: "active", icon: "git-branch" }], notifications: [], audit: [] };
function reducer(state: State, action: Action): State {
    if (action.type === "add") return { ...state, [action.collection]: [action.record, ...state[action.collection]], audit: [{ id: `LOG-${Date.now()}`, title: `Added ${action.collection.slice(0, -1)}`, subtitle: action.record.title, status: "completed", icon: "add-circle" }, ...state.audit] };
    if (action.type === "update") return { ...state, [action.collection]: state[action.collection].map((record) => record.id === action.id ? { ...record, ...action.patch } : record), audit: [{ id: `LOG-${Date.now()}`, title: `Updated ${action.collection.slice(0, -1)}`, subtitle: `${action.id} · ${action.patch.status ?? "details changed"}`, status: "completed", icon: "create" }, ...state.audit] };
    if (action.type === "remove") return { ...state, [action.collection]: state[action.collection].map((record) => record.id === action.id ? { ...record, status: "inactive" } : record), audit: [{ id: `LOG-${Date.now()}`, title: `Archived ${action.collection.slice(0, -1)}`, subtitle: action.id, status: "completed", icon: "trash" }, ...state.audit] };
    if (action.type === "notification") return { ...state, notifications: [action.message, ...state.notifications] };
    return { ...state, audit: [{ id: `LOG-${Date.now()}`, title: action.action, subtitle: action.target, status: "completed", icon: "finger-print" }, ...state.audit] };
}

const AdminStoreContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);
export function SuperAdminProvider({ children }: { children: ReactNode }) { const [state, dispatch] = useReducer(reducer, initialState); return <AdminStoreContext.Provider value={{ state, dispatch }}>{children}</AdminStoreContext.Provider>; }
export function useAdminStore() { const value = useContext(AdminStoreContext); if (!value) throw new Error("useAdminStore must be used inside SuperAdminProvider"); return value; }
export function useAdminCollection(collection: CollectionKey) { const { state, dispatch } = useAdminStore(); return useMemo(() => ({ records: state[collection], add: (record: AdminRecord) => dispatch({ type: "add", collection, record }), update: (id: string, patch: Partial<AdminRecord>) => dispatch({ type: "update", collection, id, patch }), remove: (id: string) => dispatch({ type: "remove", collection, id }) }), [state, dispatch, collection]); }
