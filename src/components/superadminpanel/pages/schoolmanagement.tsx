import React from "react";
import { View } from "react-native";
import { EntityPage } from "./pagekit";
import { schoolMetrics, schools } from "./mockData";
import SuperAdminFleetMap from "./superadminmap";
import SchoolInsights from "./schoolinsights";

export default function SchoolManagementPage() {
  return (
    <View style={{ flex: 1 }}>
      <SchoolInsights />
      <SuperAdminFleetMap />

      <EntityPage
        title="School management"
        subtitle="Manage registrations, accounts, plans, users and school transport."
        seed={schools}
        metrics={[...schoolMetrics, { label: "Pending requests", value: 1, icon: "time", color: "#EA580C" }]}
        filters={["All", "Active", "Pending", "Blocked"]}
        searchPlaceholder="Search school, ID, admin or mobile"
        actionLabel="Add school request"
      />
    </View>
  );
}
