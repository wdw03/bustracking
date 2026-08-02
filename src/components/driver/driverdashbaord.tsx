/* ============================================================================
   DRIVER DASHBOARD — BusTracker (v2)
   Copy to: src/components/driver/driverdashbaord.tsx

   DEMO ACCOUNT (login page):
     Phone    : 9876543210
     Password : 1234
     Driver   : Rajesh Kumar (DRV001)

   TABS: Home · Schools · Bus · Profile   (Alerts/Route removed)

   VIDEOS USED (paths relative to src/components/driver/):
     HOME    : diverse-kids-getting-on-school-bus-animation-gif-download-10282491.mp4
     SCHOOLS : teacher-teaching-lesson-animation-gif-download-6098989.mp4
     BUS     : smart-bus-animation-gif-download-14231477.mp4
     PROFILE : male-user-profile-animation-gif-download-4106412.mp4
     AVATAR  : male-profile-animation-gif-download-10059464.mp4

   FLOW:
     Home    → total schools + total buses stats, school list (tap → detail)
     Schools → school list → tap school → FULL details + assigned buses at
               that school → per-school DEDICATED location Start/Stop
     Bus     → all assigned buses (number + driver name) → tap → full detail
               (school, bus number, driver, partner/helper, principal, ...)
     Profile → avatar video + menu (Personal / School / Bus / Settings)

   Press feedback: soft scale only (NO opacity blink, NO ripple flash).

   Wire navigation via props:
     <DriverDashboard
        onOpenPersonalDetails={() => navigation.navigate("PersonalDetail")}
        onOpenSchoolDetails={() => navigation.navigate("SchoolDetails")}
        onOpenBusDetails={() => navigation.navigate("BusDetails")}
        onOpenAccountSettings={() => navigation.navigate("AccountSettings")}
        onOpenNotificationSettings={() => navigation.navigate("NotificationSettings")}
        onLogout={() => navigation.replace("Login")}
     />
   ========================================================================== */

