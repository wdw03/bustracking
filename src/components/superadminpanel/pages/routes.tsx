import React from "react";
import { EntityPage } from "./pagekit";
import { routes, SCHOOL_NAMES } from "./mockData";

export default function RoutesPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <EntityPage
      title="Routes & stops"
      subtitle="Manage morning and evening routes, stops and bus assignments across all schools."
      seed={routes}
      schoolNames={SCHOOL_NAMES}
      onNavigate={onNavigate}
      metrics={[
        { label: "Total routes", value: routes.length, icon: "git-branch", color: "#2563EB" },
        { label: "Active routes", value: routes.filter((r) => r.status === "active").length, icon: "checkmark-circle", color: "#16A34A" },
        { label: "Inactive", value: routes.filter((r) => r.status === "inactive").length, icon: "pause-circle", color: "#EA580C" },
        { label: "Total buses", value: 6, icon: "bus", color: "#0891B2" },
      ]}
      filters={["All", "Active", "Inactive"]}
      searchPlaceholder="Route name, school, bus, stop or driver"
      actionLabel="Create route"
    />
  );
}
