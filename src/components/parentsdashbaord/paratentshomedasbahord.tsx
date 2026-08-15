/* ============================================================================
   PARENT PORTAL — MAIN SHELL (header + pages + bottom navigation)
   Copy to: src/components/parentsdashbaord/paratentshomedasbahord.tsx

   Tabs: Home · Track · Alerts · History · Profile
   Subscription page opens as a stacked page on top of any tab.
   ========================================================================== */

import React, { useEffect, useState } from "react";
import { BackHandler, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import {
    BUS, Chip, FONT, PARENT, STUDENT, Press, ParentDataProvider, SettingsProvider, SubscriptionProvider,
    ms, useSubscription, useTheme,
} from "./common";

import HomeParentsPage from "./pages/homeparetnsts";
import LiveTrackingParentsPage from "./pages/livetrackingparents";
import NotificationsParentsPage from "./pages/notificationsparents";
import TripHistoryParentsPage from "./pages/triphistoryparents";
import ProfileParentsPage from "./pages/profileparents";
import SubscriptionParentsPage from "./pages/subscriptionparents";
import LocationPickerParentsPage from "./pages/locationpickerparents";

export type ParentTab = "home" | "track" | "alerts" | "history" | "profile";

export default function ParentsHomeDashboard({ onLogout }: { onLogout?: () => void }) {
    return (
        <SettingsProvider>
            <ParentDataProvider>
                <SubscriptionProvider>
                    <ParentsDashboardContent onLogout={onLogout} />
                </SubscriptionProvider>
            </ParentDataProvider>
        </SettingsProvider>
    );
}

function ParentsDashboardContent({ onLogout }: { onLogout?: () => void }) {
    const { INK, MUTED, FAINT, BORDER, CARD_BG, PAGE_BG, ACCENT, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, RED, RED_SOFT, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const sub = useSubscription();

    const [tab, setTab] = useState<ParentTab>("home");
    const [showSubscription, setShowSubscription] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    /* Android back: close subscription overlay first, then go home */
    useEffect(() => {
        const onBack = () => {
            if (showSubscription) { setShowSubscription(false); return true; }
            if (showLocationPicker) { setShowLocationPicker(false); return true; }
            if (tab !== "home") { setTab("home"); return true; }
            return false;
        };
        const s = BackHandler.addEventListener("hardwareBackPress", onBack);
        return () => s.remove();
    }, [showSubscription, showLocationPicker, tab]);

    if (showSubscription) {
        return <SubscriptionParentsPage onBack={() => setShowSubscription(false)} />;
    }
    if (showLocationPicker) {
        return <LocationPickerParentsPage onBack={() => setShowLocationPicker(false)} />;
    }

    const TAB_META: Record<ParentTab, { title: string; subtitle: string }> = {
        home: { title: "Parent Portal", subtitle: `Welcome back, ${PARENT.name.split(" ")[0]}` },
        track: { title: "Live Tracking", subtitle: `${BUS.number} · ${BUS.route}` },
        alerts: { title: "Notifications", subtitle: "Bus, school & billing updates" },
        history: { title: "Trip History", subtitle: "Pickups, drops & timings" },
        profile: { title: "My Profile", subtitle: "Student, contact & settings" },
    };

    const meta = TAB_META[tab];

    const NAV: { key: ParentTab; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string }[] = [
        { key: "home", icon: "home-outline", iconActive: "home", label: "Home" },
        { key: "track", icon: "navigate-outline", iconActive: "navigate", label: "Track" },
        { key: "alerts", icon: "notifications-outline", iconActive: "notifications", label: "Alerts" },
        { key: "history", icon: "time-outline", iconActive: "time", label: "History" },
        { key: "profile", icon: "person-outline", iconActive: "person", label: "Profile" },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            {/* ── Premium Gradient Header ── */}
            <View style={{
                zIndex: 10, elevation: 12,
                borderBottomLeftRadius: ms(32), borderBottomRightRadius: ms(32),
                shadowColor: "#8B7300", shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
                backgroundColor: ACCENT, overflow: "hidden"
            }}>
                <LinearGradient
                    colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.0)"]}
                    style={{
                        paddingTop: insets.top + ms(12), paddingBottom: ms(20), paddingHorizontal: ms(20),
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                        <Press onPress={() => setTab("profile")} style={{ 
                            width: ms(46), height: ms(46), borderRadius: ms(16), 
                            backgroundColor: STUDENT.photoBg, alignItems: "center", justifyContent: "center",
                            borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
                            shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
                        }}>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: "#111827" }}>
                                {STUDENT.name.split(" ").map((n) => n[0]).join("")}
                            </Text>
                        </Press>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.displayHeavy, fontSize: ms(22), color: "#111827", letterSpacing: -0.5 }}>
                                {meta.title}
                            </Text>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(13), color: "#544600", marginTop: 2 }}>
                                {meta.subtitle}
                            </Text>
                        </View>
                        <Press onPress={() => setShowSubscription(true)}>
                            <Chip
                                text={sub.status === "active" ? "Premium" : sub.status === "trial" ? `Trial ${sub.trialDaysLeft}d` : "Locked"}
                                color={sub.status === "expired" ? RED : sub.status === "active" ? GREEN : "#111827"}
                                soft={sub.status === "expired" ? RED_SOFT : sub.status === "active" ? GREEN_SOFT : "rgba(255,255,255,0.6)"}
                            />
                        </Press>
                    </View>
                </LinearGradient>
            </View>

            {/* ── Active page ── */}
            <View style={{ flex: 1 }}>
                {tab === "home" ? (
                    <HomeParentsPage
                        onTrackBus={() => setTab("track")}
                        onOpenNotifications={() => setTab("alerts")}
                        onOpenSubscription={() => setShowSubscription(true)}
                    />
                ) : tab === "track" ? (
                    <LiveTrackingParentsPage onBuy={() => setShowSubscription(true)} />
                ) : tab === "alerts" ? (
                    <NotificationsParentsPage />
                ) : tab === "history" ? (
                    <TripHistoryParentsPage />
                ) : (
                    <ProfileParentsPage
                        onOpenSubscription={() => setShowSubscription(true)}
                        onOpenMap={() => setShowLocationPicker(true)}
                        onLogout={() => onLogout?.()}
                    />
                )}
            </View>

            {/* ── Floating Pill Navigation Bar ── */}
            <View style={{
                position: "absolute", left: ms(16), right: ms(16), bottom: Math.max(insets.bottom, ms(16)),
                backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)", 
                borderRadius: ms(30),
                paddingVertical: ms(8), paddingHorizontal: ms(12),
                flexDirection: "row", justifyContent: "space-between",
                shadowColor: "#000", shadowOpacity: isDark ? 0.4 : 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 16,
                borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
            }}>
                {NAV.map((n) => {
                    const active = tab === n.key;
                    return (
                        <Press key={n.key} onPress={() => setTab(n.key)} style={{ 
                            alignItems: "center", justifyContent: "center", 
                            flexDirection: "row",
                            backgroundColor: active ? ACCENT_SOFT : "transparent",
                            paddingVertical: ms(8), paddingHorizontal: active ? ms(14) : ms(10),
                            borderRadius: ms(20)
                        }}>
                            <Ionicons name={active ? n.iconActive : n.icon} size={ms(20)} color={active ? ACCENT_DEEP : FAINT} />
                            {active && (
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: ACCENT_DEEP, marginLeft: ms(6) }}>
                                    {n.label}
                                </Text>
                            )}
                        </Press>
                    );
                })}
            </View>
        </View>
    );
}