import React, { useCallback, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

/* ─────────────────────────── Theme ─────────────────────────── */
const ACCENT = "#FFD500";
const ACCENT_SOFT = "#FFF7CC";
const ACCENT_DEEP = "#B99700";
const ACCENT_LINE = "#F5E6A3";
const INK = "#111827";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER = "#E5E7EB";
const CARD_BG = "#FFFFFF";
const PAGE_BG = "#F8F9FB";
const GREEN = "#16A34A";
const GREEN_SOFT = "#DCFCE7";
const RED = "#DC2626";
const RED_SOFT = "#FEE2E2";
const BLUE = "#2563EB";
const BLUE_SOFT = "#DBEAFE";

const FONT = {
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    display: "Sora-Bold",
    displayHeavy: "Sora-ExtraBold",
};

const { width } = Dimensions.get("window");
const ms = (s: number) => Math.round((width / 390) * s);

/* ─────────────────────────── Media ─────────────────────────── */
const schoolBusIcon = require("../../../assets/expo.icon/Assets/3d-yellow-school-bus-vehicle-transport-icon-education-design-kids-passenger-transportation-school-elements-back-to-school-concept-3d-render-illustration-png.webp");
const AVATAR_VIDEO = require("../../../assets/expo.icon/Assets/male-profile-animation-gif-download-10059464.mp4");
const HOME_VIDEO = require("../../../assets/expo.icon/Assets/diverse-kids-getting-on-school-bus-animation-gif-download-10282491.mp4");
const SCHOOL_VIDEO = require("../../../assets/expo.icon/Assets/teacher-teaching-lesson-animation-gif-download-6098989.mp4");
const BUS_VIDEO = require("../../../assets/expo.icon/Assets/smart-bus-animation-gif-download-14231477.mp4");
const PROFILE_VIDEO = require("../../../assets/expo.icon/Assets/male-user-profile-animation-gif-download-4106412.mp4");

/* ─────────────────────────── Demo Data ─────────────────────────── */
const DRIVER = {
    name: "Rajesh Kumar",
    driverId: "DRV001",
    phone: "+91 98765 43210",
    license: "DL-0420110149646",
};

type Bus = {
    id: string;
    number: string;
    route: string;
    model: string;
    capacity: string;
    partner: string; // helper / conductor
    partnerPhone: string;
    pickupTime: string;
    stops: number;
};

type School = {
    id: string;
    name: string;
    code: string;
    address: string;
    principal: string;
    contact: string;
    email: string;
    shift: string;
    route: string;
    buses: Bus[];
};

const SCHOOLS: School[] = [
    {
        id: "s1",
        name: "Green Valley School",
        code: "GVS-2024-113",
        address: "Plot 7, Knowledge Park, Sector 62, Noida, UP 201301",
        principal: "Dr. Meena Sharma",
        contact: "+91 120 456 7890",
        email: "office@greenvalley.edu.in",
        shift: "Morning · 7:00 AM – 2:30 PM",
        route: "Route A",
        buses: [
            { id: "b1", number: "DL01AB1234", route: "Route A", model: "Tata Starbus 32-Seater", capacity: "32 seats", partner: "Suresh Yadav", partnerPhone: "+91 98111 22334", pickupTime: "7:10 AM", stops: 12 },
            { id: "b2", number: "DL01CD5678", route: "Route B (backup)", model: "Eicher Skyline Pro", capacity: "40 seats", partner: "Mohan Lal", partnerPhone: "+91 98222 33445", pickupTime: "7:25 AM", stops: 9 },
        ],
    },
    {
        id: "s2",
        name: "Sunrise Public School",
        code: "SPS-2024-078",
        address: "B-14, Vasundhara, Ghaziabad, UP 201012",
        principal: "Mr. Ashok Verma",
        contact: "+91 120 998 7766",
        email: "info@sunrisepublic.edu.in",
        shift: "Morning · 7:30 AM – 1:45 PM",
        route: "Route C",
        buses: [
            { id: "b3", number: "UP14EF9012", route: "Route C", model: "Ashok Leyland Sunshine", capacity: "36 seats", partner: "Ramesh Gupta", partnerPhone: "+91 97333 44556", pickupTime: "7:35 AM", stops: 10 },
        ],
    },
    {
        id: "s3",
        name: "Little Flowers Academy",
        code: "LFA-2024-201",
        address: "Sector 45, Gurugram, Haryana 122003",
        principal: "Mrs. Kavita Nair",
        contact: "+91 124 455 6677",
        email: "contact@littleflowers.edu.in",
        shift: "Morning · 8:00 AM – 2:00 PM",
        route: "Route D",
        buses: [
            { id: "b4", number: "HR26GH3456", route: "Route D", model: "Tata Starbus 28-Seater", capacity: "28 seats", partner: "Vinod Kumar", partnerPhone: "+91 96444 55667", pickupTime: "8:05 AM", stops: 8 },
        ],
    },
    {
        id: "s4",
        name: "St. Mary's Convent",
        code: "SMC-2024-054",
        address: "Civil Lines, Delhi 110054",
        principal: "Sr. Teresa D'Souza",
        contact: "+91 11 2345 6789",
        email: "office@stmarys.edu.in",
        shift: "Morning · 7:15 AM – 1:30 PM",
        route: "Route E",
        buses: [
            { id: "b5", number: "DL02IJ7890", route: "Route E", model: "Eicher Starline", capacity: "34 seats", partner: "Dinesh Rawat", partnerPhone: "+91 95555 66778", pickupTime: "7:20 AM", stops: 11 },
        ],
    },
    {
        id: "s5",
        name: "Blue Bells International",
        code: "BBI-2024-167",
        address: "Sector 10, Dwarka, Delhi 110075",
        principal: "Dr. Rajiv Malhotra",
        contact: "+91 11 4455 6677",
        email: "admin@bluebells.edu.in",
        shift: "Morning · 7:45 AM – 2:15 PM",
        route: "Route F",
        buses: [
            { id: "b6", number: "DL09KL2345", route: "Route F", model: "Force Traveller School", capacity: "26 seats", partner: "Sanjay Bisht", partnerPhone: "+91 94666 77889", pickupTime: "7:50 AM", stops: 7 },
        ],
    },
    {
        id: "s6",
        name: "Modern Era School",
        code: "MES-2024-092",
        address: "Raj Nagar Extension, Ghaziabad, UP 201017",
        principal: "Mrs. Anita Chauhan",
        contact: "+91 120 887 7665",
        email: "help@modernera.edu.in",
        shift: "Morning · 7:00 AM – 1:00 PM",
        route: "Route G",
        buses: [
            { id: "b7", number: "UP14MN6789", route: "Route G", model: "Tata Starbus 32-Seater", capacity: "32 seats", partner: "Prakash Joshi", partnerPhone: "+91 93777 88990", pickupTime: "7:05 AM", stops: 9 },
        ],
    },
];

const TOTAL_BUSES = SCHOOLS.reduce((n, s) => n + s.buses.length, 0);
const ALL_BUSES = SCHOOLS.flatMap((s) => s.buses.map((b) => ({ ...b, school: s })));

/* ─────────────────────────── Props ─────────────────────────── */
type Props = {
    onOpenPersonalDetails?: () => void;
    onOpenSchoolDetails?: () => void;
    onOpenBusDetails?: () => void;
    onOpenAccountSettings?: () => void;
    onOpenNotificationSettings?: () => void;
    onLogout?: () => void;
};

type Tab = "home" | "schools" | "bus" | "profile";

/* ─────────────────────────── Building blocks ─────────────────────────── */

/* Soft press — SCALE ONLY. No opacity change, no ripple => zero blink. */
function Press({
    onPress,
    children,
    style,
    label,
}: {
    onPress?: () => void;
    children: React.ReactNode;
    style?: any;
    label?: string;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    const animTo = (v: number) =>
        Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 5 }).start();
    return (
        <Pressable
            onPress={() => {
                Haptics.selectionAsync();
                onPress?.();
            }}
            onPressIn={() => animTo(0.97)}
            onPressOut={() => animTo(1)}
            android_ripple={null}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
        </Pressable>
    );
}

function IconChip({ name, bg, color, size = 17, box = 36, curved = true }: { name: any; bg: string; color: string; size?: number; box?: number; curved?: boolean }) {
    return (
        <View
            style={{
                width: ms(box),
                height: ms(box),
                borderRadius: ms(box) * 0.36,
                borderTopLeftRadius: curved ? ms(box) * 0.5 : undefined,
                backgroundColor: bg,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Ionicons name={name} size={ms(size)} color={color} />
        </View>
    );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
    return (
        <View
            style={[
                {
                    backgroundColor: CARD_BG,
                    borderRadius: 22,
                    borderTopLeftRadius: 26,
                    borderWidth: 1,
                    borderColor: BORDER,
                    padding: ms(16),
                    shadowColor: "#0F172A",
                    shadowOpacity: 0.05,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 2,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: ms(20), marginBottom: ms(10) }}>
            <View style={{ width: ms(4), height: ms(16), borderRadius: 3, backgroundColor: ACCENT, marginRight: 8 }} />
            <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: ms(15), color: INK }}>{children}</Text>
            {right}
        </View>
    );
}

function InfoRow({ icon, label, value, valueColor, last }: { icon: any; label: string; value: string; valueColor?: string; last?: boolean }) {
    return (
        <View style={{ flexDirection: "row", gap: 12, paddingVertical: ms(12), borderBottomWidth: last ? 0 : 1, borderBottomColor: "#F3F4F6" }}>
            <IconChip name={icon} bg={ACCENT_SOFT} color={ACCENT_DEEP} />
            <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: FAINT, letterSpacing: 0.4 }}>{label}</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(14), color: valueColor ?? INK, marginTop: 2, lineHeight: ms(19) }}>{value}</Text>
            </View>
        </View>
    );
}

