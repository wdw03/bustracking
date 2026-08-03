/* ============================================================================
   SCHOOL ADMIN DASHBOARD — MAIN SHELL + HOME
   Copy to: src/components/schooldashboard/schooldashbaordmain.tsx

   DEMO LOGIN: 9876543210 / 1234 (school admin)

   Contains: Dashboard Home + bottom navigation + internal page switching.
   All other pages live in ./pages/ and are opened from here — no external
   navigation library needed. Videos reuse the same assets as the rest of
   the app (school / bus / kids animations).
   ========================================================================== */

import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import {
    ACCENT, ACCENT_DEEP, ACCENT_SOFT, BLUE, BLUE_SOFT, BORDER, BUSES, CARD_BG, Card, Chip, DRIVERS, FAINT, FONT,
    GREEN, GREEN_SOFT, INK, MUTED, ORANGE, ORANGE_SOFT, PAGE_BG, PARENTS, PURPLE, PURPLE_SOFT, Press, RECENT_ACTIVITY,
    RED, RED_SOFT, SCHOOL, STUDENTS, SectionTitle, StatCard, busStatusColor, driverForBus, ms,
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
    const insets = useSafeAreaInsets();
    const [page, setPage] = useState<PageKey>("home");
    const [tab, setTab] = useState<Tab>("home");

    const player = useVideoPlayer(SCHOOL_VIDEO, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    const stats = useMemo(() => {
        const running = BUSES.filter((b) => b.status === "Running").length;
        const offline = BUSES.filter((b) => b.status !== "Running").length;
        const gpsOn = BUSES.filter((b) => b.gps === "Online").length;
        return { running, offline, gpsOn };
    }, []);

    const go = (p: PageKey, t?: Tab) => {
        setPage(p);
        if (t) setTab(t);
    };

    /* ── Sub-pages ── */
    if (page === "buses") return <BusManagementPage onBack={() => go("home", "home")} />;
    if (page === "drivers") return <DriverManagementPage onBack={() => go("home", "home")} />;
    if (page === "students") return <StudentManagementPage onBack={() => go("home", "home")} />;
    if (page === "parents") return <ParentManagementPage onBack={() => go("home", "home")} />;
    if (page === "assignment") return <BusAssignmentPage onBack={() => go("home", "home")} />;
    if (page === "live") return <LiveTrackingPage onBack={() => go("home", "home")} />;
    if (page === "subscription") return <SubscriptionPage onBack={() => go("home", "home")} />;
    if (page === "notifications") return <NotificationCenterPage onBack={() => go("home", "home")} />;
    if (page === "reports") return <ReportsPage onBack={() => go("home", "home")} />;
    if (page === "contact") return <ContactCenterPage onBack={() => go("home", "home")} />;
    if (page === "settings") return <SettingsPage onBack={() => go("home", "home")} onLogout={onLogout} />;

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

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            {/* ── Curved header (fixed, content scrolls under nothing — no overlap) ── */}
            <View
                style={{
                    backgroundColor: ACCENT,
                    paddingTop: insets.top + ms(10),
                    paddingBottom: ms(18),
                    paddingHorizontal: ms(16),
                    borderBottomLeftRadius: ms(28),
                    borderBottomRightRadius: ms(28),
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                    {/* School logo — video inside curved squircle */}
                    <View style={{ width: ms(52), height: ms(52), borderRadius: ms(18), overflow: "hidden", backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "rgba(255,255,255,0.7)" }}>
                        <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls={false} contentFit="cover" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: INK, letterSpacing: -0.4 }}>
                            {SCHOOL.name}
                        </Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: "#6B5900", marginTop: 1 }}>
                            {SCHOOL.code} · Admin Panel
                        </Text>
                    </View>
                    <Press onPress={() => go("notifications")} style={{ width: ms(40), height: ms(40), borderRadius: ms(14), backgroundColor: "rgba(255,255,255,0.55)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="notifications" size={ms(19)} color={INK} />
                        <View style={{ position: "absolute", top: 7, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: RED }} />
                    </Press>
                </View>

                {/* Subscription strip */}
                <Press onPress={() => go("subscription")} style={{ marginTop: ms(12), backgroundColor: "rgba(255,255,255,0.6)", borderRadius: ms(14), paddingHorizontal: ms(12), paddingVertical: ms(9), flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="shield-checkmark" size={ms(15)} color={GREEN} />
                    <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>
                        {SCHOOL.subscription.plan} · {SCHOOL.subscription.status}
                    </Text>
                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: "#6B5900" }}>
                        Renews {SCHOOL.subscription.renewal}
                    </Text>
                    <Ionicons name="chevron-forward" size={ms(13)} color={MUTED} />
                </Press>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: ms(16), paddingBottom: ms(96) + insets.bottom }}
            >
                {/* ── Analytics cards ── */}
                <SectionTitle icon="stats-chart" title="Overview" />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ms(10) }}>
                    <StatCard icon="school" label="Total Students" value={String(STUDENTS.length * 87)} color={ORANGE} soft={ORANGE_SOFT} />
                    <StatCard icon="people" label="Total Parents" value={String(PARENTS.length * 78)} color={PURPLE} soft={PURPLE_SOFT} />
                    <StatCard icon="id-card" label="Total Drivers" value={String(DRIVERS.length)} color={GREEN} soft={GREEN_SOFT} />
                    <StatCard icon="bus" label="Total Buses" value={String(BUSES.length)} color={BLUE} soft={BLUE_SOFT} />
                    <StatCard icon="navigate" label="Running Buses" value={String(stats.running)} color={GREEN} soft={GREEN_SOFT} />
                    <StatCard icon="cloud-offline" label="Offline Buses" value={String(stats.offline)} color={RED} soft={RED_SOFT} />
                    <StatCard icon="locate" label="GPS Connected" value={`${stats.gpsOn}/${BUSES.length}`} color={BLUE} soft={BLUE_SOFT} />
                    <StatCard icon="today" label="Today's Trips" value="14" color={ACCENT_DEEP} soft={ACCENT_SOFT} />
                </View>

                {/* ── Quick actions ── */}
                <SectionTitle icon="flash" title="Quick Actions" />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ms(10) }}>
                    {quickActions.map((q) => (
                        <Press key={q.label} onPress={() => go(q.target)} style={{ flexBasis: "31%", flexGrow: 1, backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingVertical: ms(13), alignItems: "center", gap: 6 }}>
                            <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: q.soft, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={q.icon} size={ms(18)} color={q.color} />
                            </View>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: INK }}>{q.label}</Text>
                        </Press>
                    ))}
                </View>

                {/* ── Live fleet strip ── */}
                <SectionTitle
                    icon="pulse"
                    title="Fleet Status"
                    right={
                        <Press onPress={() => go("live")} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: ACCENT_DEEP }}>Live Map</Text>
                            <Ionicons name="arrow-forward" size={ms(12)} color={ACCENT_DEEP} />
                        </Press>
                    }
                />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    {BUSES.map((b, i) => {
                        const st = busStatusColor(b.status);
                        const drv = driverForBus(b.id);
                        return (
                            <Press key={b.id} onPress={() => go("live")} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(12), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                                <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: b.color + "1A", alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="bus" size={ms(17)} color={b.color} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>
                                        {b.number} · {b.vehicleNumber}
                                    </Text>
                                    <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>
                                        {drv?.name ?? "Unassigned"} · {b.location}
                                    </Text>
                                </View>
                                <Chip text={b.status} color={st.color} soft={st.soft} />
                            </Press>
                        );
                    })}
                </Card>

                {/* ── All pages grid ── */}
                <SectionTitle icon="grid" title="Manage" />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    {menuPages.map((m, i) => (
                        <Press key={m.label} onPress={() => go(m.target)} style={{ flexDirection: "row", alignItems: "center", gap: ms(11), padding: ms(13), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                            <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: m.soft, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={m.icon} size={ms(18)} color={m.color} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>{m.label}</Text>
                                <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{m.desc}</Text>
                            </View>
                            <View style={{ width: ms(26), height: ms(26), borderRadius: ms(9), backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="chevron-forward" size={ms(13)} color={FAINT} />
                            </View>
                        </Press>
                    ))}
                </Card>

                {/* ── Recent activity ── */}
                <SectionTitle icon="time" title="Recent Activity" />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    {RECENT_ACTIVITY.map((a, i) => (
                        <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(12), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                            <View style={{ width: ms(32), height: ms(32), borderRadius: ms(11), backgroundColor: a.soft, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={a.icon} size={ms(15)} color={a.color} />
                            </View>
                            <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(12.5), color: INK }}>{a.text}</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT }}>{a.time}</Text>
                        </View>
                    ))}
                </Card>

                <Text style={{ textAlign: "center", fontFamily: FONT.regular, fontSize: ms(11), color: FAINT, marginTop: ms(18) }}>
                    Version 1.0.0
                </Text>
            </ScrollView>

            {/* ── Floating curved bottom nav (above content, never overlapped) ── */}
            <View
                style={{
                    position: "absolute",
                    left: ms(16),
                    right: ms(16),
                    bottom: Math.max(insets.bottom, ms(12)),
                    backgroundColor: INK,
                    borderRadius: ms(24),
                    flexDirection: "row",
                    paddingVertical: ms(9),
                    paddingHorizontal: ms(8),
                    shadowColor: "#000",
                    shadowOpacity: 0.22,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 10,
                }}
            >
                {(
                    [
                        { key: "home", icon: "home", label: "Home", target: "home" },
                        { key: "live", icon: "map", label: "Live", target: "live" },
                        { key: "manage", icon: "grid", label: "Buses", target: "buses" },
                        { key: "settings", icon: "settings", label: "Settings", target: "settings" },
                    ] as { key: Tab; icon: keyof typeof Ionicons.glyphMap; label: string; target: PageKey }[]
                ).map((t) => {
                    const active = tab === t.key && page === "home" ? t.key === "home" : false;
                    const isActive = t.key === "home" && page === "home";
                    return (
                        <Press key={t.key} haptic onPress={() => go(t.target, t.key)} style={{ flex: 1, alignItems: "center" }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                    backgroundColor: isActive ? ACCENT : "transparent",
                                    borderRadius: 999,
                                    paddingHorizontal: ms(13),
                                    paddingVertical: ms(7),
                                }}
                            >
                                <Ionicons name={t.icon} size={ms(17)} color={isActive ? INK : "#9CA3AF"} />
                                {isActive ? (
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: INK }}>{t.label}</Text>
                                ) : null}
                            </View>
                        </Press>
                    );
                })}
            </View>
        </View>
    );
}
