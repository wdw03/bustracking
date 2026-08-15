import React from "react";
import { EntityPage } from "./pagekit";
import { parents } from "./mockData";
export default function ParentsPage() { return <EntityPage title="Parents" subtitle="Search parent, child, school, bus and subscription access." seed={parents} metrics={[{ label: "Total parents", value: 2176, icon: "people", color: "#7C3AED", note: "Across all schools" }, { label: "Active parents", value: 2112, icon: "checkmark-circle", color: "#16A34A" }, { label: "Subscribed", value: 684, icon: "card", color: "#DB2777" }, { label: "Blocked", value: 64, icon: "ban", color: "#DC2626" }]} filters={["All", "Active", "Blocked", "Inactive"]} searchPlaceholder="Parent, mobile, child or school" actionLabel="Add parent" />; }