/* Curved hero video card used on every tab */
function HeroVideo({ player, badge, height = 168 }: { player: any; badge: string; height?: number }) {
    return (
        <View
            style={{
                marginTop: ms(16),
                height: ms(height),
                borderRadius: 26,
                borderTopLeftRadius: ms(44),
                borderBottomRightRadius: ms(44),
                overflow: "hidden",
                borderWidth: 1.5,
                borderColor: ACCENT_LINE,
                backgroundColor: ACCENT_SOFT,
            }}
        >
            <VideoView player={player} style={{ width: "100%", height: "100%" }} contentFit="cover" nativeControls={false} allowsFullscreen={false} />
            <View
                style={{
                    position: "absolute",
                    bottom: ms(10),
                    left: ms(12),
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "rgba(17,24,39,0.78)",
                    borderRadius: 999,
                    paddingHorizontal: ms(12),
                    paddingVertical: ms(6),
                }}
            >
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT }} />
                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: "#FFFFFF" }}>{badge}</Text>
            </View>
        </View>
    );
}

/* Dedicated per-school location Start / Stop button */
function LocationSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <Press onPress={onToggle} label={on ? "Stop location sharing" : "Start location sharing"}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    height: ms(48),
                    borderRadius: 18,
                    borderTopLeftRadius: ms(24),
                    backgroundColor: on ? RED : GREEN,
                    shadowColor: on ? RED : GREEN,
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                }}
            >
                <View style={{ width: ms(28), height: ms(28), borderRadius: 14, backgroundColor: "#FFFFFF22", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={on ? "stop" : "navigate"} size={ms(14)} color="#FFFFFF" />
                </View>
                <Text style={{ fontFamily: FONT.display, fontSize: ms(14.5), color: "#FFFFFF" }}>
                    {on ? "Stop Location Sharing" : "Start Location Sharing"}
                </Text>
            </View>
        </Press>
    );
}

/* ─────────────────────────── Component ─────────────────────────── */

