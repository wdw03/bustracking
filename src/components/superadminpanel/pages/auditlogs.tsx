import React from "react";
import { EntityPage } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";

const logs = [
  { id: "LOG-01", title: "Approved school registration", subtitle: "Bluebells Public School · Super Admin · Today 09:12", status: "completed", icon: "checkmark-done" as const, fields: ["Action: Approve School Account · IP 192.168.1.10", "Target: SCH-101 · Rohan Mehta"] },
  { id: "LOG-02", title: "Processed subscription payment", subtitle: "St. Xavier's Academy · Super Admin · Yesterday 16:20", status: "completed", icon: "wallet" as const, fields: ["Action: Verify Payment SUB-20260813-92", "Amount: ₹999 · Parent Sanjay Gupta"] },
  { id: "LOG-03", title: "Blocked parent account", subtitle: "Green Valley School · Super Admin · Yesterday 13:10", status: "completed", icon: "ban" as const, fields: ["Action: Block Parent Access · Reason: Non-payment", "Target: PAR-203 · Meera Joshi"] },
  { id: "LOG-04", title: "Assigned driver to route", subtitle: "Bluebells Public School · Super Admin · 13 Aug 11:30", status: "completed", icon: "person" as const, fields: ["Action: Driver Vikram Yadav assigned to Bus 101", "Route: Dwarka Morning Route"] },
  { id: "LOG-05", title: "Processed withdrawal payout", subtitle: "St. Xavier's Academy · Super Admin · 12 Aug 15:45", status: "completed", icon: "wallet" as const, fields: ["Action: Bank payout ₹12,600 verified", "Target: ICICI Bank ****0901"] },
  { id: "LOG-06", title: "Blocked school account", subtitle: "Little Stars International · Super Admin · 11 Aug 17:00", status: "completed", icon: "ban" as const, fields: ["Action: Block School Access · Reason: Compliance issue", "Target: SCH-104 · Priya Kapoor"] },
];

export default function AuditLogsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <EntityPage
      title="Audit logs"
      subtitle="Every local Super Admin action is recorded with timestamp and target."
      seed={logs}
      schoolNames={SCHOOL_NAMES}
      onNavigate={onNavigate}
      metrics={[
        { label: "Total logs", value: logs.length, icon: "document-text", color: "#2563EB" },
        { label: "Completed actions", value: logs.length, icon: "checkmark-circle", color: "#16A34A" },
        { label: "Admins active", value: 1, icon: "shield-checkmark", color: "#7C3AED" },
      ]}
      filters={["All", "Completed"]}
      searchPlaceholder="Action, school, admin, user or target"
      actionLabel="Export logs"
    />
  );
}
