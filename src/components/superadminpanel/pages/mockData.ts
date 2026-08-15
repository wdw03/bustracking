import { AdminRecord, Metric } from "./pagekit";

export const schoolMetrics: Metric[] = [
    { label: "Total schools", value: 4, icon: "business", color: "#2563EB", note: "1 pending" },
    { label: "Active schools", value: 2, icon: "checkmark-circle", color: "#16A34A" },
    { label: "Blocked schools", value: 1, icon: "ban", color: "#DC2626" },
];
export const schools: AdminRecord[] = [
    { id: "SCH-101", title: "Bluebells Public School", subtitle: "Rohan Mehta · New Delhi", status: "active", icon: "business", fields: ["842 students · 714 parents · 12 buses · 14 drivers", "Enterprise plan · Registered 12 Aug 2026"] },
    { id: "SCH-102", title: "St. Xavier's Academy", subtitle: "Ananya Singh · Gurugram", status: "active", icon: "business", fields: ["510 students · 466 parents · 8 buses · 9 drivers", "Growth plan · Registered 10 Aug 2026"] },
    { id: "SCH-103", title: "Green Valley School", subtitle: "Amit Sharma · Noida", status: "pending", icon: "business", fields: ["Registration request · 328 students declared · 6 buses", "Documents awaiting review"] },
    { id: "SCH-104", title: "Little Stars International", subtitle: "Priya Kapoor · Jaipur", status: "blocked", icon: "business", fields: ["214 students · 190 parents · 4 buses · 5 drivers", "Account blocked by Super Admin"] },
];
export const parents: AdminRecord[] = [
    { id: "PAR-201", title: "Neha Verma", subtitle: "Bluebells Public School · Aarav Verma", status: "active", icon: "people", fields: ["Class 6-A · Bus 101 · Driver Vikram Yadav", "Subscription active · Expires 30 Sep 2026 · 9876543210"] },
    { id: "PAR-202", title: "Sanjay Gupta", subtitle: "St. Xavier's Academy · Ishita Singh", status: "active", icon: "people", fields: ["Class 9-B · Bus 203 · Driver Rahul Khan", "Subscription active · Expires 14 Oct 2026 · 9102765934"] },
    { id: "PAR-203", title: "Meera Joshi", subtitle: "Green Valley School · Kabir Joshi", status: "blocked", icon: "people", fields: ["Class 4-A · Bus 305 · Driver Arjun Malik", "Subscription inactive · 9999000011"] },
];
export const students: AdminRecord[] = [
    { id: "STU-401", title: "Aarav Verma", subtitle: "Bluebells Public School · Class 6-A", status: "active", icon: "school", fields: ["Admission: BB-2026-0401 · Roll 14", "Parent Neha Verma · Bus 101 · Driver Vikram Yadav"] },
    { id: "STU-402", title: "Ishita Singh", subtitle: "St. Xavier's Academy · Class 9-B", status: "active", icon: "school", fields: ["Admission: SX-2026-0180 · Roll 08", "Parent Sanjay Gupta · Bus 203 · Driver Rahul Khan"] },
];
export const drivers: AdminRecord[] = [
    { id: "DRV-301", title: "Vikram Yadav", subtitle: "Bluebells Public School · Bus 101", status: "active", icon: "person", fields: ["9810839381 · License verified · Police check verified", "Route Dwarka Morning · Last GPS just now"] },
    { id: "DRV-302", title: "Rahul Khan", subtitle: "St. Xavier's Academy · Bus 203", status: "active", icon: "person", fields: ["9899001122 · License verified · Documents verified", "Route Golf Course Road · Last GPS 1 min ago"] },
    { id: "DRV-303", title: "Arjun Malik", subtitle: "Green Valley School · Bus 305", status: "inactive", icon: "person", fields: ["9898112233 · Verification pending", "Route Sector 62 · Assigned but not sharing GPS"] },
];
export const buses: AdminRecord[] = [
    { id: "BUS-101", title: "Bus 101 · DL 01 AB 1021", subtitle: "Bluebells Public School · Vikram Yadav", status: "running", icon: "bus", fields: ["34 km/h · Dwarka → School Campus · 42 students · 38 parents", "GPS just now · Route active"] },
    { id: "BUS-203", title: "Bus 203 · HR 26 C 8872", subtitle: "St. Xavier's Academy · Rahul Khan", status: "running", icon: "bus", fields: ["22 km/h · Golf Course Road → School · 36 students · 31 parents", "GPS 1 min ago · Route active"] },
    { id: "BUS-305", title: "Bus 305 · UP 16 Y 2024", subtitle: "Green Valley School · Arjun Malik", status: "stopped", icon: "bus", fields: ["0 km/h · Sector 62 → School · 28 students · 25 parents", "GPS 8 min ago · Waiting at stop"] },
    { id: "BUS-410", title: "Bus 410 · RJ 14 P 4511", subtitle: "Little Stars International · Unassigned", status: "offline", icon: "bus", fields: ["0 km/h · Mansarovar → School · 20 students · 18 parents", "Last GPS yesterday"] },
];
export const payments: AdminRecord[] = [
    { id: "PAY-8401", title: "WD-20260814-01 · ₹28,400", subtitle: "Bluebells Public School · Withdrawal", status: "pending", icon: "wallet", fields: ["HDFC bank transfer · ****4482 · Requested 14 Aug 2026", "Available balance ₹84,200 · Admin note required"] },
    { id: "PAY-8402", title: "SUB-20260813-92 · ₹999", subtitle: "Sanjay Gupta · Subscription", status: "completed", icon: "card", fields: ["UPI sanjay@upi · Transaction completed 13 Aug 2026", "St. Xavier's Academy · Growth plan"] },
    { id: "PAY-8403", title: "WD-20260812-08 · ₹12,600", subtitle: "St. Xavier's Academy · Withdrawal", status: "processing", icon: "wallet", fields: ["ICICI bank transfer · ****0901 · Requested 12 Aug 2026", "Processing by Super Admin"] },
    { id: "REF-20260810-12 · ₹999", title: "Refund request", subtitle: "Meera Joshi · Green Valley School", status: "pending", icon: "return-down-back", fields: ["Original payment SUB-20260801-12 · Reason: plan cancellation", "UPI meera@upi · Requested 10 Aug 2026"] },
];
export const subscriptions: AdminRecord[] = [
    { id: "SUB-20260813-92", title: "Sanjay Gupta · Growth plan", subtitle: "Ishita Singh · St. Xavier's Academy", status: "active", icon: "card", fields: ["₹999 · Started 13 Aug 2026 · Expires 13 Sep 2026", "UPI transaction · Auto-renew enabled"] },
    { id: "SUB-20260801-12", title: "Meera Joshi · Starter plan", subtitle: "Kabir Joshi · Green Valley School", status: "expired", icon: "card", fields: ["₹499 · Started 01 Aug 2026 · Expired 10 Aug 2026", "Renewal cancelled by parent"] },
];
