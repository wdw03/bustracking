import { AdminRecord, Metric } from "./pagekit";

/* ─── School names (populated dynamically from DB) ─── */
export const SCHOOL_NAMES: string[] = [];

/* ─── School Details (full details for school management) ─── */
export type SchoolDetail = {
    id: string;
    name: string;
    admin: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    plan: string;
    planExpiry: string;
    status: string;
    studentCount: number;
    parentCount: number;
    busCount: number;
    driverCount: number;
    registeredOn: string;
    principal: string;
    principalPhone: string;
    gstNumber: string;
    website: string;
};

export const schoolDetails: SchoolDetail[] = [];

export const schoolMetrics: Metric[] = [
    { label: "Total schools", value: 0, icon: "business", color: "#2563EB" },
    { label: "Active schools", value: 0, icon: "checkmark-circle", color: "#16A34A" },
    { label: "Blocked schools", value: 0, icon: "ban", color: "#DC2626" },
];

export const schools: AdminRecord[] = [];
export const parents: AdminRecord[] = [];
export const drivers: AdminRecord[] = [];
export const students: AdminRecord[] = [];
export const buses: AdminRecord[] = [];
export const routes: AdminRecord[] = [];

export type OrderRecord = {
    id: string;
    parentName: string;
    studentName: string;
    schoolName: string;
    planName: string;
    amount: string;
    date: string;
    status: string;
    paymentMode: string;
    phone?: string;
    school?: string;
    plan?: string;
    method?: string;
};

export const orders: OrderRecord[] = [];
export const payments: AdminRecord[] = [];
export const subscriptions: AdminRecord[] = [];
