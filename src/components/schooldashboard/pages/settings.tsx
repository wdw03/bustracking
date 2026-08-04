/* ============================================================================
   SCHOOL SETTINGS — School Admin
   Copy to: src/components/schooldashboard/pages/settings.tsx
   School details, GPS, language, dark mode, permissions, password,
   Logout + Delete Account (double confirm — Play Store requirement).
   ========================================================================== */

import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import {
    Card, FONT, InfoRow, PageHeader, Press,
    SCHOOL, SectionTitle, ms, useTheme, useSettings
} from "../common";

const SCHOOL_VIDEO = require("../../../../assets/expo.icon/Assets/school-animation-gif-download-7813556.mp4");

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    const { ACCENT } = useTheme();
    return (
        <Press haptic onPress={onToggle} style={{ width: ms(46), height: ms(27), borderRadius: 999, backgroundColor: on ? ACCENT : "#E5E7EB", padding: 3, alignItems: on ? "flex-end" : "flex-start", justifyContent: "center" }}>
            <View style={{ width: ms(21), height: ms(21), borderRadius: 999, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} />
        </Press>
    );
}

export default function SettingsPage({ onBack, onLogout }: { onBack: () => void; onLogout?: () => void }) {
    const insets = useSafeAreaInsets();
    const { isDarkMode, setIsDarkMode, gpsEnabled, setGpsEnabled, notificationsEnabled, setNotificationsEnabled } = useSettings();
    const { INK, PAGE_BG, MUTED, ACCENT_SOFT, ACCENT_DEEP, BLUE, BLUE_SOFT, GREEN, GREEN_SOFT, ORANGE, ORANGE_SOFT, RED, RED_SOFT, PURPLE, PURPLE_SOFT, FAINT, BORDER } = useTheme();

    const player = useVideoPlayer(SCHOOL_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });
    const act = (label: string) => Alert.alert(label, "Your school settings have been updated.", [{ text: "OK" }]);

    const logout = () =>
        Alert.alert("Logout?", "You will need to log in again.", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: () => onLogout?.() },
        ]);

    const deleteAccount = () =>
        Alert.alert("Delete Account?", "This permanently deletes the school account and ALL data — buses, drivers, students, parents. This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Continue",
                style: "destructive",
                onPress: () =>
                    Alert.alert("Are you absolutely sure?", 'Tap "Delete Forever" to confirm this action.', [
                        { text: "Keep Account", style: "cancel" },
                        { text: "Delete Forever", style: "destructive", onPress: () => act("Account Deletion Requested") },
                    ]),
            },
        ]);

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Settings" subtitle="School profile & preferences" onBack={onBack} topInset={insets.top} />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                {/* School profile card */}
                <Card style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                    <View style={{ width: ms(60), height: ms(60), borderRadius: ms(20), overflow: "hidden", backgroundColor: ACCENT_SOFT }}>
                        <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls={false} contentFit="cover" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>{SCHOOL.name}</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{SCHOOL.code}</Text>
                    </View>
                    <Press onPress={() => act("Change Logo")} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: ACCENT_SOFT, borderRadius: 999, paddingHorizontal: ms(11), paddingVertical: ms(7) }}>
                        <Ionicons name="camera" size={ms(13)} color={ACCENT_DEEP} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: ACCENT_DEEP }}>Logo</Text>
                    </Press>
                </Card>

                <SectionTitle icon="business" title="School Details" right={
                    <Press onPress={() => act("Edit School Details")}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: ACCENT_DEEP }}>Edit</Text>
                    </Press>
                } />
                <Card>
                    <InfoRow icon="person" label="Principal Name" value={SCHOOL.principal} color={BLUE} soft={BLUE_SOFT} />
                    <InfoRow icon="call" label="Phone" value={SCHOOL.phone} color={GREEN} soft={GREEN_SOFT} />
                    <InfoRow icon="mail" label="Email" value={SCHOOL.email} color={ORANGE} soft={ORANGE_SOFT} />
                    <InfoRow icon="location" label="Address" value={SCHOOL.address} color={RED} soft={RED_SOFT} />
                </Card>

                <SectionTitle icon="options" title="Preferences" />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    {[
                        { icon: "moon" as const, label: "Dark Mode", desc: "Enable dark theme", color: PURPLE, soft: PURPLE_SOFT, right: <Toggle on={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} /> },
                        { icon: "notifications" as const, label: "Notifications", desc: "Push alerts & emails", color: RED, soft: RED_SOFT, right: <Toggle on={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} /> },
                        { icon: "locate" as const, label: "GPS Settings", desc: "Live tracking for all buses", color: BLUE, soft: BLUE_SOFT, right: <Toggle on={gpsEnabled} onToggle={() => setGpsEnabled(!gpsEnabled)} /> },
                        { icon: "language" as const, label: "Language", desc: "English (India)", color: GREEN, soft: GREEN_SOFT, right: <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />, fn: () => act("Language") },
                        { icon: "shield-checkmark" as const, label: "Permissions", desc: "Location, notifications, contacts", color: ORANGE, soft: ORANGE_SOFT, right: <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />, fn: () => act("App Permissions") },
                        { icon: "key" as const, label: "Change Password", desc: "Update your admin password", color: ACCENT_DEEP, soft: ACCENT_SOFT, right: <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />, fn: () => act("Change Password") },
                    ].map((r, i) => (
                        <Press key={r.label} onPress={r.fn ?? (() => { })} style={{ flexDirection: "row", alignItems: "center", gap: ms(11), padding: ms(13), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                            <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: r.soft, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={r.icon} size={ms(16)} color={r.color} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>{r.label}</Text>
                                <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED }}>{r.desc}</Text>
                            </View>
                            {r.right}
                        </Press>
                    ))}
                </Card>

                <SectionTitle icon="alert-circle" title="Account" />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    <Press onPress={logout} style={{ flexDirection: "row", alignItems: "center", gap: ms(11), padding: ms(13) }}>
                        <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="log-out" size={ms(16)} color={ORANGE} />
                        </View>
                        <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>Logout</Text>
                        <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />
                    </Press>
                    <Press onPress={deleteAccount} style={{ flexDirection: "row", alignItems: "center", gap: ms(11), padding: ms(13), borderTopWidth: 1, borderTopColor: BORDER }}>
                        <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: RED_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="trash" size={ms(16)} color={RED} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: RED }}>Delete Account</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED }}>Permanently remove school & all data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />
                    </Press>
                </Card>

                <Text style={{ textAlign: "center", fontFamily: FONT.regular, fontSize: ms(11), color: FAINT, marginTop: ms(18) }}>
                    BusTracker · Version 1.0.0
                </Text>
            </ScrollView>
        </View>
    );
}
