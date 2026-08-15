import React from "react";
import { EntityPage } from "./pagekit";
import { buses } from "./mockData";
export default function BusDetailsPage() { return <EntityPage title="Bus details" subtitle="Assigned school, driver, route, GPS, speed and child-parent relationship." seed={buses} metrics={[{ label: "Students onboard", value: 42, icon: "school", color: "#16A34A" }, { label: "Parents connected", value: 38, icon: "people", color: "#7C3AED" }, { label: "Current speed", value: "34 km/h", icon: "speedometer", color: "#2563EB" }, { label: "Last GPS", value: "Just now", icon: "location", color: "#EA580C" }]} filters={["All", "Running", "Stopped", "Offline", "Blocked"]} searchPlaceholder="Bus number or registration" actionLabel="Edit bus" />; }
