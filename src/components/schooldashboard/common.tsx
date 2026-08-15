/* ============================================================================
   SCHOOL DASHBOARD — SHARED CORE (theme, components, local starter data)
   Copy to: src/components/schooldashboard/common.tsx
   Every school-dashboard page imports from this file.
   ========================================================================== */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Pressable, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SkeletonItem } from "../common/Skeleton";

export { SkeletonItem };

/* ─────────────── Theme ─────────────── */
export const ACCENT = "#FFD500";
export const ACCENT_SOFT = "#FFF7CC";
export const ACCENT_DEEP = "#B99700";
export const ACCENT_LINE = "#F5E6A3";

// Fallback constants to prevent breaking during migration
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

export type Theme = {
    isDark: boolean;
    INK: string; MUTED: string; FAINT: string; BORDER: string; CARD_BG: string; PAGE_BG: string;
    GREEN: string; GREEN_SOFT: string; RED: string; RED_SOFT: string;
    BLUE: string; BLUE_SOFT: string; ORANGE: string; ORANGE_SOFT: string;
    PURPLE: string; PURPLE_SOFT: string;
    ACCENT: string; ACCENT_SOFT: string; ACCENT_DEEP: string;
}

export const lightTheme: Theme = {
    isDark: false,
    INK: "#111827", MUTED: "#6B7280", FAINT: "#9CA3AF", BORDER: "#E5E7EB", CARD_BG: "#FFFFFF", PAGE_BG: "#F8F9FB",
    GREEN: "#16A34A", GREEN_SOFT: "#DCFCE7", RED: "#DC2626", RED_SOFT: "#FEE2E2",
    BLUE: "#2563EB", BLUE_SOFT: "#DBEAFE", ORANGE: "#EA580C", ORANGE_SOFT: "#FFEDD5",
    PURPLE: "#7C3AED", PURPLE_SOFT: "#EDE9FE",
    ACCENT, ACCENT_SOFT, ACCENT_DEEP
};

export const darkTheme: Theme = {
    isDark: true,
    INK: "#F9FAFB", MUTED: "#9CA3AF", FAINT: "#4B5563", BORDER: "#1F2937", CARD_BG: "#111827", PAGE_BG: "#030712",
    GREEN: "#22C55E", GREEN_SOFT: "rgba(34,197,94,0.15)", RED: "#EF4444", RED_SOFT: "rgba(239,68,68,0.15)",
    BLUE: "#3B82F6", BLUE_SOFT: "rgba(59,130,246,0.15)", ORANGE: "#F97316", ORANGE_SOFT: "rgba(249,115,22,0.15)",
    PURPLE: "#8B5CF6", PURPLE_SOFT: "rgba(139,92,246,0.15)",
    ACCENT, ACCENT_SOFT: "rgba(255,213,0,0.15)", ACCENT_DEEP: "#E6C200"
};

type SettingsContextType = {
    isDarkMode: boolean; setIsDarkMode: (v: boolean) => void;
    gpsEnabled: boolean; setGpsEnabled: (v: boolean) => void;
    notificationsEnabled: boolean; setNotificationsEnabled: (v: boolean) => void;
    biometricsEnabled: boolean; setBiometricsEnabled: (v: boolean) => void;
    mapStyle: string; setMapStyle: (v: string) => void;
    schoolAddress: string; setSchoolAddress: (v: string) => void;
    schoolCoordinate: [number, number]; setSchoolCoordinate: (v: [number, number]) => void;
    theme: Theme;
};
export const SettingsContext = createContext<SettingsContextType | null>(null);
export const useSettings = () => {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
    return ctx;
};
export const useTheme = () => useSettings().theme;

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [gpsEnabled, setGpsEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [mapStyle, setMapStyle] = useState("Standard");
    const [schoolAddress, setSchoolAddress] = useState("Plot 7, Knowledge Park, Sector 62, Noida, UP 201301");
    const [schoolCoordinate, setSchoolCoordinate] = useState<[number, number]>([77.364, 28.6271]);
    const theme = isDarkMode ? darkTheme : lightTheme;
    return (
        <SettingsContext.Provider value={{ isDarkMode, setIsDarkMode, gpsEnabled, setGpsEnabled, notificationsEnabled, setNotificationsEnabled, biometricsEnabled, setBiometricsEnabled, mapStyle, setMapStyle, schoolAddress, setSchoolAddress, schoolCoordinate, setSchoolCoordinate, theme }}>
            {children}
        </SettingsContext.Provider>
    );
}

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
    const { ACCENT, INK, isDark } = useTheme();
    return (
        <View
            style={{
                backgroundColor: ACCENT,
                zIndex: 10,
                elevation: 8,
                paddingTop: topInset + ms(8),
                paddingBottom: ms(16),
                paddingHorizontal: ms(16),
                borderBottomLeftRadius: ms(26),
                borderBottomRightRadius: ms(26),
                shadowColor: "#8B7300",
                shadowOpacity: 0.12,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                {onBack ? (
                    <Press onPress={onBack} style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: isDark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.55)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="chevron-back" size={ms(20)} color={INK} />
                    </Press>
                ) : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK, letterSpacing: -0.4 }}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(12), color: isDark ? "rgba(0,0,0,0.6)" : "#6B5900", marginTop: 1 }}>
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
    const { ACCENT_SOFT, ACCENT_DEEP, INK } = useTheme();
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
    const { CARD_BG, INK, MUTED, BORDER } = useTheme();
    return (
        <View style={{ backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, padding: ms(10), shadowColor: color, shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1, alignItems: "center" }}>
            <View style={{ width: ms(32), height: ms(32), borderRadius: ms(10), backgroundColor: soft, alignItems: "center", justifyContent: "center", marginBottom: ms(6) }}>
                <Ionicons name={icon} size={ms(16)} color={color} />
            </View>
            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(15), color: INK }}>{value}</Text>
            <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(10), color: MUTED, marginTop: 2 }}>{label}</Text>
        </View>
    );
}

