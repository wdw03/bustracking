import React from "react";
import { EntityPage } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";
import { useAdminCollection } from "./store";

export default function SubscriptionsPage() {
  const { records } = useAdminCollection("subscriptions");
  const activeCount = records.filter((s) => s.status === "active").length;
  const expiredCount = records.filter((s) => s.status === "expired").length;

  return (
    <EntityPage
      title="Subscriptions"
      subtitle={`${records.length} total parent subscription(s) in system.`}
      seed={records}
      schoolNames={SCHOOL_NAMES}
      metrics={[
        { label: "Active plans", value: activeCount, icon: "card", color: "#DB2777" },
        { label: "Expired", value: expiredCount, icon: "time", color: "#EA580C" },
        { label: "Total plans", value: records.length, icon: "cash", color: "#0F766E" },
      ]}
      filters={["All", "Active", "Expired", "Trial"]}
      searchPlaceholder="Parent, phone, or plan"
    />
  );
}
