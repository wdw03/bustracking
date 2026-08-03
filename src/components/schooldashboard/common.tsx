/* ============================================================================
   SCHOOL DASHBOARD — SHARED CORE (theme, components, demo data)
   Copy to: src/components/schooldashboard/common.tsx
   Every school-dashboard page imports from this file.
   ========================================================================== */

import React, { useRef } from "react";
import { Animated, Dimensions, Pressable, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

/* ─────────────── Theme ─────────────── */
export const ACCENT = "#FFD500";
export const ACCENT_SOFT = "#FFF7CC";
export const ACCENT_DEEP = "#B99700";
export const ACCENT_LINE = "#F5E6A3";
export const INK = "#111827";
export const MUTED = "#6B7280";
export const FAINT = "#9CA3AF";
export const BORDER = "#E5E7EB";
export const CARD_BG = "#FFFFFF";
export const PAGE_BG = "#F8F9FB";
export const GREEN = "#16A34A";
export const GREEN_SOFT = "#DCFCE7";
export const RED = "#DC2626";
export const RED_SOFT = "#FEE2E2";
export const BLUE = "#2563EB";
export const BLUE_SOFT = "#DBEAFE";
export const ORANGE = "#EA580C";
export const ORANGE_SOFT = "#FFEDD5";
export const PURPLE = "#7C3AED";
export const PURPLE_SOFT = "#EDE9FE";

export const FONT = {
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    display: "Sora-Bold",
    displayHeavy: "Sora-ExtraBold",
};

const { width } = Dimensions.get("window");
export const ms = (s: number) => Math.round((width / 390) * s);

/* ─────────────── Press — soft scale, NO blink ─────────────── */
export function Press({
    children,
    onPress,
    style,
    disabled,
    haptic = true,
}: {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle | ViewStyle[];
    disabled?: boolean;
    haptic?: boolean;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Pressable
            disabled={disabled}
            onPressIn={() => Animated.spring(scale, { toValue: 0.97, friction: 7, tension: 120, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }).start()}
            onPress={() => {
                if (haptic) Haptics.selectionAsync();
                onPress?.();
            }}
        >
            <Animated.View style={[style as ViewStyle, { transform: [{ scale }] }]}>{children}</Animated.View>
        </Pressable>
    );
}

/* ─────────────── Page header (curved, consistent, never overlaps) ─────────────── */
export function PageHeader({
    title,
    subtitle,
    onBack,
    topInset,
    right,
}: {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    topInset: number;
    right?: React.ReactNode;
}) {
    return (
        <View
            style={{
                backgroundColor: ACCENT,
                paddingTop: topInset + ms(8),
                paddingBottom: ms(16),
                paddingHorizontal: ms(16),
                borderBottomLeftRadius: ms(26),
                borderBottomRightRadius: ms(26),
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                {onBack ? (
                    <Press onPress={onBack} style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: "rgba(255,255,255,0.55)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="chevron-back" size={ms(20)} color={INK} />
                    </Press>
                ) : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK, letterSpacing: -0.4 }}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(12), color: "#6B5900", marginTop: 1 }}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
                {right}
            </View>
        </View>
    );
}

/* ─────────────── Small building blocks ─────────────── */
export function SectionTitle({ icon, title, right }: { icon: keyof typeof Ionicons.glyphMap; title: string; right?: React.ReactNode }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: ms(18), marginBottom: ms(10), gap: 8 }}>
            <View style={{ width: ms(28), height: ms(28), borderRadius: ms(10), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={icon} size={ms(15)} color={ACCENT_DEEP} />
            </View>
            <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: ms(15), color: INK }}>{title}</Text>
            {right}
        </View>
    );
}

export function StatCard({ icon, label, value, color, soft }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string; soft: string }) {
    return (
        <View style={{ flexBasis: "48%", flexGrow: 1, backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13) }}>
            <View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: soft, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={icon} size={ms(17)} color={color} />
            </View>
            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(20), color: INK, marginTop: ms(8) }}>{value}</Text>
            <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 1 }}>{label}</Text>
        </View>
    );
}

export function InfoRow({ icon, label, value, color = ACCENT_DEEP, soft = ACCENT_SOFT }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color?: string; soft?: string }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10), paddingVertical: ms(8) }}>
            <View style={{ width: ms(32), height: ms(32), borderRadius: ms(11), backgroundColor: soft, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={icon} size={ms(15)} color={color} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: FAINT }}>{label}</Text>
                <Text numberOfLines={2} style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>{value}</Text>
            </View>
        </View>
    );
}

export function Chip({ text, color, soft }: { text: string; color: string; soft: string }) {
    return (
        <View style={{ backgroundColor: soft, borderRadius: 999, paddingHorizontal: ms(10), paddingVertical: 4, alignSelf: "flex-start" }}>
            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color }}>{text}</Text>
        </View>
    );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
    return (
        <View style={[{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(14) }, style]}>{children}</View>
    );
}

