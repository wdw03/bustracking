import React from "react";
import { View } from "react-native";
import { EntityPage } from "./pagekit";
import { buses, SCHOOL_NAMES } from "./mockData";
import SuperAdminFleetMap from "./superadminmap";
export default function BusesPage() { return <View style={{ flex: 1 }}><SuperAdminFleetMap /><EntityPage title="Bus management" subtitle="Registration, school, driver, route, GPS, speed and rider relationships." seed={buses} schoolNames={SCHOOL_NAMES} metrics={[{ label: "Total buses", value: buses.length, icon: "bus", color: "#0891B2" }, { label: "Running now", value: buses.filter((b) => b.status === "running").length, icon: "navigate", color: "#16A34A" }, { label: "Stopped", value: buses.filter((b) => b.status === "stopped").length, icon: "pause-circle", color: "#EA580C" }, { label: "Offline / blocked", value: buses.filter((b) => b.status === "offline").length, icon: "cloud-offline", color: "#DC2626" }]} filters={["All", "Running", "Stopped", "Offline", "Blocked"]} searchPlaceholder="Bus number, registration, school or driver" actionLabel="Add bus" /></View>; }
