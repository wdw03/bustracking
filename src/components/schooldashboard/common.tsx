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
import { supabase } from "../../services/supabase";

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

/* ─────────────── School schema & data defaults ─────────────── */
export const SCHOOL = {
    name: "School Portal",
    code: "SCH-000",
    principal: "—",
    phone: "—",
    email: "—",
    address: "—",
    subscription: { plan: "Standard", status: "Active", expiry: "—", renewal: "—", studentsAllowed: 0, busesAllowed: 0, parentSubs: 0, commissionPct: 20, balance: 0 },
};

export type DBus = {
    id: string; number: string; vehicleNumber: string; name: string; driverId: string; helper: string; helperPhone: string;
    status: "Running" | "Offline" | "Maintenance" | "Disabled"; location: string; speed: number; color: string;
    students: number; route: string; lastUpdated: string; battery: number; gps: "Online" | "Offline";
};

export const BUSES: DBus[] = [];

export type DDriver = {
    id: string; name: string; driverId: string; phone: string; license: string; busId: string | null;
    status: "Active" | "Suspended"; experience: string; trips: number; rating: number;
};

export const DRIVERS: DDriver[] = [];

export type DStudent = {
    id: string; name: string; admissionNo: string; studentId: string; rollNo: string; klass: string; section: string;
    gender: string; dob: string; parentName: string; parentPhone: string; busId: string | null;
};

export const STUDENTS: DStudent[] = [];

export type DParent = {
    id: string; name: string; father: string; mother: string; phone: string; email: string; address: string;
    studentIds: string[]; subscription: "Active" | "Expired";
};

export const PARENTS: DParent[] = [];

export type SchoolProfile = {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    principal: string;
    principalPhone: string;
    gstNumber: string;
    website: string;
    logoUrl: string;
    status: string;
    code: string;
};

/* Dashboard data provider — hydates from Supabase database */
type SchoolData = {
    schoolId: string | null;
    schoolName: string;
    schoolProfile: SchoolProfile;
    buses: DBus[];
    drivers: DDriver[];
    students: DStudent[];
    parents: DParent[];
    addStudent: (student: DStudent) => Promise<{ success: boolean; data?: DStudent; error?: string }>;
    updateStudent: (student: DStudent) => Promise<{ success: boolean; error?: string }>;
    removeStudent: (id: string) => Promise<{ success: boolean; error?: string }>;
    assignStudentToBus: (studentId: string, busId: string | null) => Promise<{ success: boolean; error?: string }>;
    addBus: (bus: DBus) => Promise<{ success: boolean; data?: DBus; error?: string }>;
    updateBus: (bus: DBus) => Promise<{ success: boolean; error?: string }>;
    removeBus: (id: string) => Promise<{ success: boolean; error?: string }>;
    addDriver: (driver: DDriver) => Promise<{ success: boolean; data?: DDriver; error?: string }>;
    updateDriver: (driver: DDriver) => Promise<{ success: boolean; error?: string }>;
    removeDriver: (id: string) => Promise<{ success: boolean; error?: string }>;
    addParent: (parent: { name: string; phone: string; studentId?: string | null }) => Promise<{ success: boolean; data?: DParent; error?: string }>;
    removeParent: (idOrPhone: string) => Promise<{ success: boolean; error?: string }>;
    sendSchoolNotification: (title: string, body: string, audience: string, busId?: string | null) => Promise<{ success: boolean; error?: string }>;
    updateSchoolProfile: (updates: Partial<Omit<SchoolProfile, "id" | "phone">>) => Promise<{ success: boolean; error?: string }>;
    isLoading: boolean;
};

const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
    id: "",
    name: "School Portal",
    phone: "—",
    email: "—",
    address: "—",
    city: "—",
    state: "—",
    pincode: "—",
    principal: "—",
    principalPhone: "—",
    gstNumber: "—",
    website: "—",
    logoUrl: "",
    status: "approved",
    code: "SCH-000",
};

const SchoolDataContext = createContext<SchoolData | null>(null);

