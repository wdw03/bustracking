import React from "react";
import { EntityPage } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";
import { useAdminCollection } from "./store";

export default function StudentsPage() {
  const { records } = useAdminCollection("students");
  const activeCount = records.filter((s) => s.status === "active").length;

  return (
    <EntityPage
      title="Students"
      subtitle="Search student, admission, class, parent, bus and route details."
      seed={records}
      schoolNames={SCHOOL_NAMES}
      metrics={[
        { label: "Total students", value: records.length, icon: "school", color: "#16A34A", note: "Across all schools" },
        { label: "Active", value: activeCount, icon: "checkmark-circle", color: "#16A34A" },
      ]}
      filters={["All", "Active", "Inactive"]}
      searchPlaceholder="Student, class, parent or bus"
      actionLabel="Refresh students"
    />
  );
}