export function InfoRow({ icon, label, value, color, soft }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color?: string; soft?: string }) {
    const { ACCENT_DEEP, ACCENT_SOFT, FAINT, INK } = useTheme();
    const c = color ?? ACCENT_DEEP;
    const s = soft ?? ACCENT_SOFT;
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10), paddingVertical: ms(8) }}>
            <View style={{ width: ms(32), height: ms(32), borderRadius: ms(11), backgroundColor: s, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={icon} size={ms(15)} color={c} />
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
    const { CARD_BG, BORDER } = useTheme();
    return (
        <View style={[{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(14) }, style]}>{children}</View>
    );
}

/* ─────────────── Local starter data (single source of truth) ─────────────── */
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

/* In-memory dashboard data.  This deliberately lives only while the app is open:
   it makes the prototype behave like a real product without introducing a backend. */
type SchoolData = {
    buses: DBus[];
    drivers: DDriver[];
    students: DStudent[];
    parents: DParent[];
    addStudent: (student: DStudent) => void;
    updateStudent: (student: DStudent) => void;
    removeStudent: (id: string) => void;
    assignStudentToBus: (studentId: string, busId: string | null) => void;
    addBus: (bus: DBus) => void;
    updateBus: (bus: DBus) => void;
    removeBus: (id: string) => void;
    addDriver: (driver: DDriver) => void;
    removeDriver: (id: string) => void;
    isLoading: boolean;
};

const SchoolDataContext = createContext<SchoolData | null>(null);

export function SchoolDataProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [buses, setBuses] = useState<DBus[]>(() => BUSES.map((bus) => ({ ...bus })));
    const [drivers, setDrivers] = useState<DDriver[]>(() => DRIVERS.map((driver) => ({ ...driver })));
    const [students, setStudents] = useState<DStudent[]>(() => STUDENTS.map((student) => ({ ...student })));
    const [parents] = useState<DParent[]>(() => PARENTS.map((parent) => ({ ...parent, studentIds: [...parent.studentIds] })));

    useEffect(() => {
        // Keep the first-frame skeleton brief while the local store hydrates.
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 240);
        return () => clearTimeout(timer);
    }, []);

    const value = useMemo<SchoolData>(() => ({
        buses,
        drivers,
        students,
        parents,
        isLoading,
        addStudent: (student) => setStudents((current) => [student, ...current]),
        updateStudent: (student) => setStudents((current) => current.map((item) => item.id === student.id ? student : item)),
        removeStudent: (id) => setStudents((current) => current.filter((student) => student.id !== id)),
        assignStudentToBus: (studentId, busId) => setStudents((current) => current.map((student) => student.id === studentId ? { ...student, busId } : student)),
        addBus: (bus) => setBuses((current) => [bus, ...current]),
        updateBus: (bus) => setBuses((current) => current.map((item) => item.id === bus.id ? bus : item)),
        removeBus: (id) => {
            setBuses((current) => current.filter((bus) => bus.id !== id));
            setStudents((current) => current.map((student) => student.busId === id ? { ...student, busId: null } : student));
        },
        addDriver: (driver) => setDrivers((current) => [driver, ...current]),
        removeDriver: (id) => setDrivers((current) => current.filter((driver) => driver.id !== id)),
    }), [buses, drivers, students, parents, isLoading]);

    return <SchoolDataContext.Provider value={value}>{children}</SchoolDataContext.Provider>;
}

export function useSchoolData() {
    const data = useContext(SchoolDataContext);
    if (!data) throw new Error("useSchoolData must be used inside SchoolDataProvider");
    return data;
}

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

export const driverForBus = (busId: string | null, source: DDriver[] = DRIVERS) => source.find((d) => d.busId === busId);
export const busById = (id: string | null, source: DBus[] = BUSES) => source.find((b) => b.id === id);
export const studentById = (id: string) => STUDENTS.find((s) => s.id === id);