/* ─────────────── Demo data (single source of truth) ─────────────── */
export const SCHOOL = {
    name: "Green Valley School",
    code: "GVS-2024-113",
    principal: "Dr. Meena Sharma",
    phone: "+91 120 456 7890",
    email: "office@greenvalley.edu.in",
    address: "Plot 7, Knowledge Park, Sector 62, Noida, UP 201301",
    subscription: { plan: "Premium Fleet", status: "Active", expiry: "12 Mar 2027", renewal: "12 Feb 2027", studentsAllowed: 1000, busesAllowed: 15, parentSubs: 486, commissionPct: 20, balance: 12440 },
};

export type DBus = {
    id: string; number: string; vehicleNumber: string; name: string; driverId: string; helper: string; helperPhone: string;
    status: "Running" | "Offline" | "Maintenance" | "Disabled"; location: string; speed: number; color: string;
    students: number; route: string; lastUpdated: string; battery: number; gps: "Online" | "Offline";
};

export const BUSES: DBus[] = [
    { id: "b1", number: "BUS-01", vehicleNumber: "DL01AB1234", name: "Yellow Falcon", driverId: "d1", helper: "Suresh Yadav", helperPhone: "+91 98111 22334", status: "Running", location: "Sector 62 Crossing, Noida", speed: 34, color: "#2563EB", students: 28, route: "Route A", lastUpdated: "12 sec ago", battery: 84, gps: "Online" },
    { id: "b2", number: "BUS-02", vehicleNumber: "DL01CD5678", name: "Blue Comet", driverId: "d2", helper: "Mohan Lal", helperPhone: "+91 98222 33445", status: "Running", location: "Vasundhara Gate 2, Ghaziabad", speed: 22, color: "#16A34A", students: 34, route: "Route B", lastUpdated: "8 sec ago", battery: 71, gps: "Online" },
    { id: "b3", number: "BUS-03", vehicleNumber: "UP14EF9012", name: "Green Arrow", driverId: "d3", helper: "Ramesh Gupta", helperPhone: "+91 97333 44556", status: "Offline", location: "School Parking Bay 3", speed: 0, color: "#EA580C", students: 30, route: "Route C", lastUpdated: "26 min ago", battery: 100, gps: "Offline" },
    { id: "b4", number: "BUS-04", vehicleNumber: "HR26GH3456", name: "Red Rocket", driverId: "d4", helper: "Vinod Kumar", helperPhone: "+91 96444 55667", status: "Running", location: "Sector 45 Market, Gurugram", speed: 41, color: "#DC2626", students: 24, route: "Route D", lastUpdated: "4 sec ago", battery: 62, gps: "Online" },
    { id: "b5", number: "BUS-05", vehicleNumber: "DL02IJ7890", name: "Silver Line", driverId: "d5", helper: "Dinesh Rawat", helperPhone: "+91 95555 66778", status: "Maintenance", location: "Service Center, Sector 8", speed: 0, color: "#7C3AED", students: 0, route: "Route E", lastUpdated: "2 hrs ago", battery: 45, gps: "Offline" },
];

export type DDriver = {
    id: string; name: string; driverId: string; phone: string; license: string; busId: string | null;
    status: "Active" | "Suspended"; experience: string; trips: number; rating: number;
};

export const DRIVERS: DDriver[] = [
    { id: "d1", name: "Rajesh Kumar", driverId: "DRV001", phone: "+91 98765 43210", license: "DL-0420110149646", busId: "b1", status: "Active", experience: "8 yrs", trips: 1240, rating: 4.8 },
    { id: "d2", name: "Amit Singh", driverId: "DRV002", phone: "+91 98123 45678", license: "DL-0520130256781", busId: "b2", status: "Active", experience: "6 yrs", trips: 980, rating: 4.6 },
    { id: "d3", name: "Prakash Joshi", driverId: "DRV003", phone: "+91 93777 88990", license: "UP-1420150367892", busId: "b3", status: "Active", experience: "5 yrs", trips: 745, rating: 4.5 },
    { id: "d4", name: "Sandeep Rana", driverId: "DRV004", phone: "+91 92666 55443", license: "HR-2620170478903", busId: "b4", status: "Active", experience: "9 yrs", trips: 1510, rating: 4.9 },
    { id: "d5", name: "Naveen Bisht", driverId: "DRV005", phone: "+91 91555 44332", license: "DL-0220190589014", busId: "b5", status: "Suspended", experience: "3 yrs", trips: 310, rating: 4.1 },
];

export type DStudent = {
    id: string; name: string; admissionNo: string; studentId: string; rollNo: string; klass: string; section: string;
    gender: string; dob: string; parentName: string; parentPhone: string; busId: string | null;
};

