// ============================================================================
// Super Admin: Withdrawal Requests — REAL from Supabase
// Shows school payout requests with Approve/Reject actions
// ============================================================================

import React, { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { EntityPage } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";
import {
    getWithdrawalRequests,
    approveWithdrawal,
    rejectWithdrawal,
    type WithdrawalRecord,
} from "../../../services/superAdminService";

export default function WithdrawalRequestsPage() {
    const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getWithdrawalRequests();
            setWithdrawals(data);
        } catch (err) {
            console.warn("Failed to fetch withdrawals:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleApprove = (id: string) => {
        Alert.alert("Approve Withdrawal", "Mark this withdrawal as completed?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Approve",
                onPress: async () => {
                    const res = await approveWithdrawal(id);
                    if (res.success) {
                        Alert.alert("✅ Withdrawal Approved", "Payout has been marked as completed.");
                        fetchData();
                    } else {
                        Alert.alert("Error", res.error || "Failed to approve");
                    }
                },
            },
        ]);
    };

    const handleReject = (id: string) => {
        Alert.alert("Reject Withdrawal", "Are you sure you want to reject this payout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Reject",
                style: "destructive",
                onPress: async () => {
                    const res = await rejectWithdrawal(id, "Insufficient documentation");
                    if (res.success) {
                        Alert.alert("Withdrawal Rejected");
                        fetchData();
                    } else {
                        Alert.alert("Error", res.error || "Failed to reject");
                    }
                },
            },
        ]);
    };

    const totalAmount = withdrawals.reduce((sum, w) => sum + (parseFloat(String(w.amount)) || 0), 0);

    const records = withdrawals.map((w) => ({
        id: w.id,
        title: `WD-${w.id.slice(0, 8).toUpperCase()}`,
        subtitle: `${w.school_name || "Unknown School"} · ₹${w.amount}`,
        status: w.status,
        icon: "wallet" as const,
        fields: [
            `🏫 ${w.school_name || "—"} · Requested by: ${w.requester_name || "—"}`,
            `🏦 ${w.bank_name || "—"} · A/C: ${w.account_number ? "****" + w.account_number.slice(-4) : "—"} · IFSC: ${w.ifsc_code || "—"}`,
            `💰 Amount: ₹${w.amount} · ${w.notes || "No notes"}`,
            `📅 ${new Date(w.created_at).toLocaleDateString("en-IN")} · Status: ${w.status}`,
        ],
        onApprove: () => handleApprove(w.id),
        onReject: () => handleReject(w.id),
    }));

    return (
        <EntityPage
            workflow="payment"
            title="School withdrawal requests"
            subtitle={loading ? "Loading from database..." : `${records.length} withdrawal(s) from Supabase`}
            seed={records}
            schoolNames={SCHOOL_NAMES}
            metrics={[
                { label: "Total requests", value: withdrawals.length, icon: "wallet", color: "#EA580C" },
                { label: "Pending", value: withdrawals.filter((w) => w.status === "pending").length, icon: "time", color: "#EA580C" },
                { label: "Processing", value: withdrawals.filter((w) => w.status === "processing").length, icon: "sync", color: "#2563EB" },
                { label: "Total amount", value: `₹${totalAmount.toLocaleString("en-IN")}`, icon: "cash", color: "#0F766E" },
            ]}
            filters={["All", "Pending", "Processing", "Completed", "Rejected"]}
            searchPlaceholder="Withdrawal ID, school or bank reference"
            actionLabel="Refresh withdrawals"
            onAction={fetchData}
        />
    );
}
