import React from "react";
import { EntityPage } from "./pagekit";
import { payments } from "./mockData";
export default function RefundRequestsPage() { return <EntityPage workflow="payment" title="Refund requests" subtitle="Review original payment, amount, reason and refund status." seed={payments.filter((item) => item.id.startsWith("REF"))} metrics={[{ label: "Refund queue", value: 1, icon: "return-down-back", color: "#EA580C" }, { label: "Pending", value: 1, icon: "time", color: "#EA580C" }, { label: "Completed", value: 0, icon: "checkmark-circle", color: "#16A34A" }]} filters={["All", "Pending", "Processing", "Completed", "Rejected"]} searchPlaceholder="Refund ID, user, school or reason" actionLabel="Refresh refunds" />; }
