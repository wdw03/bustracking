import React from "react";
import { EntityPage } from "./pagekit";
import { students } from "./mockData";
export default function StudentsPage() { return <EntityPage title="Students / children" subtitle="View class, section, parent, driver and bus relationships." seed={students} metrics={[{ label: "Total children", value: 1894, icon: "school", color: "#16A34A" }, { label: "Class sections", value: 48, icon: "layers", color: "#2563EB" }, { label: "Assigned buses", value: 30, icon: "bus", color: "#0891B2" }, { label: "Unassigned", value: 12, icon: "alert-circle", color: "#EA580C" }]} filters={["All", "Active", "Blocked"]} searchPlaceholder="Student, admission, parent or school" actionLabel="Add student" />; }
