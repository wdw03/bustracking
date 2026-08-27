import React from "react";
import { EntityPage } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";
import { useAdminCollection } from "./store";

export default function DriversPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { records } = useAdminCollection("drivers");
  const activeCount = records.filter((d) => d.status === "active").length;
  const blockedCount = records.filter((d) => d.status === "blocked").length;

  return (
    <EntityPage
      title="Drivers"
      subtitle="Verification, license, assigned bus, route and account status."
      seed={records}
      schoolNames={SCHOOL_NAMES}
      onNavigate={onNavigate}
      metrics={[
        { label: "Total drivers", value: records.length, icon: "people", color: "#EA580C" },
        { label: "Active", value: activeCount, icon: "checkmark-circle", color: "#16A34A" },
        { label: "Blocked", value: blockedCount, icon: "ban", color: "#DC2626" },
      ]}
      filters={["All", "Active", "Inactive", "Blocked"]}
      searchPlaceholder="Driver, mobile, school or bus"
      actionLabel="Refresh drivers"
    />
  );
}
