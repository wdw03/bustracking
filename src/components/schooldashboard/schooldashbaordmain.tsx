/* ============================================================================
   SCHOOL ADMIN DASHBOARD — MAIN SHELL + HOME
   Copy to: src/components/schooldashboard/schooldashbaordmain.tsx

   SCHOOL ADMIN LOGIN: 9876543210 / 1234
   ========================================================================== */

import React, { useMemo, useState, useEffect, useRef } from "react";
import { ScrollView, Text, View, Pressable, Animated, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import {
    BUSES, Card, Chip, DRIVERS, FONT,
    PARENTS, Press, RECENT_ACTIVITY,
    SCHOOL, STUDENTS, SectionTitle, StatCard, SkeletonItem, busStatusColor, driverForBus, ms, SchoolDataProvider, useSchoolData, SettingsProvider, useTheme,
} from "./common";

import BusManagementPage from "./pages/busmanagement";
import DriverManagementPage from "./pages/drivermanagement";
import StudentManagementPage from "./pages/studentmanagement";
import ParentManagementPage from "./pages/parentmanagement";
import BusAssignmentPage from "./pages/busassignment";
import LiveTrackingPage from "./pages/livetracking";
import SubscriptionPage from "./pages/subscription";
import NotificationCenterPage from "./pages/notificationcenter";
import ReportsPage from "./pages/reports";
import ContactCenterPage from "./pages/contactcenter";
import SettingsPage from "./pages/settings";

/* PLACEHOLDER — replace with your school logo image if you have one */
const SCHOOL_VIDEO = require("../../../assets/expo.icon/Assets/school-animation-gif-download-7813556.mp4");

type PageKey =
    | "home" | "buses" | "drivers" | "students" | "parents" | "assignment"
    | "live" | "subscription" | "notifications" | "reports" | "contact" | "settings";

type Tab = "home" | "live" | "manage" | "settings";

export default function SchoolDashboardMain({ onLogout }: { onLogout?: () => void }) {
    return <SettingsProvider><SchoolDataProvider><SchoolDashboardContent onLogout={onLogout} /></SchoolDataProvider></SettingsProvider>;
}

function SchoolDashboardContent({ onLogout }: { onLogout?: () => void }) {
    const { isDark, INK, PAGE_BG, CARD_BG, BORDER, ACCENT, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, RED, RED_SOFT, ORANGE, ORANGE_SOFT, BLUE, BLUE_SOFT, PURPLE, PURPLE_SOFT, MUTED, FAINT } = useTheme();
    const insets = useSafeAreaInsets();
    const [history, setHistory] = useState<PageKey[]>(["home"]);
    const page = history[history.length - 1];
    const [tab, setTab] = useState<Tab>("home");
    const { buses, drivers, students, parents, isLoading } = useSchoolData();
    const [focusedBusId, setFocusedBusId] = useState<string | null>(null);

    const player = useVideoPlayer(SCHOOL_VIDEO, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    const stats = useMemo(() => {
        const running = buses.filter((b) => b.status === "Running").length;
        const offline = buses.filter((b) => b.status !== "Running").length;
        const gpsOn = buses.filter((b) => b.gps === "Online").length;
        return { running, offline, gpsOn };
    }, [buses]);

    const go = (p: PageKey, t?: Tab, busId: string | null = null) => {
        if (t) {
            setHistory(p === "home" ? ["home"] : ["home", p]);
            setTab(t);
        } else {
            setHistory((prev) => {
                if (prev[prev.length - 1] === p) return prev;
                return [...prev, p];
            });
        }
        setFocusedBusId(busId);
    };

    const goBack = () => {
        setHistory((prev) => {
            if (prev.length <= 1) return prev;
            const newHistory = [...prev];
            newHistory.pop();
            const newPage = newHistory[newHistory.length - 1];
            if (newPage === "home") setTab("home");
            else if (newPage === "live") setTab("live");
            else if (newPage === "settings") setTab("settings");
            else if (["buses", "drivers", "students", "parents", "assignment", "subscription", "notifications", "reports", "contact"].includes(newPage)) setTab("manage");
            return newHistory;
        });
        setFocusedBusId(null);
    };

    useEffect(() => {
        const onHardwareBack = () => {
            if (history.length > 1) {
                goBack();
                return true;
            }
            return false;
        };
        const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
        return () => sub.remove();
    }, [history]);

    // --- ANIMATIONS ---
    const fadeAnim1 = useRef(new Animated.Value(0)).current;
    const fadeAnim2 = useRef(new Animated.Value(0)).current;
    const fadeAnim3 = useRef(new Animated.Value(0)).current;
    const fadeAnim4 = useRef(new Animated.Value(0)).current;
    const fadeAnim5 = useRef(new Animated.Value(0)).current;
    const translateY1 = useRef(new Animated.Value(20)).current;
    const translateY2 = useRef(new Animated.Value(20)).current;
    const translateY3 = useRef(new Animated.Value(20)).current;
    const translateY4 = useRef(new Animated.Value(20)).current;
    const translateY5 = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (page === "home") {
            fadeAnim1.setValue(0);
            fadeAnim2.setValue(0);
            fadeAnim3.setValue(0);
            fadeAnim4.setValue(0);
            fadeAnim5.setValue(0);
            translateY1.setValue(20);
            translateY2.setValue(20);
            translateY3.setValue(20);
            translateY4.setValue(20);
            translateY5.setValue(20);

            Animated.stagger(120, [
                Animated.parallel([
                    Animated.timing(fadeAnim1, { toValue: 1, duration: 450, useNativeDriver: true }),
                    Animated.timing(translateY1, { toValue: 0, duration: 450, useNativeDriver: true })
                ]),
                Animated.parallel([
                    Animated.timing(fadeAnim2, { toValue: 1, duration: 450, useNativeDriver: true }),
                    Animated.timing(translateY2, { toValue: 0, duration: 450, useNativeDriver: true })
                ]),
                Animated.parallel([
                    Animated.timing(fadeAnim3, { toValue: 1, duration: 450, useNativeDriver: true }),
                    Animated.timing(translateY3, { toValue: 0, duration: 450, useNativeDriver: true })
                ]),
                Animated.parallel([
                    Animated.timing(fadeAnim4, { toValue: 1, duration: 450, useNativeDriver: true }),
                    Animated.timing(translateY4, { toValue: 0, duration: 450, useNativeDriver: true })
                ]),
                Animated.parallel([
                    Animated.timing(fadeAnim5, { toValue: 1, duration: 450, useNativeDriver: true }),
                    Animated.timing(translateY5, { toValue: 0, duration: 450, useNativeDriver: true })
                ]),
            ]).start();
        }
    }, [page]);

    /* ── Sub-pages ── */
    if (page === "buses") return <BusManagementPage onBack={goBack} />;
    if (page === "drivers") return <DriverManagementPage onBack={goBack} />;
    if (page === "students") return <StudentManagementPage onBack={goBack} />;
    if (page === "parents") return <ParentManagementPage onBack={goBack} />;
    if (page === "assignment") return <BusAssignmentPage onBack={goBack} />;
    if (page === "live") return <LiveTrackingPage onBack={goBack} initialBusId={focusedBusId} />;
    if (page === "subscription") return <SubscriptionPage onBack={goBack} />;
    if (page === "notifications") return <NotificationCenterPage onBack={goBack} />;
    if (page === "reports") return <ReportsPage onBack={goBack} />;
    if (page === "contact") return <ContactCenterPage onBack={goBack} />;
    if (page === "settings") return <SettingsPage onBack={goBack} onLogout={onLogout} />;

    /* ── HOME ── */
    const quickActions: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; soft: string; target: PageKey }[] = [
        { icon: "bus", label: "Add Bus", color: BLUE, soft: BLUE_SOFT, target: "buses" },
        { icon: "person-add", label: "Add Driver", color: GREEN, soft: GREEN_SOFT, target: "drivers" },
        { icon: "people", label: "Add Parent", color: PURPLE, soft: PURPLE_SOFT, target: "parents" },
        { icon: "school", label: "Add Student", color: ORANGE, soft: ORANGE_SOFT, target: "students" },
        { icon: "map", label: "Live Map", color: RED, soft: RED_SOFT, target: "live" },
        { icon: "call", label: "Contact Driver", color: ACCENT_DEEP, soft: ACCENT_SOFT, target: "contact" },
    ];

    const menuPages: { icon: keyof typeof Ionicons.glyphMap; label: string; desc: string; target: PageKey; color: string; soft: string }[] = [
        { icon: "bus", label: "Bus Management", desc: "Add, edit, disable, replace buses", target: "buses", color: BLUE, soft: BLUE_SOFT },
        { icon: "id-card", label: "Driver Management", desc: "Drivers, licenses, suspend, call", target: "drivers", color: GREEN, soft: GREEN_SOFT },
        { icon: "school", label: "Student Management", desc: "Students, classes, bus change", target: "students", color: ORANGE, soft: ORANGE_SOFT },
        { icon: "people", label: "Parent Management", desc: "Parents, linked students, notify", target: "parents", color: PURPLE, soft: PURPLE_SOFT },
        { icon: "git-compare", label: "Bus Assignment", desc: "Assign students to buses", target: "assignment", color: RED, soft: RED_SOFT },
        { icon: "notifications", label: "Notification Center", desc: "Send alerts to parents & drivers", target: "notifications", color: ACCENT_DEEP, soft: ACCENT_SOFT },
        { icon: "bar-chart", label: "Reports", desc: "Daily & monthly trip reports", target: "reports", color: BLUE, soft: BLUE_SOFT },
        { icon: "diamond", label: "Subscription", desc: "Plan, usage, earnings, withdraw", target: "subscription", color: GREEN, soft: GREEN_SOFT },
    ];

    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

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
                    height: ms(205) + insets.top,
                    backgroundColor: ACCENT,
                    borderBottomLeftRadius: ms(95),
                    borderBottomRightRadius: ms(95),
                }}
            />

            {/* header */}
            <View style={{ paddingTop: insets.top + ms(12), paddingHorizontal: ms(20), paddingBottom: ms(18) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                        style={{
                            width: ms(44),
                            height: ms(44),
                            borderRadius: ms(16),
                            borderTopLeftRadius: ms(22),
                            overflow: "hidden",
                            borderWidth: 1.5,
                            borderColor: "#FFFFFF",
                            backgroundColor: ACCENT_SOFT,
                            shadowColor: "#000",
                            shadowOpacity: 0.1,
                            shadowRadius: 5,
                            shadowOffset: { width: 0, height: 2 },
                        }}
                    >
                        <VideoView player={player} style={{ width: "100%", height: "100%" }} contentFit="cover" nativeControls={false} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10), color: "#8B7300", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{currentDate}</Text>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(17), color: INK }} numberOfLines={1}>Good Morning, Admin!</Text>
                    </View>
                    <Press onPress={() => go("subscription")}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: CARD_BG, borderRadius: 999, paddingHorizontal: ms(8), paddingVertical: ms(6), shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } }}>
                            <Ionicons name="shield-checkmark" size={ms(13)} color={GREEN} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: INK }}>Premium</Text>
                        </View>
                    </Press>
                    <Press onPress={() => go("notifications")}>
                        <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } }}>
                            <Ionicons name="notifications-outline" size={ms(16)} color={INK} />
                            <View style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: 3.5, backgroundColor: RED, borderWidth: 1.5, borderColor: CARD_BG }} />
                        </View>
                    </Press>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: ms(96) + insets.bottom }}
            >
                {/* ── Quick actions (Horizontal Carousel) ── */}
                <Animated.View style={{ opacity: fadeAnim1, transform: [{ translateY: translateY1 }], paddingLeft: ms(16) }}>
                    <SectionTitle icon="flash" title="Quick Actions" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: ms(12), paddingRight: ms(32) }}>
                        {quickActions.map((q) => (
                            <Press key={q.label} onPress={() => go(q.target)}>
                                <View style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: "rgba(0,0,0,0.03)", paddingHorizontal: ms(14), paddingVertical: ms(14), alignItems: "center", justifyContent: "center", gap: 10, shadowColor: q.color, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, minWidth: ms(85) }}>
                                    <View style={{ width: ms(42), height: ms(42), borderRadius: ms(14), backgroundColor: q.soft, alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name={q.icon} size={ms(20)} color={q.color} />
                                    </View>
                                    <Text numberOfLines={1} style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: INK }}>{q.label}</Text>
                                </View>
                            </Press>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* ── Analytics cards ── */}
                <Animated.View style={{ opacity: fadeAnim2, transform: [{ translateY: translateY2 }], paddingHorizontal: ms(16) }}>
                    <SectionTitle icon="stats-chart" title="Overview" />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: ms(10) }}>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <View key={i} style={{ width: "48%", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, padding: ms(10), alignItems: "center" }}>
                                    <SkeletonItem height={ms(32)} width={ms(32)} borderRadius={ms(10)} style={{ marginBottom: ms(6) }} />
                                    <SkeletonItem height={ms(15)} width={ms(40)} />
                                    <SkeletonItem height={ms(10)} width={ms(60)} style={{ marginTop: ms(6) }} />
                                </View>
                            ))
                        ) : (
                            <>
                                <View style={{ width: "48%", marginBottom: ms(4) }}><Press onPress={() => go("students")}><StatCard icon="school" label="Students" value={String(students.length)} color={ORANGE} soft={ORANGE_SOFT} /></Press></View>
                                <View style={{ width: "48%", marginBottom: ms(4) }}><Press onPress={() => go("parents")}><StatCard icon="people" label="Parents" value={String(parents.length)} color={PURPLE} soft={PURPLE_SOFT} /></Press></View>
                                <View style={{ width: "48%", marginBottom: ms(4) }}><Press onPress={() => go("drivers")}><StatCard icon="id-card" label="Drivers" value={String(drivers.length)} color={GREEN} soft={GREEN_SOFT} /></Press></View>
                                <View style={{ width: "48%", marginBottom: ms(4) }}><Press onPress={() => go("buses")}><StatCard icon="bus" label="Buses" value={String(buses.length)} color={BLUE} soft={BLUE_SOFT} /></Press></View>
                            </>
                        )}
                    </View>
                </Animated.View>

                {/* ── Live fleet strip ── */}
                <Animated.View style={{ opacity: fadeAnim3, transform: [{ translateY: translateY3 }], paddingHorizontal: ms(16) }}>
                    <SectionTitle
                        icon="pulse"
                        title="Fleet Status"
                        right={
                            <Press onPress={() => go("live")} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: ACCENT_SOFT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: ACCENT_DEEP }}>Live Map</Text>
                                <Ionicons name="map" size={ms(12)} color={ACCENT_DEEP} />
                            </Press>
                        }
                    />
                    <Card style={{ padding: 0, overflow: "hidden", borderWidth: 0, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: ms(12), padding: ms(14), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                                    <SkeletonItem height={ms(42)} width={ms(42)} borderRadius={ms(14)} />
                                    <View style={{ flex: 1, gap: ms(6) }}>
                                        <SkeletonItem height={ms(14)} width="60%" />
                                        <SkeletonItem height={ms(12)} width="80%" />
                                    </View>
                                    <SkeletonItem height={ms(20)} width={ms(60)} borderRadius={999} />
                                </View>
                            ))
                        ) : (
                            buses.map((b, i) => {
                                const st = busStatusColor(b.status);
                                const drv = driverForBus(b.id);
                                return (
                                    <Press key={b.id} onPress={() => go("live", undefined, b.id)} style={{ flexDirection: "row", alignItems: "center", gap: ms(12), padding: ms(14), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                                        <View style={{ width: ms(42), height: ms(42), borderRadius: ms(14), backgroundColor: b.color + "1A", alignItems: "center", justifyContent: "center" }}>
                                            <Ionicons name="bus" size={ms(20)} color={b.color} />
                                        </View>
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color: INK }}>
                                                {b.number} · {b.vehicleNumber}
                                            </Text>
                                            <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED }}>
                                                {drv?.name ?? "Unassigned"} · {b.location}
                                            </Text>
                                        </View>
                                        <View style={{ backgroundColor: st.soft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 4 }}>
                                            {b.status === "Running" && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: st.color }} />}
                                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: st.color }}>{b.status}</Text>
                                        </View>
                                    </Press>
                                );
                            })
                        )}
                    </Card>
                </Animated.View>

                {/* ── All pages grid ── */}
                <Animated.View style={{ opacity: fadeAnim4, transform: [{ translateY: translateY4 }], paddingHorizontal: ms(16) }}>
                    <SectionTitle icon="grid" title="Manage" />
                    <View style={{ backgroundColor: CARD_BG, borderRadius: ms(20), borderWidth: 1, borderColor: BORDER, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, padding: ms(6) }}>
                        {menuPages.map((m, i) => (
                            <Press key={m.label} onPress={() => go(m.target)}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12), paddingVertical: ms(12), paddingHorizontal: ms(10), borderBottomWidth: i === menuPages.length - 1 ? 0 : 1, borderBottomColor: BORDER }}>
                                    <View style={{ width: ms(40), height: ms(40), borderRadius: ms(14), backgroundColor: m.soft, alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name={m.icon} size={ms(18)} color={m.color} />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color: INK }}>{m.label}</Text>
                                        <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{m.desc}</Text>
                                    </View>
                                    <View style={{ width: ms(28), height: ms(28), borderRadius: ms(10), backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name="chevron-forward" size={ms(14)} color={FAINT} />
                                    </View>
                                </View>
                            </Press>
                        ))}
                    </View>
                </Animated.View>

                {/* ── Recent activity ── */}
                <Animated.View style={{ opacity: fadeAnim5, transform: [{ translateY: translateY5 }], paddingHorizontal: ms(16) }}>
                    <SectionTitle icon="time" title="Recent Activity" />
                    <Card style={{ padding: 0, overflow: "hidden", borderWidth: 0, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: ms(12), padding: ms(14), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                                    <SkeletonItem height={ms(34)} width={ms(34)} borderRadius={ms(12)} />
                                    <View style={{ flex: 1, gap: ms(6) }}>
                                        <SkeletonItem height={ms(13)} width="90%" />
                                    </View>
                                    <SkeletonItem height={ms(11)} width={ms(40)} />
                                </View>
                            ))
                        ) : (
                            RECENT_ACTIVITY.map((a, i) => (
                                <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: ms(12), padding: ms(14), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                                    <View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: a.soft, alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name={a.icon} size={ms(16)} color={a.color} />
                                    </View>
                                    <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }}>{a.text}</Text>
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: FAINT }}>{a.time}</Text>
                                </View>
                            ))
                        )}
                    </Card>

                    <Text style={{ textAlign: "center", fontFamily: FONT.regular, fontSize: ms(11), color: FAINT, marginTop: ms(24) }}>
                        Version 1.0.0
                    </Text>
                </Animated.View>
            </ScrollView>

            {/* floating curved bottom nav */}
            <View
                style={{
                    position: "absolute",
                    left: ms(16),
                    right: ms(16),
                    bottom: Math.max(insets.bottom, ms(10)),
                    flexDirection: "row",
                    backgroundColor: INK,
                    borderRadius: 26,
                    borderTopLeftRadius: ms(32),
                    borderBottomRightRadius: ms(32),
                    padding: ms(7),
                    borderWidth: 1.5,
                    borderColor: "#F5E6A3",
                    shadowColor: "#000",
                    shadowOpacity: 0.22,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 10,
                }}
            >
                {(
                    [
                        { key: "home", icon: "home-outline", iconActive: "home", label: "Home", target: "home" },
                        { key: "live", icon: "map-outline", iconActive: "map", label: "Live", target: "live" },
                        { key: "manage", icon: "grid-outline", iconActive: "grid", label: "Buses", target: "buses" },
                        { key: "settings", icon: "settings-outline", iconActive: "settings", label: "Settings", target: "settings" },
                    ] as { key: Tab; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string; target: PageKey }[]
                ).map((t) => {
                    const isActive = tab === t.key;
                    return (
                        <Pressable
                            key={t.key}
                            onPress={() => go(t.target, t.key)}
                            android_ripple={null}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: isActive }}
                            style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 3,
                                height: ms(46),
                                borderRadius: 20,
                                backgroundColor: isActive ? ACCENT : "transparent",
                            }}
                        >
                            <Ionicons name={isActive ? t.iconActive : t.icon} size={ms(17)} color={isActive ? INK : "#9CA3AF"} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10), color: isActive ? INK : "#9CA3AF" }}>{t.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