export const STUDENTS: DStudent[] = [
    { id: "st1", name: "Aarav Sharma", admissionNo: "ADM-2024-0101", studentId: "STU-101", rollNo: "12", klass: "V", section: "A", gender: "Male", dob: "14 Jun 2015", parentName: "Rohit Sharma", parentPhone: "+91 98100 11223", busId: "b1" },
    { id: "st2", name: "Diya Patel", admissionNo: "ADM-2024-0102", studentId: "STU-102", rollNo: "07", klass: "III", section: "B", gender: "Female", dob: "02 Nov 2017", parentName: "Kiran Patel", parentPhone: "+91 98200 22334", busId: "b1" },
    { id: "st3", name: "Kabir Verma", admissionNo: "ADM-2024-0103", studentId: "STU-103", rollNo: "21", klass: "VII", section: "A", gender: "Male", dob: "23 Jan 2013", parentName: "Deepak Verma", parentPhone: "+91 98300 33445", busId: "b2" },
    { id: "st4", name: "Ananya Iyer", admissionNo: "ADM-2024-0104", studentId: "STU-104", rollNo: "04", klass: "II", section: "C", gender: "Female", dob: "19 Aug 2018", parentName: "Suresh Iyer", parentPhone: "+91 98400 44556", busId: "b2" },
    { id: "st5", name: "Vihaan Gupta", admissionNo: "ADM-2024-0105", studentId: "STU-105", rollNo: "15", klass: "VI", section: "B", gender: "Male", dob: "30 Mar 2014", parentName: "Manish Gupta", parentPhone: "+91 98500 55667", busId: "b3" },
    { id: "st6", name: "Sara Khan", admissionNo: "ADM-2024-0106", studentId: "STU-106", rollNo: "09", klass: "IV", section: "A", gender: "Female", dob: "11 Dec 2016", parentName: "Imran Khan", parentPhone: "+91 98600 66778", busId: "b4" },
];

export type DParent = {
    id: string; name: string; father: string; mother: string; phone: string; email: string; address: string;
    studentIds: string[]; subscription: "Active" | "Expired";
};

export const PARENTS: DParent[] = [
    { id: "p1", name: "Rohit Sharma", father: "Rohit Sharma", mother: "Neha Sharma", phone: "+91 98100 11223", email: "rohit.s@gmail.com", address: "A-101, Sector 62, Noida", studentIds: ["st1"], subscription: "Active" },
    { id: "p2", name: "Kiran Patel", father: "Kiran Patel", mother: "Rekha Patel", phone: "+91 98200 22334", email: "kiran.p@gmail.com", address: "B-45, Indirapuram, Ghaziabad", studentIds: ["st2"], subscription: "Active" },
    { id: "p3", name: "Deepak Verma", father: "Deepak Verma", mother: "Pooja Verma", phone: "+91 98300 33445", email: "deepak.v@gmail.com", address: "C-12, Vasundhara, Ghaziabad", studentIds: ["st3"], subscription: "Active" },
    { id: "p4", name: "Suresh Iyer", father: "Suresh Iyer", mother: "Lakshmi Iyer", phone: "+91 98400 44556", email: "suresh.i@gmail.com", address: "D-78, Sector 45, Gurugram", studentIds: ["st4"], subscription: "Expired" },
    { id: "p5", name: "Manish Gupta", father: "Manish Gupta", mother: "Ritu Gupta", phone: "+91 98500 55667", email: "manish.g@gmail.com", address: "E-23, Raj Nagar, Ghaziabad", studentIds: ["st5", "st6"], subscription: "Active" },
];

export const RECENT_ACTIVITY = [
    { id: "a1", icon: "bus" as const, color: GREEN, soft: GREEN_SOFT, text: "BUS-01 started Route A trip", time: "2 min ago" },
    { id: "a2", icon: "person-add" as const, color: BLUE, soft: BLUE_SOFT, text: "New parent registered — Kiran Patel", time: "18 min ago" },
    { id: "a3", icon: "warning" as const, color: ORANGE, soft: ORANGE_SOFT, text: "BUS-03 GPS went offline", time: "26 min ago" },
    { id: "a4", icon: "checkmark-circle" as const, color: GREEN, soft: GREEN_SOFT, text: "BUS-02 completed morning pickup", time: "1 hr ago" },
    { id: "a5", icon: "construct" as const, color: PURPLE, soft: PURPLE_SOFT, text: "BUS-05 sent for maintenance", time: "2 hrs ago" },
];

export const busStatusColor = (s: DBus["status"]) =>
    s === "Running" ? { color: GREEN, soft: GREEN_SOFT } :
        s === "Offline" ? { color: ORANGE, soft: ORANGE_SOFT } :
            s === "Maintenance" ? { color: PURPLE, soft: PURPLE_SOFT } :
                { color: RED, soft: RED_SOFT };

export const driverForBus = (busId: string | null) => DRIVERS.find((d) => d.busId === busId);
export const busById = (id: string | null) => BUSES.find((b) => b.id === id);
export const studentById = (id: string) => STUDENTS.find((s) => s.id === id);
