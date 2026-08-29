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
    addStudent: (student: DStudent) => void;
    updateStudent: (student: DStudent) => void;
    removeStudent: (id: string) => void;
    assignStudentToBus: (studentId: string, busId: string | null) => void;
    addBus: (bus: DBus) => void;
    updateBus: (bus: DBus) => void;
    removeBus: (id: string) => void;
    addDriver: (driver: DDriver) => void;
    removeDriver: (id: string) => void;
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
                            .eq("admin_user_id", user.id)
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

                // Step 2: Fetch buses, drivers, children (RLS will scope to school)
                const [busesRes, driversRes, childrenRes, parentsRes] = await Promise.all([
                    supabase.from("buses").select("*, bus_live_locations(latitude, longitude, speed, heading, is_live, updated_at)").eq("is_active", true).order("bus_number"),
                    supabase.from("drivers").select("*, profiles:user_id(full_name, phone, avatar_url)").eq("is_active", true),
                    supabase.from("children").select("*, child_parents(parent_user_id, profiles:parent_user_id(full_name, phone))").eq("is_active", true).order("full_name"),
                    resolvedSchoolId
                        ? supabase.from("child_parents").select("parent_user_id, relationship, children:child_id(id, school_id), profiles:parent_user_id(id, full_name, phone)")
                        : Promise.resolve({ data: null }),
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
                            vehicleNumber: b.bus_number || `BUS-${idx + 1}`,
                            name: b.route_name || b.bus_number || "School Bus",
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

                if (driversRes.data) {
                    const mappedDrivers: DDriver[] = driversRes.data.map((d: any, idx: number) => {
                        const profile = d.profiles;
                        return {
                            id: d.id,
                            name: profile?.full_name || `Driver ${idx + 1}`,
                            driverId: `DRV-${String(idx + 1).padStart(3, "0")}`,
                            phone: profile?.phone || "",
                            license: d.license_number || "",
                            busId: d.assigned_bus_id || null,
                            status: d.is_active ? "Active" as const : "Suspended" as const,
                            experience: `${d.experience_years || 0} yrs`,
                            trips: 0,
                            rating: d.rating ? Number(d.rating) : 5.0,
                        };
                    });
                    setDrivers(mappedDrivers);
                }

                if (childrenRes.data) {
                    const mappedStudents: DStudent[] = childrenRes.data.map((c: any) => {
                        const parentInfo = Array.isArray(c.child_parents) && c.child_parents.length > 0
                            ? c.child_parents[0]?.profiles
                            : null;

                        return {
                            id: c.id,
                            name: c.full_name,
                            admissionNo: c.roll_number || "—",
                            studentId: c.roll_number || "—",
                            rollNo: c.roll_number || "—",
                            klass: c.class || "—",
                            section: c.section || "—",
                            gender: "—",
                            dob: "—",
                            parentName: parentInfo?.full_name || "—",
                            parentPhone: parentInfo?.phone || "—",
                            busId: c.assigned_bus_id || null,
                        };
                    });
                    setStudents(mappedStudents);
                }

                if (parentsRes.data) {
                    const parentMap = new Map<string, DParent>();
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
                    setParents(Array.from(parentMap.values()));
                }
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
        addStudent: (student) => {
            setStudents((current) => [student, ...current]);
            // Insert child in Supabase — school_id comes from RLS (auto-scoped)
            const insertChild = async () => {
                try {
                    const sid = schoolId;
                    if (!sid) { console.warn("addStudent: no school_id resolved"); return; }

                    const { data: childData } = await supabase.from("children").insert({
                        school_id: sid,
                        full_name: student.name,
                        roll_number: student.rollNo || null,
                        class: student.klass || null,
                        section: student.section || null,
                        assigned_bus_id: student.busId || null,
                    }).select("id").single();

                    // Authorize parent phone for registration
                    if (student.parentPhone && student.parentPhone !== "—") {
                        const phone = student.parentPhone.replace(/[^0-9+]/g, "");
                        const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
                        await supabase.from("authorized_contacts").upsert({
                            school_id: sid,
                            phone: formatted,
                            contact_type: "parent" as const,
                            child_id: childData?.id || null,
                            is_registered: false,
                        }, { onConflict: "school_id,phone,contact_type" });
                    }
                } catch (e) { console.warn("addStudent Supabase error:", e); }
            };
            insertChild();
        },
        updateStudent: (student) => {
            setStudents((current) => current.map((item) => item.id === student.id ? student : item));
            (async () => {
                try {
                    await supabase.from("children").update({
                        full_name: student.name,
                        class: student.klass || null,
                        section: student.section || null,
                        roll_number: student.rollNo || null,
                        assigned_bus_id: student.busId || null,
                        updated_at: new Date().toISOString(),
                    }).eq("id", student.id);
                } catch (e) { console.warn("updateStudent error:", e); }
            })();
        },
        removeStudent: (id) => {
            setStudents((current) => current.filter((student) => student.id !== id));
            // Soft-delete: set is_active = false instead of hard delete
            (async () => {
                try {
                    await supabase.from("children").update({
                        is_active: false,
                        updated_at: new Date().toISOString(),
                    }).eq("id", id);
                } catch (e) { console.warn("removeStudent error:", e); }
            })();
        },
        assignStudentToBus: (studentId, busId) => {
            setStudents((current) => current.map((student) => student.id === studentId ? { ...student, busId } : student));
            (async () => {
                try {
                    await supabase.from("children").update({
                        assigned_bus_id: busId,
                        updated_at: new Date().toISOString(),
                    }).eq("id", studentId);
                } catch (e) { console.warn("assignStudentToBus error:", e); }
            })();
        },
        addBus: (bus) => {
            setBuses((current) => [bus, ...current]);
            const insertBus = async () => {
                try {
                    const sid = schoolId;
                    if (!sid) { console.warn("addBus: no school_id resolved"); return; }
                    await supabase.from("buses").insert({
                        school_id: sid,
                        bus_number: bus.number,
                        route_name: bus.route || null,
                        capacity: bus.students || 32,
                        is_active: true,
                    });
                } catch (e) { console.warn("addBus Supabase error:", e); }
            };
            insertBus();
        },
        updateBus: (bus) => {
            setBuses((current) => current.map((item) => item.id === bus.id ? bus : item));
            (async () => {
                try {
                    await supabase.from("buses").update({
                        bus_number: bus.number,
                        route_name: bus.route || null,
                        capacity: bus.students || null,
                        updated_at: new Date().toISOString(),
                    }).eq("id", bus.id);
                } catch (e) { console.warn("updateBus error:", e); }
            })();
        },
        removeBus: (id) => {
            setBuses((current) => current.filter((bus) => bus.id !== id));
            setStudents((current) => current.map((student) => student.busId === id ? { ...student, busId: null } : student));
            // Soft-delete: set is_active = false
            (async () => {
                try {
                    await supabase.from("buses").update({
                        is_active: false,
                        updated_at: new Date().toISOString(),
                    }).eq("id", id);
                } catch (e) { console.warn("removeBus error:", e); }
            })();
        },
        addDriver: (driver) => {
            setDrivers((current) => [driver, ...current]);
            // Authorize driver phone for registration
            const authorizeDriver = async () => {
                try {
                    const sid = schoolId;
                    if (!sid || !driver.phone) return;
                    const phone = driver.phone.replace(/[^0-9+]/g, "");
                    const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
                    await supabase.from("authorized_contacts").upsert({
                        school_id: sid,
                        phone: formatted,
                        contact_type: "driver" as const,
                        is_registered: false,
                    }, { onConflict: "school_id,phone,contact_type" });
                } catch (e) { console.warn("addDriver authorize error:", e); }
            };
            authorizeDriver();
        },
        removeDriver: (id) => {
            setDrivers((current) => current.filter((driver) => driver.id !== id));
            // Soft-delete driver
            (async () => {
                try {
                    await supabase.from("drivers").update({
                        is_active: false,
                        updated_at: new Date().toISOString(),
                    }).eq("id", id);
                } catch (e) { console.warn("removeDriver error:", e); }
            })();
        },
        updateSchoolProfile: async (updates) => {
            try {
                if (!schoolId) return { success: false, error: "No school resolved" };
                const { updateSchoolProfile: updateApi } = await import("../../services/schoolService");
                const res = await updateApi(schoolId, {
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
