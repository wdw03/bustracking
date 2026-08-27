import React from "react";
import { Alert, View } from "react-native";
import { EntityPage } from "./pagekit";
import { useAdminCollection } from "./store";
import SuperAdminFleetMap from "./superadminmap";
import SchoolInsights from "./schoolinsights";
import { approveSchool, rejectSchool } from "../../../services/superAdminService";

export default function SchoolManagementPage() {
  const { records } = useAdminCollection("schools");
  // School Management ONLY displays schools that have been approved by Super Admin
  const approvedSchools = records.filter((s) => s.status === "approved" || s.status === "active" || s.status === "blocked");
  const activeCount = approvedSchools.filter((s) => s.status === "approved" || s.status === "active").length;
  const blockedCount = approvedSchools.filter((s) => s.status === "blocked").length;

  return (
    <View style={{ flex: 1 }}>
      <SchoolInsights />
      <SuperAdminFleetMap />

      <EntityPage
        title="School management"
        subtitle="Manage approved schools, transport fleets, plans and accounts."
        seed={approvedSchools}
        metrics={[
          { label: "Active schools", value: approvedSchools.length, icon: "business", color: "#2563EB" },
          { label: "Active", value: activeCount, icon: "checkmark-circle", color: "#16A34A" },
          { label: "Blocked", value: blockedCount, icon: "ban", color: "#DC2626" },
        ]}
        filters={["All", "Active", "Blocked"]}
        searchPlaceholder="Search school, city, admin or mobile"
        actionLabel="Refresh schools"
      />
    </View>
  );
}
