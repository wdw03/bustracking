import React from "react";
import { EntityPage } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";
import { useAdminCollection } from "./store";

export default function ParentsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { records } = useAdminCollection("parents");
  const activeCount = records.filter((p) => p.status === "active").length;
  const blockedCount = records.filter((p) => p.status === "blocked").length;

  return (
    <EntityPage
      title="Parents"
      subtitle="Search parent, child, school, bus and subscription access."
      seed={records}
      schoolNames={SCHOOL_NAMES}
      onNavigate={onNavigate}
      metrics={[
        { label: "Total parents", value: records.length, icon: "people", color: "#7C3AED", note: "Across all schools" },
        { label: "Active parents", value: activeCount, icon: "checkmark-circle", color: "#16A34A" },
        { label: "Blocked", value: blockedCount, icon: "ban", color: "#DC2626" },
      ]}
      filters={["All", "Active", "Blocked", "Inactive"]}
      searchPlaceholder="Parent, mobile, child or school"
      actionLabel="Refresh parents"
    />
  );
}
