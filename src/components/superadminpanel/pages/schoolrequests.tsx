import React from "react";
import { EntityPage } from "./pagekit";
import { schools, SCHOOL_NAMES } from "./mockData";
import { getSchoolRegistrationRequests } from "../supaeradminpaneel";

export default function SchoolRequestsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const incoming = getSchoolRegistrationRequests().map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: `${item.admin} · ${item.city}`,
    status: item.status,
    icon: "business" as const,
    fields: [`${item.phone} · ${item.joined}`, `${item.buses} buses · ${item.students} students declared`],
  }));

  const allRequests = [...incoming, ...schools.filter((item) => item.status === "pending")];

  return (
    <EntityPage
      title="School registration requests"
      subtitle="Review submitted documentation and approve or reject school registrations."
      seed={allRequests}
      schoolNames={SCHOOL_NAMES}
      onNavigate={onNavigate}
      metrics={[
        { label: "Pending requests", value: allRequests.filter((r) => r.status === "pending").length, icon: "time", color: "#EA580C" },
        { label: "Approved", value: allRequests.filter((r) => r.status === "approved" || r.status === "active").length, icon: "checkmark-circle", color: "#16A34A" },
        { label: "Total requests", value: allRequests.length, icon: "business", color: "#2563EB" },
      ]}
      filters={["All", "Pending", "Approved", "Rejected"]}
      searchPlaceholder="Search request ID, school, city or admin"
      actionLabel="Refresh requests"
    />
  );
}
