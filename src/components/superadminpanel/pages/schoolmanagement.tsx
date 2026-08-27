import React from "react";
import { Alert, View } from "react-native";
import { EntityPage } from "./pagekit";
import { useAdminCollection } from "./store";
import SuperAdminFleetMap from "./superadminmap";
import SchoolInsights from "./schoolinsights";
import { approveSchool, rejectSchool } from "../../../services/superAdminService";

export default function SchoolManagementPage() {
  const { records } = useAdminCollection("schools");
  const activeCount = records.filter((s) => s.status === "approved" || s.status === "active").length;
  const pendingCount = records.filter((s) => s.status === "pending").length;
  const blockedCount = records.filter((s) => s.status === "blocked").length;

  const schoolsWithActions = records.map((s) => ({
    ...s,
    onApprove: s.status === "pending" ? () => {
      Alert.alert("Accept School", `Approve and activate ${s.title}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            const res = await approveSchool(s.id);
            if (res.success) {
              Alert.alert("✅ School Accepted", `${s.title} is now active.`);
            } else {
              Alert.alert("Error", res.error || "Failed to accept school.");
            }
          },
        },
      ]);
    } : undefined,
    onReject: s.status === "pending" ? () => {
      Alert.alert("Reject School", `Reject registration for ${s.title}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            const res = await rejectSchool(s.id, "Rejected by Super Admin");
            if (res.success) {
              Alert.alert("School Rejected", `${s.title} registration has been rejected.`);
            } else {
              Alert.alert("Error", res.error || "Failed to reject school.");
            }
          },
        },
      ]);
    } : undefined,
  }));

  return (
    <View style={{ flex: 1 }}>
      <SchoolInsights />
      <SuperAdminFleetMap />

      <EntityPage
        title="School management"
        subtitle="Manage registrations, accounts, plans, users and school transport."
        seed={schoolsWithActions}
        metrics={[
          { label: "Total schools", value: records.length, icon: "business", color: "#2563EB" },
          { label: "Active", value: activeCount, icon: "checkmark-circle", color: "#16A34A" },
          { label: "Pending", value: pendingCount, icon: "time", color: "#EA580C" },
          { label: "Blocked", value: blockedCount, icon: "ban", color: "#DC2626" },
        ]}
        filters={["All", "Active", "Pending", "Blocked"]}
        searchPlaceholder="Search school, city, admin or mobile"
        actionLabel="Refresh schools"
      />
    </View>
  );
}
