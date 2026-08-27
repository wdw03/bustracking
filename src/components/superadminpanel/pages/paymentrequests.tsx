import React from "react";
import { EntityPage } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";
import { useAdminCollection } from "./store";

export default function PaymentRequestsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { records } = useAdminCollection("payments");
  const pendingCount = records.filter((p) => p.status === "pending").length;
  const completedCount = records.filter((p) => p.status === "completed").length;

  return (
    <EntityPage
      workflow="payment"
      title="Payment requests"
      subtitle="Process, approve, reject and complete subscription payments & withdrawals."
      seed={records}
      schoolNames={SCHOOL_NAMES}
      onNavigate={onNavigate}
      metrics={[
        { label: "Total requests", value: records.length, icon: "cash", color: "#0F766E" },
        { label: "Pending", value: pendingCount, icon: "time", color: "#EA580C" },
        { label: "Completed", value: completedCount, icon: "checkmark-circle", color: "#16A34A" },
      ]}
      filters={["All", "Pending", "Completed", "Rejected"]}
      searchPlaceholder="Request ID, school or transaction"
      actionLabel="Refresh payments"
    />
  );
}