export function SchoolDataProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [schoolId, setSchoolId] = useState<string | null>(null);
    const [schoolName, setSchoolName] = useState<string>("School Dashboard");
    const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(DEFAULT_SCHOOL_PROFILE);
    const [buses, setBuses] = useState<DBus[]>([]);
    const [drivers, setDrivers] = useState<DDriver[]>([]);
    const [students, setStudents] = useState<DStudent[]>([]);
    const [parents, setParents] = useState<DParent[]>([]);

    // Fetch school_id + live fleet data from Supabase on mount
    useEffect(() => {
        const fetchSchoolData = async () => {
            try {
                // Step 1: Resolve school_id from school_members or schools for current user
                const { data: { user } } = await supabase.auth.getUser();
                let resolvedSchoolId: string | null = null;

                if (user) {
                    const { data: memberData } = await supabase
                        .from("school_members")
                        .select("school_id, schools:school_id(*)")
                        .eq("user_id", user.id)
                        .eq("is_active", true)
                        .limit(1)
                        .maybeSingle();

                    if (memberData) {
                        resolvedSchoolId = memberData.school_id;
                        setSchoolId(resolvedSchoolId);
                        const s = memberData.schools as any;
                        if (s) {
                            if (s.name) setSchoolName(s.name);
                            setSchoolProfile({
                                id: s.id,
                                name: s.name || "School Portal",
                                phone: s.phone || "—",
                                email: s.email || "—",
                                address: s.address || "—",
                                city: s.city || "—",
                                state: s.state || "—",
                                pincode: s.pincode || "—",
                                principal: s.principal_name || "—",
                                principalPhone: s.principal_phone || "—",
                                gstNumber: s.gst_number || "—",
                                website: s.website || "—",
                                logoUrl: s.logo_url || "",
                                status: s.status || "approved",
                                code: `SCH-${s.id.slice(0, 4).toUpperCase()}`,
                            });
                        }
                    } else {
                        const { data: ownedSchool } = await supabase
                            .from("schools")
                            .select("*")
                            .or(`admin_user_id.eq.${user.id},phone.eq.${user.phone || ""}`)
                            .limit(1)
                            .maybeSingle();

                        if (ownedSchool) {
                            resolvedSchoolId = ownedSchool.id;
                            setSchoolId(resolvedSchoolId);
                            setSchoolName(ownedSchool.name);
                            setSchoolProfile({
                                id: ownedSchool.id,
                                name: ownedSchool.name || "School Portal",
                                phone: ownedSchool.phone || "—",
                                email: ownedSchool.email || "—",
                                address: ownedSchool.address || "—",
                                city: ownedSchool.city || "—",
                                state: ownedSchool.state || "—",
                                pincode: ownedSchool.pincode || "—",
                                principal: ownedSchool.principal_name || "—",
                                principalPhone: ownedSchool.principal_phone || "—",
                                gstNumber: ownedSchool.gst_number || "—",
                                website: ownedSchool.website || "—",
                                logoUrl: ownedSchool.logo_url || "",
                                status: ownedSchool.status || "approved",
                                code: `SCH-${ownedSchool.id.slice(0, 4).toUpperCase()}`,
                            });
                        }
                    }
                }

                // Step 2: Fetch buses, drivers, children, child_parents, authorized_contacts
                const [busesRes, driversRes, childrenRes, parentsRes, contactsRes] = await Promise.all([
                    supabase.from("buses").select("*, bus_live_locations(latitude, longitude, speed, heading, is_live, updated_at)").eq("is_active", true).order("bus_number"),
                    supabase.from("drivers").select("*, profiles:user_id(full_name, phone, avatar_url)").eq("is_active", true),
                    supabase.from("children").select("*, child_parents(parent_user_id, profiles:parent_user_id(full_name, phone))").eq("is_active", true).order("full_name"),
                    resolvedSchoolId
                        ? supabase.from("child_parents").select("parent_user_id, relationship, children:child_id(id, school_id), profiles:parent_user_id(id, full_name, phone)")
                        : Promise.resolve({ data: null }),
                    supabase.from("authorized_contacts").select("*"),
                ]);

                if (busesRes.data) {
                    const mappedBuses: DBus[] = busesRes.data.map((b: any, idx: number) => {
                        const loc = Array.isArray(b.bus_live_locations) ? b.bus_live_locations[0] : b.bus_live_locations;
                        const isLive = loc?.is_live ?? false;
                        const updatedAt = loc?.updated_at;
                        const timeDiff = updatedAt ? Math.round((Date.now() - new Date(updatedAt).getTime()) / 1000) : 0;
                        const lastUpdated = isLive
                            ? (timeDiff < 60 ? `${timeDiff} sec ago` : `${Math.round(timeDiff / 60)} min ago`)
                            : "Offline";

                        return {
                            id: b.id,
                            number: b.bus_number || `BUS-${idx + 1}`,
                            vehicleNumber: b.model?.split("·")?.[0]?.trim() || b.bus_number || `BUS-${idx + 1}`,
                            name: b.model?.split("·")?.[1]?.trim() || b.route_name || b.bus_number || "School Bus",
                            driverId: "",
                            helper: "Staff Helper",
                            helperPhone: "",
                            status: isLive ? "Running" as const : "Offline" as const,
                            location: isLive ? "On Route" : "Parked",
                            speed: loc?.speed ? Number(loc.speed) : 0,
                            color: ["#2563EB", "#16A34A", "#EA580C", "#DC2626", "#7C3AED"][idx % 5],
                            students: b.capacity || 30,
                            route: b.route_name || "Main Route",
                            lastUpdated,
                            battery: 85,
                            gps: isLive ? "Online" as const : "Offline" as const,
                        };
                    });
                    setBuses(mappedBuses);
                }

                // Drivers: merge registered drivers + authorized contacts
                const driverList: DDriver[] = [];
                const seenPhones = new Set<string>();

                if (driversRes.data) {
                    driversRes.data.forEach((d: any, idx: number) => {
                        const profile = d.profiles;
                        const pPhone = profile?.phone || "";
                        if (pPhone) seenPhones.add(pPhone.replace(/[^0-9]/g, "").slice(-10));
                        driverList.push({
                            id: d.id,
                            name: profile?.full_name || `Driver ${idx + 1}`,
                            driverId: `DRV-${String(idx + 1).padStart(3, "0")}`,
                            phone: pPhone,
                            license: d.license_number || "Verified",
                            busId: d.assigned_bus_id || null,
                            status: d.is_active ? "Active" as const : "Suspended" as const,
                            experience: `${d.experience_years || 0} yrs`,
                            trips: 0,
                            rating: d.rating ? Number(d.rating) : 5.0,
                        });
                    });
                }

                if (contactsRes.data) {
                    const authorizedDrivers = (contactsRes.data as any[]).filter(c => c.contact_type === "driver");
                    authorizedDrivers.forEach((c: any, idx: number) => {
                        const raw10 = c.phone ? c.phone.replace(/[^0-9]/g, "").slice(-10) : "";
                        if (raw10 && !seenPhones.has(raw10)) {
                            seenPhones.add(raw10);
                            driverList.push({
                                id: c.id,
                                name: `Driver (${c.phone})`,
                                driverId: `DRV-AUTH-${String(idx + 1).padStart(2, "0")}`,
                                phone: c.phone,
                                license: "DL-Pending",
                                busId: null,
                                status: "Active" as const,
                                experience: "New",
                                trips: 0,
                                rating: 5.0,
                            });
                        }
                    });
                }
                setDrivers(driverList);

                // Students: map children and resolve parent contact info
                if (childrenRes.data) {
                    const parentContacts = new Map<string, string>();
                    if (contactsRes.data) {
                        for (const c of contactsRes.data as any[]) {
                            if (c.contact_type === "parent" && c.child_id) {
                                parentContacts.set(c.child_id, c.phone);
                            }
                        }
                    }

                    const mappedStudents: DStudent[] = childrenRes.data.map((c: any) => {
                        const parentInfo = Array.isArray(c.child_parents) && c.child_parents.length > 0
                            ? c.child_parents[0]?.profiles
                            : null;
                        const parentPhone = parentInfo?.phone || parentContacts.get(c.id) || "—";

                        return {
                            id: c.id,
                            name: c.full_name,
                            admissionNo: c.admission_number || c.roll_number || "—",
                            studentId: c.admission_number || c.roll_number || "—",
                            rollNo: c.roll_number || "—",
                            klass: c.class || "—",
                            section: c.section || "—",
                            gender: c.gender || "—",
                            dob: c.date_of_birth || "—",
                            parentName: parentInfo?.full_name || "Guardian",
                            parentPhone: parentPhone,
                            busId: c.assigned_bus_id || null,
                        };
                    });
                    setStudents(mappedStudents);
                }

                // Parents aggregation
                const parentMap = new Map<string, DParent>();
                if (parentsRes.data) {
                    for (const row of parentsRes.data as any[]) {
                        const profile = row.profiles;
                        const child = row.children;
                        if (!profile || !child) continue;
                        if (resolvedSchoolId && child.school_id !== resolvedSchoolId) continue;

                        if (!parentMap.has(profile.id)) {
                            parentMap.set(profile.id, {
                                id: profile.id,
                                name: profile.full_name || "—",
                                father: profile.full_name || "—",
                                mother: "—",
                                phone: profile.phone || "—",
                                email: "—",
                                address: "—",
                                studentIds: [],
                                subscription: "Active",
                            });
                        }
                        parentMap.get(profile.id)!.studentIds.push(child.id);
                    }
                }

                if (contactsRes.data) {
                    const authParents = (contactsRes.data as any[]).filter(c => c.contact_type === "parent");
                    authParents.forEach((c: any) => {
                        const raw10 = c.phone ? c.phone.replace(/[^0-9]/g, "").slice(-10) : "";
                        if (raw10) {
                            const existing = Array.from(parentMap.values()).find(p => p.phone.replace(/[^0-9]/g, "").slice(-10) === raw10);
                            if (!existing) {
                                parentMap.set(c.id, {
                                    id: c.id,
                                    name: `Parent (${c.phone})`,
                                    father: "Guardian",
                                    mother: "—",
                                    phone: c.phone,
                                    email: "—",
                                    address: "—",
                                    studentIds: c.child_id ? [c.child_id] : [],
                                    subscription: "Active",
                                });
                            } else if (c.child_id && !existing.studentIds.includes(c.child_id)) {
                                existing.studentIds.push(c.child_id);
                            }
                        }
                    });
                }
                setParents(Array.from(parentMap.values()));
            } catch (err) {
                console.warn("Supabase fetchSchoolData error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSchoolData();
    }, []);

    const value = useMemo<SchoolData>(() => ({
        schoolId,
        schoolName,
        schoolProfile,
        buses,
        drivers,
        students,
        parents,
        isLoading,
        addStudent: async (student) => {
            try {
                let sid = schoolId;
                if (!sid) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: s } = await supabase.from("schools").select("id").or(`admin_user_id.eq.${user.id},phone.eq.${user.phone || ""}`).limit(1).maybeSingle();
                        sid = s?.id || null;
                    }
                }
                if (!sid) return { success: false, error: "School account not identified." };

                // Try inserting with new columns first, fallback without them
                let childData: any = null;
                let childErr: any = null;
                const insertPayload: Record<string, any> = {
                    school_id: sid,
                    full_name: student.name || "Unnamed Student",
                    roll_number: student.rollNo && student.rollNo !== "—" ? student.rollNo : null,
                    class: student.klass && student.klass !== "—" ? student.klass : null,
                    section: student.section && student.section !== "—" ? student.section : null,
                    assigned_bus_id: student.busId || null,
                    is_active: true,
                };
                // Add optional columns (may not exist in all schemas)
                if (student.admissionNo && student.admissionNo !== "—") insertPayload.admission_number = student.admissionNo;
                if (student.dob && student.dob !== "Not added" && student.dob !== "—") insertPayload.date_of_birth = student.dob;
                if (student.gender && student.gender !== "—") insertPayload.gender = student.gender;

                const res1 = await supabase.from("children").insert(insertPayload).select("id").single();
                if (res1.error && (res1.error.message?.includes("column") || res1.error.message?.includes("structure"))) {
                    // Retry without new columns
                    const { admission_number, date_of_birth, gender, ...basic } = insertPayload;
                    const res2 = await supabase.from("children").insert(basic).select("id").single();
                    childData = res2.data;
                    childErr = res2.error;
                } else {
                    childData = res1.data;
                    childErr = res1.error;
                }

                if (childErr || !childData) {
                    console.warn("children insert error:", childErr);
                    return { success: false, error: childErr?.message || "Failed to add student to database" };
                }

                const realId = childData.id;
                const finalStudent = { ...student, id: realId };

                // Authorize parent phone for registration
                if (student.parentPhone && student.parentPhone !== "—") {
                    const phone = student.parentPhone.replace(/[^0-9+]/g, "");
                    const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
                    await supabase.from("authorized_contacts").upsert({
                        school_id: sid,
                        phone: formatted,
                        contact_type: "parent" as const,
                        child_id: realId,
                        is_registered: false,
                    }, { onConflict: "school_id,phone,contact_type" });
                }

                setStudents((current) => [finalStudent, ...current.filter((s) => s.id !== student.id && s.id !== realId)]);
                return { success: true, data: finalStudent };
            } catch (e: any) {
                console.warn("addStudent Supabase error:", e);
                return { success: false, error: e?.message || "Network error while saving student" };
            }
        },
        updateStudent: async (student) => {
            try {
                setStudents((current) => current.map((item) => item.id === student.id ? student : item));
                const updatePayload: Record<string, any> = {
                    full_name: student.name,
                    class: student.klass && student.klass !== "—" ? student.klass : null,
                    section: student.section && student.section !== "—" ? student.section : null,
                    roll_number: student.rollNo && student.rollNo !== "—" ? student.rollNo : null,
                    assigned_bus_id: student.busId || null,
                    updated_at: new Date().toISOString(),
                };
                // Add optional columns (may not exist in all schemas)
                if (student.admissionNo && student.admissionNo !== "—") updatePayload.admission_number = student.admissionNo;
                if (student.dob && student.dob !== "Not added" && student.dob !== "—") updatePayload.date_of_birth = student.dob;
                if (student.gender && student.gender !== "—") updatePayload.gender = student.gender;

                let updateRes = await supabase.from("children").update(updatePayload).eq("id", student.id);
                if (updateRes.error && (updateRes.error.message?.includes("column") || updateRes.error.message?.includes("structure"))) {
                    const { admission_number, date_of_birth, gender, ...basic } = updatePayload;
                    updateRes = await supabase.from("children").update(basic).eq("id", student.id);
                }

                if (updateRes.error) {
                    console.warn("updateStudent error:", updateRes.error);
                    return { success: false, error: updateRes.error.message };
                }

                if (student.parentPhone && student.parentPhone !== "—" && schoolId) {
                    const phone = student.parentPhone.replace(/[^0-9+]/g, "");
                    const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
                    await supabase.from("authorized_contacts").upsert({
                        school_id: schoolId,
                        phone: formatted,
                        contact_type: "parent" as const,
                        child_id: student.id,
                        is_registered: false,
                    }, { onConflict: "school_id,phone,contact_type" });
                }
                return { success: true };
            } catch (e: any) {
                console.warn("updateStudent error:", e);
                return { success: false, error: e?.message || "Network error while updating student" };
            }
        },
        removeStudent: async (id) => {
            try {
                setStudents((current) => current.filter((student) => student.id !== id));
                const { error } = await supabase.from("children").update({
                    is_active: false,
                    updated_at: new Date().toISOString(),
                }).eq("id", id);
                if (error) return { success: false, error: error.message };
                return { success: true };
            } catch (e: any) {
                console.warn("removeStudent error:", e);
                return { success: false, error: e?.message || "Network error while deleting student" };
            }
        },
        assignStudentToBus: async (studentId, busId) => {
            try {
                setStudents((current) => current.map((student) => student.id === studentId ? { ...student, busId } : student));
                const { error } = await supabase.from("children").update({
                    assigned_bus_id: busId,
                    updated_at: new Date().toISOString(),
                }).eq("id", studentId);
                if (error) return { success: false, error: error.message };
                return { success: true };
            } catch (e: any) {
                console.warn("assignStudentToBus error:", e);
                return { success: false, error: e?.message || "Network error while assigning bus" };
            }
        },
        addBus: async (bus) => {
            try {
                let sid = schoolId;
                if (!sid) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: s } = await supabase.from("schools").select("id").or(`admin_user_id.eq.${user.id},phone.eq.${user.phone || ""}`).limit(1).maybeSingle();
                        sid = s?.id || null;
                    }
                }
                if (!sid) return { success: false, error: "School account not identified." };

                const { data: busData, error: busErr } = await supabase.from("buses").insert({
                    school_id: sid,
                    bus_number: bus.number,
                    route_name: bus.route || bus.name || null,
                    model: bus.vehicleNumber ? `${bus.vehicleNumber} · ${bus.name}` : bus.name,
                    capacity: bus.students || 32,
                    is_active: true,
                }).select("id").single();

                if (busErr || !busData) {
                    console.warn("addBus error:", busErr);
                    return { success: false, error: busErr?.message || "Failed to add bus to database" };
                }

                const realId = busData.id;
                const finalBus = { ...bus, id: realId };
                setBuses((current) => [finalBus, ...current.filter((b) => b.id !== bus.id && b.id !== realId)]);
                return { success: true, data: finalBus };
            } catch (e: any) {
                console.warn("addBus Supabase error:", e);
                return { success: false, error: e?.message || "Network error while saving bus" };
            }
        },
        updateBus: async (bus) => {
            try {
                setBuses((current) => current.map((item) => item.id === bus.id ? bus : item));
                const { error } = await supabase.from("buses").update({
                    bus_number: bus.number,
                    route_name: bus.route || bus.name || null,
                    model: bus.vehicleNumber ? `${bus.vehicleNumber} · ${bus.name}` : bus.name,
                    capacity: bus.students || null,
                    is_active: bus.status !== "Disabled",
                    updated_at: new Date().toISOString(),
                }).eq("id", bus.id);

                if (error) return { success: false, error: error.message };
                return { success: true };
            } catch (e: any) {
                console.warn("updateBus error:", e);
                return { success: false, error: e?.message || "Network error while updating bus" };
            }
        },
        removeBus: async (id) => {
            try {
                setBuses((current) => current.filter((bus) => bus.id !== id));
                setStudents((current) => current.map((student) => student.busId === id ? { ...student, busId: null } : student));
                const { error } = await supabase.from("buses").update({
                    is_active: false,
                    updated_at: new Date().toISOString(),
                }).eq("id", id);
                if (error) return { success: false, error: error.message };
                return { success: true };
            } catch (e: any) {
                console.warn("removeBus error:", e);
                return { success: false, error: e?.message || "Network error while deleting bus" };
            }
        },
        addDriver: async (driver) => {
            try {
                let sid = schoolId;
                if (!sid) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: s } = await supabase.from("schools").select("id").or(`admin_user_id.eq.${user.id},phone.eq.${user.phone || ""}`).limit(1).maybeSingle();
                        sid = s?.id || null;
                    }
                }
                if (!sid) return { success: false, error: "School account not identified." };

                const phone = driver.phone.replace(/[^0-9+]/g, "");
                const formatted = phone.startsWith("+") ? phone : `+91${phone}`;

                const { data: contactData, error: contactErr } = await supabase.from("authorized_contacts").upsert({
                    school_id: sid,
                    phone: formatted,
                    contact_type: "driver" as const,
                    is_registered: false,
                }, { onConflict: "school_id,phone,contact_type" }).select("id").single();

                if (contactErr) {
                    console.warn("addDriver authorize error:", contactErr);
                    return { success: false, error: contactErr.message };
                }

                const realId = contactData?.id || driver.id;
                const finalDriver = { ...driver, id: realId, phone: formatted };
                setDrivers((current) => [finalDriver, ...current.filter((d) => d.id !== driver.id && d.id !== realId)]);
                return { success: true, data: finalDriver };
            } catch (e: any) {
                console.warn("addDriver Supabase error:", e);
                return { success: false, error: e?.message || "Network error while saving driver" };
            }
        },
        updateDriver: async (driver) => {
            try {
                setDrivers((current) => current.map((d) => d.id === driver.id ? driver : d));

                const cleanPhone = (driver.phone || "").replace(/[^0-9+]/g, "");
                const raw10 = cleanPhone.replace(/\D/g, "").slice(-10);
                const formattedPhone = raw10 ? (cleanPhone.startsWith("+") ? cleanPhone : `+91${raw10}`) : "";
                const expYears = parseInt(driver.experience.replace(/\D/g, "")) || 0;

                // 1. Try RPC first for SECURITY DEFINER update across tables
                try {
                    const { error: rpcErr } = await supabase.rpc("update_driver_details", {
                        p_driver_id: driver.id,
                        p_name: driver.name.trim(),
                        p_phone: formattedPhone || null,
                        p_license: driver.license || null,
                        p_experience: expYears,
                        p_bus_id: driver.busId || null,
                    });
                    if (!rpcErr) {
                        return { success: true };
                    }
                } catch (_) {}

                // 2. Direct table update fallback
                let driverUserId: string | null = null;
                const { data: existingD } = await supabase
                    .from("drivers")
                    .select("id, user_id")
                    .eq("id", driver.id)
                    .maybeSingle();

                if (existingD) {
                    driverUserId = existingD.user_id;
                    await supabase.from("drivers").update({
                        assigned_bus_id: driver.busId || null,
                        license_number: driver.license || null,
                        experience_years: expYears,
                        is_active: true,
                        updated_at: new Date().toISOString(),
                    }).eq("id", driver.id);
                } else if (raw10) {
                    // Try finding driver profile by phone
                    const { data: prof } = await supabase
                        .from("profiles")
                        .select("id")
                        .or(`phone.eq.${formattedPhone},phone.eq.${cleanPhone},phone.eq.${raw10}`)
                        .eq("role", "driver")
                        .maybeSingle();

                    if (prof) {
                        driverUserId = prof.id;
                        await supabase.from("drivers").update({
                            assigned_bus_id: driver.busId || null,
                            license_number: driver.license || null,
                            experience_years: expYears,
                            is_active: true,
                            updated_at: new Date().toISOString(),
                        }).eq("user_id", prof.id);
                    }
                }

                // 3. Update driver's name in profiles table
                if (driverUserId) {
                    await supabase.from("profiles").update({
                        full_name: driver.name.trim(),
                        ...(formattedPhone ? { phone: formattedPhone } : {}),
                        updated_at: new Date().toISOString(),
                    }).eq("id", driverUserId);
                } else if (raw10) {
                    await supabase.from("profiles").update({
                        full_name: driver.name.trim(),
                        updated_at: new Date().toISOString(),
                    }).or(`phone.eq.${formattedPhone},phone.eq.${cleanPhone},phone.eq.${raw10}`);
                }

                // 4. Update or sync authorized_contacts
                if (raw10 && schoolId) {
                    await supabase.from("authorized_contacts").upsert({
                        school_id: schoolId,
                        phone: formattedPhone,
                        contact_type: "driver" as const,
                        is_registered: true,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "school_id,phone,contact_type" });
                }

                return { success: true };
            } catch (e: any) {
                console.warn("updateDriver error:", e);
                return { success: false, error: e?.message || "Network error while updating driver" };
            }
        },
        removeDriver: async (id) => {
            try {
                const target = drivers.find((d) => d.id === id);
                setDrivers((current) => current.filter((driver) => driver.id !== id));

                await supabase.from("drivers").update({
                    is_active: false,
                    updated_at: new Date().toISOString(),
                }).eq("id", id);

                if (target?.phone) {
                    const phone = target.phone.replace(/[^0-9+]/g, "");
                    const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
                    await supabase.from("authorized_contacts").delete().eq("phone", formatted);
                }
                return { success: true };
            } catch (e: any) {
                console.warn("removeDriver error:", e);
                return { success: false, error: e?.message || "Network error while removing driver" };
            }
        },
        addParent: async (parent) => {
            try {
                let sid = schoolId;
                if (!sid) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: s } = await supabase.from("schools").select("id").or(`admin_user_id.eq.${user.id},phone.eq.${user.phone || ""}`).limit(1).maybeSingle();
                        sid = s?.id || null;
                    }
                }
                if (!sid) return { success: false, error: "School account not identified." };

                const phone = parent.phone.replace(/[^0-9+]/g, "");
                const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

                const { data: contact, error: cErr } = await supabase.from("authorized_contacts").upsert({
                    school_id: sid,
                    phone: formattedPhone,
                    contact_type: "parent",
                    child_id: parent.studentId || null,
                    is_registered: false,
                }, { onConflict: "school_id,phone,contact_type" }).select().single();

                if (cErr) {
                    console.warn("Supabase addParent error:", cErr);
                }

                const newParent: DParent = {
                    id: contact?.id || `p-${Date.now()}`,
                    name: parent.name,
                    father: parent.name,
                    mother: "—",
                    phone: parent.phone,
                    email: "—",
                    address: "—",
                    studentIds: parent.studentId ? [parent.studentId] : [],
                    subscription: "Active",
                };

                setParents((current) => {
                    const existing = current.find(p => p.phone.replace(/[^0-9]/g, "").slice(-10) === phone.slice(-10));
                    if (existing) {
                        return current.map(p => p.id === existing.id ? {
                            ...p,
                            name: parent.name || p.name,
                            studentIds: parent.studentId && !p.studentIds.includes(parent.studentId) ? [...p.studentIds, parent.studentId] : p.studentIds,
                        } : p);
                    }
                    return [newParent, ...current];
                });

                return { success: true, data: newParent };
            } catch (e: any) {
                console.warn("addParent error:", e);
                return { success: false, error: e?.message || "Network error while adding parent" };
            }
        },
        removeParent: async (idOrPhone) => {
            try {
                setParents((current) => current.filter((p) => p.id !== idOrPhone && p.phone !== idOrPhone));
                const phone = idOrPhone.replace(/[^0-9+]/g, "");
                const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
                await supabase.from("authorized_contacts").delete().or(`id.eq.${idOrPhone},phone.eq.${formatted}`);
                return { success: true };
            } catch (e: any) {
                console.warn("removeParent error:", e);
                return { success: false, error: e?.message || "Network error while removing parent" };
            }
        },
        sendSchoolNotification: async (title, body, audience, busId) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from("notifications").insert({
                        user_id: user.id,
                        title,
                        body,
                        type: "school_update",
                        is_read: false,
                    });
                }
                return { success: true };
            } catch (e: any) {
                console.warn("sendSchoolNotification error:", e);
                return { success: false, error: e?.message || "Network error while sending notification" };
            }
        },
        updateSchoolProfile: async (updates) => {
            try {
                let targetId = schoolId || schoolProfile.id;
                if (!targetId || targetId === "sch-1") {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const cleanUserPhone = (user.phone || "").replace(/\D/g, "");
                        const raw10 = cleanUserPhone.slice(-10);
                        const formattedUserPhone = cleanUserPhone.startsWith("+") ? cleanUserPhone : `+91${raw10}`;
                        const { data: s } = await supabase
                            .from("schools")
                            .select("id")
                            .or(`admin_user_id.eq.${user.id},phone.eq.${formattedUserPhone},phone.eq.${cleanUserPhone},phone.eq.${raw10}`)
                            .limit(1)
                            .maybeSingle();
                        if (s?.id) targetId = s.id;
                    }
                }

                if (!targetId) targetId = "38bbeaa3-8e42-468c-a26e-0b82e0d34e3d"; // Fallback to current registered school
                
                const { updateSchoolProfile: updateApi } = await import("../../services/schoolService");
                const res = await updateApi(targetId, {
                    name: updates.name,
                    principal_name: updates.principal,
                    email: updates.email,
                    address: updates.address,
                    city: updates.city,
                    state: updates.state,
                    pincode: updates.pincode,
                    principal_phone: updates.principalPhone,
                    gst_number: updates.gstNumber,
                    website: updates.website,
                    logo_url: updates.logoUrl,
                });

                if (!res.success) return { success: false, error: res.error };

                setSchoolProfile((prev) => ({
                    ...prev,
                    ...updates,
                    name: updates.name ?? prev.name,
                    principal: updates.principal ?? prev.principal,
                }));
                if (updates.name) setSchoolName(updates.name);
                return { success: true };
            } catch (e: any) {
                return { success: false, error: e?.message || "Failed to update school details" };
            }
        },
    }), [buses, drivers, students, parents, isLoading, schoolId, schoolProfile, schoolName]);

    return <SchoolDataContext.Provider value={value}>{children}</SchoolDataContext.Provider>;
}

export function useSchoolData() {
    const data = useContext(SchoolDataContext);
    if (!data) throw new Error("useSchoolData must be used inside SchoolDataProvider");
    return data;
}

export const RECENT_ACTIVITY: { id: string; icon: keyof typeof Ionicons.glyphMap; color: string; soft: string; text: string; time: string }[] = [];

export const busStatusColor = (s: DBus["status"]) =>
    s === "Running" ? { color: GREEN, soft: GREEN_SOFT } :
        s === "Offline" ? { color: ORANGE, soft: ORANGE_SOFT } :
            s === "Maintenance" ? { color: PURPLE, soft: PURPLE_SOFT } :
                { color: RED, soft: RED_SOFT };

export const driverForBus = (busId: string | null, source: DDriver[] = DRIVERS) => source.find((d) => d.busId === busId);
export const busById = (id: string | null, source: DBus[] = BUSES) => source.find((b) => b.id === id);
export const studentById = (id: string) => STUDENTS.find((s) => s.id === id);
