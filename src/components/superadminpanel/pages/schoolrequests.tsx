import React from "react";
import { EntityPage } from "./pagekit";
import { schools } from "./mockData";
import { getSchoolRegistrationRequests } from "../supaeradminpaneel";
export default function SchoolRequestsPage() { const incoming = getSchoolRegistrationRequests().map((item) => ({ id: item.id, title: item.name, subtitle: `${item.admin} · ${item.city}`, status: item.status, icon: "business" as const, fields: [`${item.phone} · ${item.joined}`, `${item.buses} buses · ${item.students} students declared`] })); return <EntityPage title="School registration requests" subtitle="Review documents and approve or reject new schools." seed={[...incoming, ...schools.filter((item) => item.status === "pending")]} filters={["All", "Pending", "Approved", "Rejected"]} searchPlaceholder="Search request ID, school or admin" actionLabel="Refresh requests" />; }
