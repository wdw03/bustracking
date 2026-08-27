// ============================================================================
// Super Admin: School Registration Requests — REAL from Supabase
// Shows pending school signups with Approve/Reject actions
// ============================================================================

import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { EntityPage } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";
import {
    getSchoolRequests,
    approveSchool,
    rejectSchool,
    type SchoolRecord,
} from "../../../services/superAdminService";

export default function SchoolRequestsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
    const [schools, setSchools] = useState<SchoolRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSchoolRequests();
            setSchools(data);
        } catch (err) {
            console.warn("Failed to fetch school requests:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleApprove = async (schoolId: string) => {
        Alert.alert("Accept School Request", "Are you sure you want to accept and approve this school?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Accept",
                style: "default",
                onPress: async () => {
                    const res = await approveSchool(schoolId);
                    if (res.success) {
                        Alert.alert("✅ School Accepted", "School has been approved and is now active.");
                        fetchRequests();
                    } else {
                        Alert.alert("Error", res.error || "Failed to accept school.");
                    }
                },
            },
        ]);
    };

    const handleReject = async (schoolId: string) => {
        Alert.alert("Reject School Request", "Are you sure you want to reject this school registration request?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Reject",
                style: "destructive",
                onPress: async () => {
                    const res = await rejectSchool(schoolId, "Does not meet requirements");
                    if (res.success) {
                        Alert.alert("School Rejected", "School registration request has been rejected.");
                        fetchRequests();
                    } else {
                        Alert.alert("Error", res.error || "Failed to reject school.");
                    }
                },
            },
        ]);
    };

    // Convert SchoolRecord[] to AdminRecord[] format for EntityPage
    const records = schools.map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: `${s.principal_name || "—"} · ${s.city || "—"}`,
        status: s.status,
        icon: "business" as const,
        phone: s.phone,
        email: s.email || undefined,
        address: s.address || undefined,
        fields: [
            `📞 ${s.phone} · ${new Date(s.created_at).toLocaleDateString("en-IN")}`,
            `📍 ${s.address || "—"} · ${s.city || "—"}, ${s.state || "—"} ${s.pincode || ""}`,
            `👤 Principal: ${s.principal_name || "—"}`,
        ],
        // Attach approve/reject handlers
        onApprove: () => handleApprove(s.id),
        onReject: () => handleReject(s.id),
    }));

    return (
        <EntityPage
            title="School registration requests"
            subtitle={loading ? "Loading from database..." : `${records.length} request(s) from Supabase`}
            seed={records}
            schoolNames={SCHOOL_NAMES}
            onNavigate={onNavigate}
            metrics={[
                { label: "Pending requests", value: records.filter((r) => r.status === "pending").length, icon: "time", color: "#EA580C" },
                { label: "Approved", value: records.filter((r) => r.status === "approved" || r.status === "active").length, icon: "checkmark-circle", color: "#16A34A" },
                { label: "Rejected", value: records.filter((r) => r.status === "rejected").length, icon: "close-circle", color: "#DC2626" },
                { label: "Total requests", value: records.length, icon: "business", color: "#2563EB" },
            ]}
            filters={["All", "Pending", "Approved", "Rejected"]}
            searchPlaceholder="Search request ID, school, city or admin"
            actionLabel="Refresh requests"
            onAction={fetchRequests}
        />
    );
}
