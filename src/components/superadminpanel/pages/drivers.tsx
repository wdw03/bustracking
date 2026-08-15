import React from "react";
import { EntityPage } from "./pagekit";
import { drivers } from "./mockData";
export default function DriversPage() { return <EntityPage title="Drivers" subtitle="Verification, license, assigned bus, route and account status." seed={drivers} metrics={[{ label: "Total drivers", value: 24, icon: "people", color: "#EA580C" }, { label: "Active", value: 21, icon: "checkmark-circle", color: "#16A34A" }, { label: "Pending verification", value: 2, icon: "time", color: "#EA580C" }, { label: "Blocked", value: 1, icon: "ban", color: "#DC2626" }]} filters={["All", "Active", "Inactive", "Blocked", "Pending"]} searchPlaceholder="Driver, mobile, school or bus" actionLabel="Add driver" />; }