export default function DriverDashboard({
    onOpenPersonalDetails,
    onOpenSchoolDetails,
    onOpenBusDetails,
    onOpenAccountSettings,
    onOpenNotificationSettings,
    onLogout,
}: Props) {
    const insets = useSafeAreaInsets();

    const avatarPlayer = useVideoPlayer(AVATAR_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });
    const homePlayer = useVideoPlayer(HOME_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });
    const schoolPlayer = useVideoPlayer(SCHOOL_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });
    const busPlayer = useVideoPlayer(BUS_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });
    const profilePlayer = useVideoPlayer(PROFILE_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });

    const [tab, setTab] = useState<Tab>("home");
    const [online, setOnline] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [busSearchQuery, setBusSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    /* drill-down views inside tabs */
    const [openSchool, setOpenSchool] = useState<School | null>(null);
    const [openBus, setOpenBus] = useState<(Bus & { school: School }) | null>(null);
    /* DEDICATED per-school location sharing map: schoolId -> on/off */
    const [sharing, setSharing] = useState<Record<string, boolean>>({});

    const filteredSchools = SCHOOLS.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.route.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const filteredBuses = ALL_BUSES.filter(
        (b) =>
            b.number.toLowerCase().includes(busSearchQuery.toLowerCase()) ||
            b.school.name.toLowerCase().includes(busSearchQuery.toLowerCase()) ||
            b.model.toLowerCase().includes(busSearchQuery.toLowerCase()),
    );

    const toggleSharing = (schoolId: string) => {
        Haptics.notificationAsync(
            sharing[schoolId] ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success,
        );
        setSharing((s) => ({ ...s, [schoolId]: !s[schoolId] }));
    };

    const activeShares = Object.values(sharing).filter(Boolean).length;

    /* Tab switch fade — short & smooth */
    const tabAnim = useRef(new Animated.Value(1)).current;
    const animateTo = useCallback(
        (apply: () => void) => {
            Animated.timing(tabAnim, { toValue: 0, duration: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
                apply();
                Animated.timing(tabAnim, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
            });
        },
        [tabAnim],
    );

    const switchTab = useCallback(
        (next: Tab) => {
            if (next === tab) return;
            Haptics.selectionAsync();
            animateTo(() => {
                setTab(next);
                setOpenSchool(null);
                setOpenBus(null);
            });
        },
        [tab, animateTo],
    );

    /* helper: home se school card tap → schools tab + detail */
    const jumpToSchool = (s: School) =>
        animateTo(() => {
            setTab("schools");
            setOpenSchool(s);
            setOpenBus(null);
        });

    /* helper: school detail se bus tap → bus tab + detail */
    const jumpToBus = (b: Bus & { school: School }) =>
        animateTo(() => {
            setTab("bus");
            setOpenBus(b);
            setOpenSchool(null);
        });

    /* ══════════════════ HOME TAB ══════════════════ */
    const hideHero = isSearchFocused || searchQuery.length > 0;

    const renderHome = () => (
        <View style={{ flex: 1 }}>
            {/* STICKY TOP: Hero Video + Ultra-Compact Stats (Hides when search is active/keyboard open) */}
            {!hideHero && (
                <View style={{ paddingHorizontal: ms(20) }}>
                    <HeroVideo player={homePlayer} badge="Good morning, Rajesh — ready for today's trips?" height={125} />

                    {/* Ultra-compact stats cards */}
                    <View style={{ flexDirection: "row", gap: 6, marginTop: ms(8) }}>
                        <Card style={{ flex: 1, alignItems: "center", paddingVertical: ms(6), paddingHorizontal: ms(4) }}>
                            <IconChip name="school" bg={ACCENT_SOFT} color={ACCENT_DEEP} box={30} size={14} />
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(15), color: INK, marginTop: 2 }}>{SCHOOLS.length}</Text>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9.5), color: MUTED }}>Total Schools</Text>
                        </Card>
                        <Card style={{ flex: 1, alignItems: "center", paddingVertical: ms(6), paddingHorizontal: ms(4) }}>
                            <IconChip name="bus" bg={BLUE_SOFT} color={BLUE} box={30} size={14} />
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(15), color: INK, marginTop: 2 }}>{TOTAL_BUSES}</Text>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9.5), color: MUTED }}>Total Buses</Text>
                        </Card>
                        <Card style={{ flex: 1, alignItems: "center", paddingVertical: ms(6), paddingHorizontal: ms(4) }}>
                            <IconChip name="navigate" bg={GREEN_SOFT} color={GREEN} box={30} size={14} />
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(15), color: INK, marginTop: 2 }}>{activeShares}</Text>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9.5), color: MUTED }}>Live Sharing</Text>
                        </Card>
                    </View>
                </View>
            )}

            {/* ── Scrollable School List Box Container ── */}
            <View
                style={{
                    flex: 1,
                    marginTop: hideHero ? ms(4) : ms(8),
                    marginHorizontal: ms(20),
                    marginBottom: insets.bottom + ms(80),
                    backgroundColor: "#FFFFFF",
                    borderRadius: 24,
                    borderTopLeftRadius: ms(34),
                    borderBottomRightRadius: ms(34),
                    borderWidth: 1.5,
                    borderColor: ACCENT_LINE,
                    padding: ms(12),
                    shadowColor: "#0F172A",
                    shadowOpacity: 0.06,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 3,
                }}
            >
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: ms(8) }}>
                    <View style={{ width: ms(4), height: ms(14), borderRadius: 3, backgroundColor: ACCENT, marginRight: 8 }} />
                    <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: ms(14.5), color: INK }}>Assigned Schools</Text>
                    <View style={{ backgroundColor: ACCENT_SOFT, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: ACCENT_LINE }}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10), color: ACCENT_DEEP }}>{filteredSchools.length} ASSIGNED</Text>
                    </View>
                </View>

                {/* Search Bar inside Box */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor: PAGE_BG,
                        borderRadius: 14,
                        paddingHorizontal: ms(10),
                        paddingVertical: ms(6),
                        marginBottom: ms(8),
                        borderWidth: 1,
                        borderColor: isSearchFocused ? ACCENT_DEEP : BORDER,
                    }}
                >
                    <Ionicons name="search-outline" size={ms(15)} color={isSearchFocused ? ACCENT_DEEP : FAINT} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        placeholder="Search school name or code..."
                        placeholderTextColor={FAINT}
                        style={{
                            flex: 1,
                            fontFamily: FONT.regular,
                            fontSize: ms(12),
                            color: INK,
                            padding: 0,
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={ms(15)} color={FAINT} />
                        </Pressable>
                    )}
                </View>

                {/* Scrollable School List */}
                <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: ms(8) }}
                >
                    {filteredSchools.length === 0 ? (
                        <View style={{ paddingVertical: ms(20), alignItems: "center" }}>
                            <Ionicons name="school-outline" size={ms(26)} color={FAINT} />
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 4 }}>
                                No schools match "{searchQuery}"
                            </Text>
                        </View>
                    ) : (
                        filteredSchools.map((s) => (
                            <Press key={s.id} onPress={() => jumpToSchool(s)} label={`Open ${s.name}`}>
                                <View
                                    style={{
                                        marginBottom: ms(8),
                                        padding: ms(10),
                                        backgroundColor: PAGE_BG,
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: BORDER,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <IconChip name="school-outline" bg={ACCENT_SOFT} color={ACCENT_DEEP} box={34} size={16} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }} numberOfLines={1}>
                                            {s.name}
                                        </Text>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                                            <Ionicons name="bus-outline" size={ms(10)} color={MUTED} />
                                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }} numberOfLines={1}>
                                                {s.buses.map((b) => b.number).join(" · ")}
                                            </Text>
                                        </View>
                                    </View>
                                    {sharing[s.id] && (
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
                                            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: GREEN }} />
                                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9), color: GREEN }}>LIVE</Text>
                                        </View>
                                    )}
                                    <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />
                                </View>
                            </Press>
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );

    /* ══════════════════ SCHOOLS TAB ══════════════════ */
    const renderSchools = () => {
        if (openSchool) return renderSchoolDetail(openSchool);
        const hideSchoolHero = isSearchFocused || searchQuery.length > 0;

        return (
            <View style={{ flex: 1 }}>
                {!hideSchoolHero && (
                    <View style={{ paddingHorizontal: ms(20) }}>
                        <HeroVideo player={schoolPlayer} badge={`Assigned to ${SCHOOLS.length} schools`} height={125} />
                    </View>
                )}

                <View
                    style={{
                        flex: 1,
                        marginTop: hideSchoolHero ? ms(4) : ms(8),
                        marginHorizontal: ms(20),
                        marginBottom: insets.bottom + ms(80),
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderTopLeftRadius: ms(34),
                        borderBottomRightRadius: ms(34),
                        borderWidth: 1.5,
                        borderColor: ACCENT_LINE,
                        padding: ms(12),
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.06,
                        shadowRadius: 14,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 3,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: ms(8) }}>
                        <View style={{ width: ms(4), height: ms(14), borderRadius: 3, backgroundColor: ACCENT, marginRight: 8 }} />
                        <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: ms(14.5), color: INK }}>Assigned Schools</Text>
                        <View style={{ backgroundColor: ACCENT_SOFT, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: ACCENT_LINE }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10), color: ACCENT_DEEP }}>{filteredSchools.length} SCHOOLS</Text>
                        </View>
                    </View>

                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            backgroundColor: PAGE_BG,
                            borderRadius: 14,
                            paddingHorizontal: ms(10),
                            paddingVertical: ms(6),
                            marginBottom: ms(8),
                            borderWidth: 1,
                            borderColor: isSearchFocused ? ACCENT_DEEP : BORDER,
                        }}
                    >
                        <Ionicons name="search-outline" size={ms(15)} color={isSearchFocused ? ACCENT_DEEP : FAINT} />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            placeholder="Search school name or code..."
                            placeholderTextColor={FAINT}
                            style={{
                                flex: 1,
                                fontFamily: FONT.regular,
                                fontSize: ms(12),
                                color: INK,
                                padding: 0,
                            }}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={ms(15)} color={FAINT} />
                            </Pressable>
                        )}
                    </View>

                    <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: ms(8) }}
                    >
                        {filteredSchools.length === 0 ? (
                            <View style={{ paddingVertical: ms(20), alignItems: "center" }}>
                                <Ionicons name="school-outline" size={ms(26)} color={FAINT} />
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 4 }}>
                                    No schools match "{searchQuery}"
                                </Text>
                            </View>
                        ) : (
                            filteredSchools.map((s) => (
                                <Press key={s.id} onPress={() => setOpenSchool(s)} label={`Open ${s.name} details`}>
                                    <View
                                        style={{
                                            marginBottom: ms(8),
                                            padding: ms(10),
                                            backgroundColor: PAGE_BG,
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: BORDER,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <IconChip name="school" bg={ACCENT_SOFT} color={ACCENT_DEEP} box={36} size={16} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }} numberOfLines={1}>
                                                {s.name}
                                            </Text>
                                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED, marginTop: 2 }} numberOfLines={1}>
                                                {s.route} · {s.buses.length} {s.buses.length > 1 ? "buses" : "bus"} assigned
                                            </Text>
                                        </View>
                                        {sharing[s.id] && (
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
                                                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: GREEN }} />
                                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9), color: GREEN }}>LIVE</Text>
                                            </View>
                                        )}
                                        <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />
                                    </View>
                                </Press>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        );
    };

    /* School detail — full info + buses at this school + DEDICATED start/stop */
    const renderSchoolDetail = (s: School) => (
        <>
            <Press onPress={() => setOpenSchool(null)} label="Back to schools">
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: ms(14), alignSelf: "flex-start", backgroundColor: CARD_BG, borderRadius: 999, paddingHorizontal: ms(13), paddingVertical: ms(8), borderWidth: 1, borderColor: BORDER }}>
                    <Ionicons name="arrow-back" size={ms(14)} color={INK} />
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>All Schools</Text>
                </View>
            </Press>

            <HeroVideo player={schoolPlayer} badge={s.shift} height={150} />

            <View style={{ alignItems: "center", marginTop: ms(14) }}>
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK, textAlign: "center" }}>{s.name}</Text>
                <View style={{ backgroundColor: CARD_BG, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6, borderWidth: 1, borderColor: BORDER }}>
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: MUTED }}>Code: {s.code}</Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: ms(12), justifyContent: "center" }}>
                <Press onPress={() => Linking.openURL(`tel:${s.contact.replace(/\s/g, "")}`)} label="Call school">
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: ms(15), paddingVertical: ms(9) }}>
                        <Ionicons name="call" size={ms(13)} color={GREEN} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: GREEN }}>Call</Text>
                    </View>
                </Press>
                <Press onPress={() => Linking.openURL(`mailto:${s.email}`)} label="Email school">
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BLUE_SOFT, borderRadius: 999, paddingHorizontal: ms(15), paddingVertical: ms(9) }}>
                        <Ionicons name="mail" size={ms(13)} color={BLUE} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: BLUE }}>Email</Text>
                    </View>
                </Press>
            </View>

            {/* DEDICATED location sharing for THIS school */}
            <SectionTitle>Location Sharing — {s.route}</SectionTitle>
            <Card>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: ms(12) }}>
                    <IconChip name="location" bg={sharing[s.id] ? GREEN_SOFT : PAGE_BG} color={sharing[s.id] ? GREEN : FAINT} box={42} size={19} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>
                            {sharing[s.id] ? "Sharing live with parents & school" : "Location sharing is off"}
                        </Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 2 }}>
                            Dedicated to {s.name} only
                        </Text>
                    </View>
                </View>
                <LocationSwitch on={!!sharing[s.id]} onToggle={() => toggleSharing(s.id)} />
            </Card>

            {/* Buses assigned at this school */}
            <SectionTitle
                right={
                    <View style={{ backgroundColor: BLUE_SOFT, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: BLUE }}>{s.buses.length} {s.buses.length > 1 ? "BUSES" : "BUS"}</Text>
                    </View>
                }
            >
                My Buses Here
            </SectionTitle>
            {s.buses.map((b) => (
                <Press key={b.id} onPress={() => jumpToBus({ ...b, school: s })} label={`Open bus ${b.number}`}>
                    <Card style={{ marginBottom: ms(10), padding: ms(13) }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), borderTopLeftRadius: ms(21), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: ACCENT_LINE }}>
                                <Image source={schoolBusIcon} style={{ width: "88%", height: "88%" }} resizeMode="contain" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color: INK, letterSpacing: 0.4 }}>{b.number}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 2 }}>
                                    {b.route} · {b.stops} stops · {b.pickupTime}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={ms(16)} color={FAINT} />
                        </View>
                    </Card>
                </Press>
            ))}

            <SectionTitle>School Details</SectionTitle>
            <View style={{ backgroundColor: CARD_BG, borderRadius: 22, borderTopLeftRadius: 26, borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(16), paddingVertical: ms(4) }}>
                <InfoRow icon="location-outline" label="ADDRESS" value={s.address} />
                <InfoRow icon="person-outline" label="PRINCIPAL" value={s.principal} />
                <InfoRow icon="call-outline" label="CONTACT" value={s.contact} />
                <InfoRow icon="mail-outline" label="EMAIL" value={s.email} />
                <InfoRow icon="time-outline" label="SHIFT" value={s.shift} last />
            </View>
        </>
    );

    /* ══════════════════ BUS TAB ══════════════════ */
    const renderBus = () => {
        if (openBus) return renderBusDetail(openBus);
        const hideBusHero = isSearchFocused || busSearchQuery.length > 0;

        return (
            <View style={{ flex: 1 }}>
                {!hideBusHero && (
                    <View style={{ paddingHorizontal: ms(20) }}>
                        <HeroVideo player={busPlayer} badge={`${TOTAL_BUSES} buses assigned to you`} height={125} />
                    </View>
                )}

                <View
                    style={{
                        flex: 1,
                        marginTop: hideBusHero ? ms(4) : ms(8),
                        marginHorizontal: ms(20),
                        marginBottom: insets.bottom + ms(80),
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderTopLeftRadius: ms(34),
                        borderBottomRightRadius: ms(34),
                        borderWidth: 1.5,
                        borderColor: ACCENT_LINE,
                        padding: ms(12),
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.06,
                        shadowRadius: 14,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 3,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: ms(8) }}>
                        <View style={{ width: ms(4), height: ms(14), borderRadius: 3, backgroundColor: ACCENT, marginRight: 8 }} />
                        <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: ms(14.5), color: INK }}>My Buses</Text>
                        <View style={{ backgroundColor: ACCENT_SOFT, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: ACCENT_LINE }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10), color: ACCENT_DEEP }}>{filteredBuses.length} BUSES</Text>
                        </View>
                    </View>

                    {/* Search Bar for Buses */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            backgroundColor: PAGE_BG,
                            borderRadius: 14,
                            paddingHorizontal: ms(10),
                            paddingVertical: ms(6),
                            marginBottom: ms(8),
                            borderWidth: 1,
                            borderColor: isSearchFocused ? ACCENT_DEEP : BORDER,
                        }}
                    >
                        <Ionicons name="search-outline" size={ms(15)} color={isSearchFocused ? ACCENT_DEEP : FAINT} />
                        <TextInput
                            value={busSearchQuery}
                            onChangeText={setBusSearchQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            placeholder="Search bus number, driver or model..."
                            placeholderTextColor={FAINT}
                            style={{
                                flex: 1,
                                fontFamily: FONT.regular,
                                fontSize: ms(12),
                                color: INK,
                                padding: 0,
                            }}
                        />
                        {busSearchQuery.length > 0 && (
                            <Pressable onPress={() => setBusSearchQuery("")}>
                                <Ionicons name="close-circle" size={ms(15)} color={FAINT} />
                            </Pressable>
                        )}
                    </View>

                    <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: ms(8) }}
                    >
                        {filteredBuses.length === 0 ? (
                            <View style={{ paddingVertical: ms(20), alignItems: "center" }}>
                                <Ionicons name="bus-outline" size={ms(26)} color={FAINT} />
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 4 }}>
                                    No buses match "{busSearchQuery}"
                                </Text>
                            </View>
                        ) : (
                            filteredBuses.map((b) => (
                                <Press key={b.id} onPress={() => setOpenBus(b)} label={`Open bus ${b.number} details`}>
                                    <View
                                        style={{
                                            marginBottom: ms(8),
                                            padding: ms(10),
                                            backgroundColor: PAGE_BG,
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: BORDER,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <View style={{ width: ms(40), height: ms(40), borderRadius: ms(14), borderTopLeftRadius: ms(18), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: ACCENT_LINE }}>
                                            <Image source={schoolBusIcon} style={{ width: "88%", height: "88%" }} resizeMode="contain" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK, letterSpacing: 0.4 }}>{b.number}</Text>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                                                <Ionicons name="person-outline" size={ms(10)} color={MUTED} />
                                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }}>Driver: {DRIVER.name}</Text>
                                            </View>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
                                                <Ionicons name="school-outline" size={ms(10)} color={MUTED} />
                                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }} numberOfLines={1}>{b.school.name}</Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />
                                    </View>
                                </Press>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        );
    };

    /* Bus detail — school first, then driver, partner, principal & bus info */
    const renderBusDetail = (b: Bus & { school: School }) => (
        <>
            <Press onPress={() => setOpenBus(null)} label="Back to buses">
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: ms(14), alignSelf: "flex-start", backgroundColor: CARD_BG, borderRadius: 999, paddingHorizontal: ms(13), paddingVertical: ms(8), borderWidth: 1, borderColor: BORDER }}>
                    <Ionicons name="arrow-back" size={ms(14)} color={INK} />
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>All Buses</Text>
                </View>
            </Press>

            <HeroVideo player={busPlayer} badge={`${b.route} · ${b.pickupTime} pickup`} height={150} />

            <View style={{ alignItems: "center", marginTop: ms(14) }}>
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(21), color: INK, letterSpacing: 1 }}>{b.number}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <View style={{ backgroundColor: ACCENT_SOFT, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: ACCENT_LINE }}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: ACCENT_DEEP }}>{b.route}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: sharing[b.school.id] ? GREEN_SOFT : PAGE_BG, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: sharing[b.school.id] ? GREEN_SOFT : BORDER }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sharing[b.school.id] ? GREEN : FAINT }} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: sharing[b.school.id] ? GREEN : FAINT }}>
                            {sharing[b.school.id] ? "GPS Live" : "GPS Off"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* ── Live Speedometer & Telemetry Dashboard Widget ── */}
            <View
                style={{
                    marginTop: ms(16),
                    backgroundColor: "#FFFFFF",
                    borderRadius: 24,
                    borderTopLeftRadius: ms(30),
                    borderBottomRightRadius: ms(30),
                    borderWidth: 1.5,
                    borderColor: ACCENT_LINE,
                    padding: ms(14),
                    shadowColor: "#0F172A",
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 3,
                }}
            >
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: ms(12) }}>
                    <View style={{ width: ms(4), height: ms(16), borderRadius: 3, backgroundColor: ACCENT, marginRight: 8 }} />
                    <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: ms(14), color: INK }}>Live Telemetry Dashboard</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10), color: GREEN }}>LIVE SENSORS</Text>
                    </View>
                </View>

                {/* Speedometer & GPS Grid */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                    {/* Speedometer Card */}
                    <View style={{ flex: 1, backgroundColor: PAGE_BG, borderRadius: 18, padding: ms(12), borderWidth: 1, borderColor: BORDER, alignItems: "center" }}>
                        <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="speedometer" size={ms(20)} color={ACCENT_DEEP} />
                        </View>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(20), color: INK, marginTop: ms(6) }}>42 <Text style={{ fontSize: ms(11), fontFamily: FONT.semibold, color: MUTED }}>km/h</Text></Text>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: MUTED, marginTop: 2 }}>Current Speed ⚡</Text>
                        <View style={{ backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 6 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9.5), color: GREEN }}>Safe Speed 🟢</Text>
                        </View>
                    </View>

                    {/* GPS Accuracy Card */}
                    <View style={{ flex: 1, backgroundColor: PAGE_BG, borderRadius: 18, padding: ms(12), borderWidth: 1, borderColor: BORDER, alignItems: "center" }}>
                        <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="location" size={ms(18)} color={GREEN} />
                        </View>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(17), color: INK, marginTop: ms(6) }}>High <Text style={{ fontSize: ms(10.5), fontFamily: FONT.regular, color: MUTED }}>(2m)</Text></Text>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: MUTED, marginTop: 2 }}>GPS Signal 📍</Text>
                        <View style={{ backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 6 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9.5), color: GREEN }}>Strong 📡</Text>
                        </View>
                    </View>
                </View>
            </View>

            <SectionTitle>School & Team</SectionTitle>
            <View style={{ backgroundColor: CARD_BG, borderRadius: 22, borderTopLeftRadius: 26, borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(16), paddingVertical: ms(4) }}>
                <InfoRow icon="school-outline" label="SCHOOL NAME" value={b.school.name} />
                <InfoRow icon="bus-outline" label="BUS NUMBER" value={b.number} />
                <InfoRow icon="person-outline" label="DRIVER" value={`${DRIVER.name} (${DRIVER.driverId})`} />
                <InfoRow icon="call-outline" label="DRIVER NUMBER" value={DRIVER.phone} />
                <InfoRow icon="person-add-outline" label="PARTNER / HELPER" value={b.partner} />
                <InfoRow icon="call-outline" label="PARTNER NUMBER" value={b.partnerPhone} />
                <InfoRow icon="ribbon-outline" label="PRINCIPAL" value={b.school.principal} last />
            </View>

            <SectionTitle>Bus Information</SectionTitle>
            <View style={{ backgroundColor: CARD_BG, borderRadius: 22, borderTopLeftRadius: 26, borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(16), paddingVertical: ms(4) }}>
                <InfoRow icon="construct-outline" label="MODEL" value={b.model} />
                <InfoRow icon="people-outline" label="CAPACITY" value={b.capacity} />
                <InfoRow icon="flag-outline" label="STOPS" value={`${b.stops} stops`} />
                <InfoRow icon="time-outline" label="PICKUP TIME" value={b.pickupTime} />
                <InfoRow icon="location-outline" label="SCHOOL ADDRESS" value={b.school.address} last />
            </View>

            <View style={{ marginTop: ms(16) }}>
                <LocationSwitch on={!!sharing[b.school.id]} onToggle={() => toggleSharing(b.school.id)} />
            </View>
        </>
    );

    /* ══════════════════ PROFILE TAB ══════════════════ */
    const profileMenu = [
        { icon: "person-outline", chipBg: ACCENT_SOFT, chipColor: ACCENT_DEEP, title: "Personal Details", desc: "Name, phone, license & address", onPress: onOpenPersonalDetails },
        { icon: "school-outline", chipBg: BLUE_SOFT, chipColor: BLUE, title: "School Details", desc: "Your assigned schools' info", onPress: onOpenSchoolDetails },
        { icon: "bus-outline", chipBg: GREEN_SOFT, chipColor: GREEN, title: "Bus Details", desc: "Vehicle, documents & GPS device", onPress: onOpenBusDetails },
        { icon: "settings-outline", chipBg: "#EEF2FF", chipColor: "#4F46E5", title: "Account Settings", desc: "Password, permissions & more", onPress: onOpenAccountSettings },
        { icon: "notifications-outline", chipBg: "#FEF3C7", chipColor: "#D97706", title: "Notification Settings", desc: "Alerts, sounds & reminders", onPress: onOpenNotificationSettings },
    ];

    const renderProfile = () => (
        <>
            {/* compact video profile card */}
            <Card style={{ marginTop: ms(16), alignItems: "center", paddingVertical: ms(20) }}>
                <View
                    style={{
                        width: ms(92),
                        height: ms(92),
                        borderRadius: ms(30),
                        borderTopLeftRadius: ms(40),
                        overflow: "hidden",
                        borderWidth: 3,
                        borderColor: ACCENT,
                        backgroundColor: ACCENT_SOFT,
                    }}
                >
                    <VideoView player={profilePlayer} style={{ width: "100%", height: "100%" }} contentFit="cover" nativeControls={false} allowsFullscreen={false} />
                </View>
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: INK, marginTop: ms(10) }}>{DRIVER.name}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                    <View style={{ backgroundColor: ACCENT_SOFT, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: ACCENT_LINE }}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: ACCENT_DEEP }}>Driver · {DRIVER.driverId}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: online ? GREEN_SOFT : PAGE_BG, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: online ? GREEN : FAINT }} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: online ? GREEN : FAINT }}>{online ? "Online" : "Offline"}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }}>
                    <Ionicons name="card-outline" size={ms(12)} color={MUTED} />
                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED }}>{DRIVER.license}</Text>
                </View>
            </Card>

            {/* menu with proper arrow chips */}
            <SectionTitle>Account</SectionTitle>
            <View style={{ backgroundColor: CARD_BG, borderRadius: 22, borderTopLeftRadius: 26, borderWidth: 1, borderColor: BORDER, padding: ms(6) }}>
                {profileMenu.map((m, i) => (
                    <Press key={m.title} onPress={m.onPress} label={m.title}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 12,
                                paddingVertical: ms(13),
                                paddingHorizontal: ms(10),
                                borderBottomWidth: i < profileMenu.length - 1 ? 1 : 0,
                                borderBottomColor: "#F3F4F6",
                            }}
                        >
                            <IconChip name={m.icon} bg={m.chipBg} color={m.chipColor} box={40} size={18} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color: INK }}>{m.title}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 1 }}>{m.desc}</Text>
                            </View>
                            <View style={{ width: ms(28), height: ms(28), borderRadius: ms(10), backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER }}>
                                <Ionicons name="chevron-forward" size={ms(14)} color={INK} />
                            </View>
                        </View>
                    </Press>
                ))}
            </View>

            <View style={{ marginTop: ms(16) }}>
                <Press onPress={onLogout} label="Logout">
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: ms(52), borderRadius: 18, borderTopLeftRadius: ms(24), backgroundColor: RED_SOFT, borderWidth: 1.5, borderColor: "#FECACA" }}>
                        <Ionicons name="log-out-outline" size={ms(17)} color={RED} />
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(14.5), color: RED }}>Logout</Text>
                    </View>
                </Press>
            </View>

            <Text style={{ textAlign: "center", fontFamily: FONT.regular, fontSize: ms(11), color: FAINT, marginTop: ms(16) }}>
                BusTracker · Version 1.0.0
            </Text>
        </>
    );

    /* ══════════════════ Render ══════════════════ */
    const TABS: { key: Tab; icon: any; iconActive: any; label: string }[] = [
        { key: "home", icon: "home-outline", iconActive: "home", label: "Home" },
        { key: "schools", icon: "school-outline", iconActive: "school", label: "Schools" },
        { key: "bus", icon: "bus-outline", iconActive: "bus", label: "Bus" },
        { key: "profile", icon: "person-outline", iconActive: "person", label: "Profile" },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            {/* curved yellow header backdrop */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -ms(110),
                    left: -ms(40),
                    right: -ms(40),
                    height: ms(195) + insets.top,
                    backgroundColor: ACCENT,
                    borderBottomLeftRadius: ms(95),
                    borderBottomRightRadius: ms(95),
                }}
            />

            {/* header */}
            <View style={{ paddingTop: insets.top + ms(8), paddingHorizontal: ms(18), flexDirection: "row", alignItems: "center", gap: 9 }}>
                <View
                    style={{
                        width: ms(38),
                        height: ms(38),
                        borderRadius: ms(14),
                        borderTopLeftRadius: ms(18),
                        overflow: "hidden",
                        borderWidth: 1.5,
                        borderColor: "#FFFFFF",
                        backgroundColor: ACCENT_SOFT,
                    }}
                >
                    <VideoView player={avatarPlayer} style={{ width: "100%", height: "100%" }} contentFit="cover" nativeControls={false} allowsFullscreen={false} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(14.5), color: INK }} numberOfLines={1}>{DRIVER.name}</Text>
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: "#00000088" }}>ID: {DRIVER.driverId}</Text>
                </View>
                <Press onPress={() => setOnline((o) => !o)} label={online ? "Go offline" : "Go online"}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFFFFF", borderRadius: 999, paddingHorizontal: ms(8), paddingVertical: ms(5) }}>
                        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: online ? GREEN : FAINT }} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: INK }}>{online ? "Online" : "Offline"}</Text>
                    </View>
                </Press>
                <Press onPress={onOpenNotificationSettings} label="Notifications">
                    <View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="notifications-outline" size={ms(15)} color={INK} />
                        <View style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, borderRadius: 3.5, backgroundColor: RED, borderWidth: 1.5, borderColor: "#FFFFFF" }} />
                    </View>
                </Press>
            </View>

            {/* content */}
            <Animated.View style={{ flex: 1, opacity: tabAnim }}>
                {tab === "home" && renderHome()}
                {tab === "schools" &&
                    (openSchool ? (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: insets.bottom + ms(130) }}>
                            {renderSchools()}
                        </ScrollView>
                    ) : (
                        renderSchools()
                    ))}
                {tab === "bus" &&
                    (openBus ? (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: insets.bottom + ms(130) }}>
                            {renderBus()}
                        </ScrollView>
                    ) : (
                        renderBus()
                    ))}
                {tab === "profile" && (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: insets.bottom + ms(130) }}>
                        {renderProfile()}
                    </ScrollView>
                )}
            </Animated.View>

            {/* floating curved bottom nav */}
            <View
                style={{
                    position: "absolute",
                    left: ms(16),
                    right: ms(16),
                    bottom: insets.bottom + ms(10),
                    flexDirection: "row",
                    backgroundColor: INK,
                    borderRadius: 26,
                    borderTopLeftRadius: ms(32),
                    borderBottomRightRadius: ms(32),
                    padding: ms(7),
                    borderWidth: 1.5,
                    borderColor: ACCENT_LINE,
                    shadowColor: "#000",
                    shadowOpacity: 0.22,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 10,
                }}
            >
                {TABS.map((t) => {
                    const active = tab === t.key;
                    return (
                        <Pressable
                            key={t.key}
                            onPress={() => switchTab(t.key)}
                            android_ripple={null}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: active }}
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 5,
                                height: ms(46),
                                borderRadius: 20,
                                backgroundColor: active ? ACCENT : "transparent",
                            }}
                        >
                            <Ionicons name={active ? t.iconActive : t.icon} size={ms(18)} color={active ? INK : "#9CA3AF"} />
                            {active && (
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: INK }}>{t.label}</Text>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
