import React from "react";
import { EntityPage } from "./pagekit";
import { subscriptions, SCHOOL_NAMES } from "./mockData";
export default function SubscriptionsPage() { return <EntityPage title="Subscriptions" subtitle="Active, expired, trial and cancelled subscription plans." seed={subscriptions} schoolNames={SCHOOL_NAMES} metrics={[{ label: "Active plans", value: subscriptions.filter((s) => s.status === "active").length, icon: "card", color: "#DB2777" }, { label: "Expired", value: subscriptions.filter((s) => s.status === "expired").length, icon: "time", color: "#EA580C" }, { label: "Total revenue", value: "₹3,84,920", icon: "cash", color: "#0F766E" }]} filters={["All", "Active", "Expired"]} searchPlaceholder="Parent, school, plan or transaction" actionLabel="Add subscription" />; }
