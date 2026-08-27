// ============================================================================
// Super Admin Dashboard Metrics — LIVE from Supabase
// This file now exports a hook that fetches real data.
// Falls back to static defaults while loading.
// ============================================================================

import { useEffect, useState } from "react";
import { Metric } from "./pagekit";
import { getDashboardStats, type DashboardStats } from "../../../services/superAdminService";

const DEFAULT_STATS: DashboardStats = {
    totalSchools: 0, activeSchools: 0, pendingSchools: 0, blockedSchools: 0,
    totalParents: 0, totalStudents: 0, totalDrivers: 0, totalBuses: 0,
    runningBuses: 0, activeSubscriptions: 0, totalRevenue: 0, pendingWithdrawals: 0,
};

function formatCurrency(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
}

export function statsToMetrics(s: DashboardStats): Metric[] {
    return [
        { label: "Total schools", value: s.totalSchools, icon: "business", color: "#2563EB", note: s.pendingSchools > 0 ? `${s.pendingSchools} pending` : undefined },
        { label: "Total parents", value: s.totalParents, icon: "people", color: "#7C3AED" },
        { label: "Total students", value: s.totalStudents, icon: "school", color: "#16A34A" },
        { label: "Total drivers", value: s.totalDrivers, icon: "person", color: "#EA580C" },
        { label: "Total buses", value: s.totalBuses, icon: "bus", color: "#0891B2" },
        { label: "Running buses", value: s.runningBuses, icon: "navigate", color: "#16A34A" },
        { label: "Subscribed parents", value: s.activeSubscriptions, icon: "person-add", color: "#DB2777" },
        { label: "Active subscriptions", value: s.activeSubscriptions, icon: "card", color: "#DB2777" },
        { label: "Total revenue", value: formatCurrency(s.totalRevenue), icon: "cash", color: "#0F766E" },
        { label: "Pending requests", value: s.pendingWithdrawals + s.pendingSchools, icon: "time", color: "#EA580C" },
    ];
}

/** Hook: fetch live dashboard stats from Supabase */
export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
    const [metrics, setMetrics] = useState<Metric[]>(statsToMetrics(DEFAULT_STATS));
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        setLoading(true);
        try {
            const live = await getDashboardStats();
            setStats(live);
            setMetrics(statsToMetrics(live));
        } catch (err) {
            console.warn("Dashboard stats fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); }, []);

    return { stats, metrics, loading, refresh };
}

// Keep backward-compatible static export (used during initial render)
export const metrics: Metric[] = statsToMetrics(DEFAULT_STATS);
