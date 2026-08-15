import React from "react";
import { EntityPage } from "./pagekit";
import { subscriptions } from "./mockData";
export default function SubscriptionsPage() { return <EntityPage title="Subscriptions" subtitle="Parent plans, expiry, revenue, activation and refund actions." seed={subscriptions} metrics={[{ label: "Total subscriptions", value: 728, icon: "card", color: "#DB2777" }, { label: "Active", value: 686, icon: "checkmark-circle", color: "#16A34A" }, { label: "Expired", value: 42, icon: "time", color: "#EA580C" }, { label: "Revenue", value: "₹3,84,920", icon: "cash", color: "#0F766E" }]} filters={["All", "Active", "Expired", "Cancelled", "Pending"]} searchPlaceholder="Subscription ID, parent, child or school" actionLabel="Add subscription" />; }
