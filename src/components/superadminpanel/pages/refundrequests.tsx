import React from "react";
import { EntityPage } from "./pagekit";
import { payments, SCHOOL_NAMES } from "./mockData";
const refunds = payments.filter((item) => item.id.startsWith("REF"));
export default function RefundRequestsPage() { return <EntityPage workflow="payment" title="Refund requests" subtitle="Review original payment, amount, reason and refund status." seed={refunds} schoolNames={SCHOOL_NAMES} metrics={[{ label: "Refund queue", value: refunds.length, icon: "return-down-back", color: "#EA580C" }, { label: "Pending", value: refunds.filter((r) => r.status === "pending").length, icon: "time", color: "#EA580C" }, { label: "Completed", value: refunds.filter((r) => r.status === "completed").length, icon: "checkmark-circle", color: "#16A34A" }]} filters={["All", "Pending", "Processing", "Completed", "Rejected"]} searchPlaceholder="Refund ID, user, school or reason" actionLabel="Refresh refunds" />; }
