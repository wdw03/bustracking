import React from "react";
import { View } from "react-native";
import { EntityPage } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";
import { useAdminCollection } from "./store";
import SuperAdminFleetMap from "./superadminmap";

export default function BusesPage() {
  const { records } = useAdminCollection("buses");
  const activeCount = records.filter((b) => b.status === "active" || b.status === "running").length;

  return (
    <View style={{ flex: 1 }}>
      <SuperAdminFleetMap />
      <EntityPage
        title="Bus management"
        subtitle="Registration, school, driver, route, GPS, speed and rider relationships."
        seed={records}
        schoolNames={SCHOOL_NAMES}
        metrics={[
          { label: "Total buses", value: records.length, icon: "bus", color: "#0891B2" },
          { label: "Active", value: activeCount, icon: "navigate", color: "#16A34A" },
          { label: "Inactive", value: records.length - activeCount, icon: "cloud-offline", color: "#DC2626" },
        ]}
        filters={["All", "Active", "Inactive"]}
        searchPlaceholder="Bus number, registration, school or driver"
        actionLabel="Refresh fleet"
      />
    </View>
  );
}
