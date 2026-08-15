import React from "react";
import { View } from "react-native";
import { EntityPage } from "./pagekit";
import { buses } from "./mockData";
import SuperAdminFleetMap from "./superadminmap";
export default function BusesPage() { return <View style={{ flex: 1 }}><SuperAdminFleetMap /><EntityPage title="Bus management" subtitle="Registration, school, driver, route, GPS, speed and rider relationships." seed={buses} metrics={[{ label: "Total buses", value: 30, icon: "bus", color: "#0891B2" }, { label: "Running now", value: 2, icon: "navigate", color: "#16A34A" }, { label: "Stopped", value: 24, icon: "pause-circle", color: "#EA580C" }, { label: "Offline / blocked", value: 4, icon: "cloud-offline", color: "#DC2626" }]} filters={["All", "Running", "Stopped", "Offline", "Blocked"]} searchPlaceholder="Bus number, registration, school or driver" actionLabel="Add bus" /></View>; }
