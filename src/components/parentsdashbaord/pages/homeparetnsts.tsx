/* ============================================================================
   PARENT PORTAL — HOME DASHBOARD
   Copy to: src/components/parentsdashbaord/pages/homeparetnsts.tsx
   ========================================================================== */

import React, { useEffect, useRef } from "react";
import { Alert, Animated, Linking, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
    BUS, Chip, FONT, PARENT, STUDENT, SectionTitle, VIDEOS, VideoHero, SkeletonItem,
    busStatusTone, ms, useParentData, useSubscription, useTheme,
} from "../common";
import { Press } from "../common";

export default function HomeParentsPage({
    onTrackBus,
    onOpenNotifications,
    onOpenSubscription,
}: {
    onTrackBus: () => void;
    onOpenNotifications: () => void;
    onOpenSubscription: () => void;
}) {
    const t = useTheme();
    const { INK, MUTED, FAINT, BORDER, CARD_BG, PAGE_BG, ACCENT, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, BLUE, BLUE_SOFT, ORANGE, ORANGE_SOFT, PURPLE, PURPLE_SOFT, RED, isDark } = t;
    const sub = useSubscription();
    const { isLoading, dataVersion } = useParentData();
    const st = busStatusTone(BUS.status, t);

    /* Staggered entrance */
    const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
    useEffect(() => {
        Animated.stagger(110, anims.map((a) => Animated.timing(a, { toValue: 1, duration: 420, useNativeDriver: true }))).start();
    }, []);
    const fadeUp = (a: Animated.Value) => ({
        opacity: a,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
    });

    const callDriver = () => Linking.openURL(`tel:${BUS.driverPhone.replace(/\s/g, "")}`).catch(() => Alert.alert("Call Driver", BUS.driverPhone));
    const callSchool = () => Alert.alert("School Transport Office", "+91 120 400 8899", [{ text: "OK" }]);

    const quickActions: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; soft: string; onPress: () => void }[] = [
        { icon: "navigate", label: "Track Bus", color: GREEN, soft: GREEN_SOFT, onPress: onTrackBus },
        { icon: "call", label: "Contact Driver", color: BLUE, soft: BLUE_SOFT, onPress: callDriver },
        { icon: "business", label: "School Contact", color: PURPLE, soft: PURPLE_SOFT, onPress: callSchool },
        { icon: "notifications", label: "Notifications", color: ORANGE, soft: ORANGE_SOFT, onPress: onOpenNotifications },
    ];

    return (
        <ScrollView style={{ flex: 1, backgroundColor: PAGE_BG }} contentContainerStyle={{ padding: ms(16), paddingBottom: ms(110) }} showsVerticalScrollIndicator={false}>
            {/* ── Video hero with text overlay ── */}
            <Animated.View style={fadeUp(anims[0])}>
                <VideoHero
                    source={VIDEOS.kidsBus}
                    height={185}
                    title={`Good Morning, ${PARENT.name.split(" ")[0]}`}
                    subtitle={`${STUDENT.name} is on ${BUS.number} · arriving in ~${BUS.etaMin} min`}
                    badge={<Chip text={BUS.status} color={st.color} soft={st.soft} />}
                />
            </Animated.View>

            {/* ── Trial / subscription strip ── */}
            <Animated.View style={fadeUp(anims[0])}>
                {sub.status !== "active" ? (
                    <Press onPress={onOpenSubscription} style={{
                        marginTop: ms(12), flexDirection: "row", alignItems: "center", gap: ms(10),
                        backgroundColor: sub.status === "trial" ? ACCENT_SOFT : t.RED_SOFT,
                        borderWidth: 1, borderColor: sub.status === "trial" ? "rgba(185,151,0,0.25)" : "rgba(220,38,38,0.25)",
                        borderRadius: ms(16), paddingVertical: ms(11), paddingHorizontal: ms(14),
                    }}>
                        <Ionicons name={sub.status === "trial" ? "gift" : "lock-closed"} size={ms(18)} color={sub.status === "trial" ? ACCENT_DEEP : RED} />
                        <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>
                            {sub.status === "trial"
                                ? `Free trial active — ${sub.trialDaysLeft} days left. Upgrade anytime.`
                                : "Trial ended. Subscribe to unlock live bus tracking."}
                        </Text>
                        <Ionicons name="chevron-forward" size={ms(16)} color={MUTED} />
                    </Press>
                ) : (
                    <View style={{
                        marginTop: ms(12), flexDirection: "row", alignItems: "center", gap: ms(10),
                        backgroundColor: GREEN_SOFT, borderWidth: 1, borderColor: "rgba(22,163,74,0.25)",
                        borderRadius: ms(16), paddingVertical: ms(11), paddingHorizontal: ms(14),
                    }}>
                        <Ionicons name="shield-checkmark" size={ms(18)} color={GREEN} />
                        <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>
                            {sub.planName} plan active — live tracking unlocked.
                        </Text>
                    </View>
                )}
            </Animated.View>

            {/* ── Student card ── */}
            <Animated.View style={fadeUp(anims[1])}>
                <SectionTitle icon="school" title="My Child" />
                {isLoading ? (
                    /* ── Skeleton while data loads ── */
                    <View style={{ backgroundColor: CARD_BG, borderRadius: ms(24), borderWidth: 1, borderColor: BORDER, padding: ms(16), shadowColor: "#000", shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                            <SkeletonItem width={ms(56)} height={ms(56)} borderRadius={ms(20)} />
                            <View style={{ flex: 1, gap: ms(6) }}>
                                <SkeletonItem width="70%" height={ms(16)} borderRadius={ms(6)} />
                                <SkeletonItem width="50%" height={ms(12)} borderRadius={ms(4)} />
                                <SkeletonItem width="40%" height={ms(11)} borderRadius={ms(4)} />
                            </View>
                            <SkeletonItem width={ms(60)} height={ms(24)} borderRadius={999} />
                        </View>
                        <View style={{ height: 1, backgroundColor: BORDER, marginVertical: ms(12) }} />
                        <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                            <SkeletonItem width={ms(40)} height={ms(40)} borderRadius={ms(14)} />
                            <View style={{ flex: 1, gap: ms(5) }}>
                                <SkeletonItem width="60%" height={ms(13)} borderRadius={ms(4)} />
                                <SkeletonItem width="80%" height={ms(11)} borderRadius={ms(4)} />
                            </View>
                            <SkeletonItem width={ms(70)} height={ms(32)} borderRadius={ms(12)} />
                        </View>
                    </View>
                ) : (
                <View style={{ backgroundColor: CARD_BG, borderRadius: ms(24), borderWidth: 1, borderColor: BORDER, padding: ms(16), shadowColor: "#000", shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                        <View style={{ width: ms(56), height: ms(56), borderRadius: ms(20), backgroundColor: STUDENT.photoBg, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(20), color: "#111827" }}>
                                {STUDENT.name.split(" ").map((n) => n[0]).join("")}
                            </Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.display, fontSize: ms(16), color: INK }}>{STUDENT.name}</Text>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED, marginTop: 2 }}>
                                {STUDENT.className} · Section {STUDENT.section}
                            </Text>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: FAINT, marginTop: 1 }}>{STUDENT.school}</Text>
                        </View>
                        <Chip text={BUS.number} color={ACCENT_DEEP} soft={ACCENT_SOFT} />
                    </View>

                    <View style={{ height: 1, backgroundColor: BORDER, marginVertical: ms(12) }} />

                    {/* Bus status row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                        <View style={{ width: ms(40), height: ms(40), borderRadius: ms(14), backgroundColor: st.soft, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="bus" size={ms(19)} color={st.color} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>{BUS.status} · ETA {BUS.etaMin} min</Text>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 1 }}>
                                {BUS.route} · Driver {BUS.driver}
                            </Text>
                        </View>
                        <Press onPress={onTrackBus} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: ACCENT, borderRadius: ms(12), paddingVertical: ms(8), paddingHorizontal: ms(12) }}>
                            <Ionicons name="navigate" size={ms(13)} color="#111827" />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#111827" }}>Track</Text>
                        </Press>
                    </View>
                </View>
                )}
            </Animated.View>

            {/* ── Quick actions ── */}
            <Animated.View style={fadeUp(anims[2])}>
                <SectionTitle icon="flash" title="Quick Actions" />
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: ms(4), marginTop: ms(4) }}>
                    {quickActions.map((qa) => (
                        <Press key={qa.label} onPress={qa.onPress} style={{ alignItems: "center", gap: ms(8), width: ms(72) }}>
                            <View style={{
                                width: ms(58), height: ms(58), borderRadius: ms(22),
                                backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center",
                                borderWidth: 1, borderColor: BORDER,
                                shadowColor: qa.color, shadowOpacity: isDark ? 0.3 : 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4
                            }}>
                                <View style={{ width: ms(44), height: ms(44), borderRadius: ms(16), backgroundColor: qa.soft, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name={qa.icon} size={ms(22)} color={qa.color} />
                                </View>
                            </View>
                            <Text numberOfLines={2} style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: INK, textAlign: "center", lineHeight: ms(14) }}>
                                {qa.label}
                            </Text>
                        </Press>
                    ))}
                </View>
            </Animated.View>

            {/* ── Live trip summary (Timeline) ── */}
            <Animated.View style={fadeUp(anims[3])}>
                <SectionTitle icon="pulse" title="Today's Trip" />
                <View style={{ backgroundColor: CARD_BG, borderRadius: ms(24), borderWidth: 1, borderColor: BORDER, padding: ms(20), shadowColor: "#000", shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
                    {[
                        { icon: "sunny" as const, label: "Morning pickup", value: "7:12 AM", done: true },
                        { icon: "school" as const, label: "Reached school", value: "7:48 AM", done: true },
                        { icon: "bus" as const, label: "Return trip started", value: "2:05 PM", done: true },
                        { icon: "home" as const, label: "Home drop", value: `ETA ${BUS.etaMin} min`, done: false },
                    ].map((row, i, arr) => {
                        const isLast = i === arr.length - 1;
                        return (
                            <View key={row.label} style={{ flexDirection: "row", gap: ms(16) }}>
                                {/* Timeline Graphics */}
                                <View style={{ alignItems: "center" }}>
                                    <View style={{
                                        width: ms(32), height: ms(32), borderRadius: 99,
                                        backgroundColor: row.done ? GREEN_SOFT : ACCENT_SOFT,
                                        alignItems: "center", justifyContent: "center",
                                        borderWidth: row.done ? 0 : 2,
                                        borderColor: row.done ? "transparent" : ACCENT_DEEP,
                                    }}>
                                        <Ionicons name={row.done ? "checkmark" : row.icon} size={ms(16)} color={row.done ? GREEN : ACCENT_DEEP} />
                                    </View>
                                    {!isLast && (
                                        <View style={{
                                            width: 2, flex: 1, minHeight: ms(24),
                                            backgroundColor: row.done ? GREEN : BORDER,
                                            marginVertical: ms(4),
                                            opacity: row.done ? 0.5 : 1,
                                        }} />
                                    )}
                                </View>
                                {/* Text Content */}
                                <View style={{ flex: 1, paddingBottom: isLast ? 0 : ms(24), justifyContent: "center", transform: [{ translateY: -ms(2) }] }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: row.done ? INK : MUTED }}>{row.label}</Text>
                                    <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: row.done ? INK : ACCENT_DEEP, marginTop: 2 }}>{row.value}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </Animated.View>
        </ScrollView>
    );
}
