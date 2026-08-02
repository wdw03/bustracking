/* ============================================================================
   ACCOUNT SETTINGS — Driver — BusTracker
   Copy to: src/components/driver/driverpages/accounysseting.tsx

   Includes Logout AND Delete Account (with confirm dialog) —
   Google Play requires an in-app account-deletion option.

   Wire:
     <AccountSettings
        onBack={() => navigation.goBack()}
        onChangePassword={() => navigation.navigate("ChangePassword")}
        onNotificationSettings={() => navigation.navigate("NotificationSettings")}
        onLogout={() => navigation.replace("Login")}
        onDeleteAccount={() => {// call delete API then navigation.replace("Login")}}
     />
   ========================================================================== */

import React, { useState } from "react";
import { Alert, Dimensions, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#FFD500";
const ACCENT_SOFT = "#FFF7CC";
const ACCENT_DEEP = "#B99700";
const INK = "#111827";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER = "#E5E7EB";
const PAGE_BG = "#F8F9FB";
const RED = "#DC2626";
const RED_SOFT = "#FEE2E2";
const GREEN = "#16A34A";
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

type Props = {
    onBack?: () => void;
    onChangePassword?: () => void;
    onNotificationSettings?: () => void;
    onLogout?: () => void;
    onDeleteAccount?: () => void;
};

function Row({
    icon,
    label,
    desc,
    color = INK,
    chipBg = ACCENT_SOFT,
    chipColor = ACCENT_DEEP,
    onPress,
    right,
    last,
}: {
    icon: any;
    label: string;
    desc?: string;
    color?: string;
    chipBg?: string;
    chipColor?: string;
    onPress?: () => void;
    right?: React.ReactNode;
    last?: boolean;
}) {
    return (
        <Pressable
            onPress={() => {
                Haptics.selectionAsync();
                onPress?.();
            }}
            android_ripple={null}
            accessibilityRole="button"
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: ms(12),
                    paddingHorizontal: ms(10),
                    borderBottomWidth: last ? 0 : 1,
                    borderBottomColor: "#F3F4F6",
                }}
            >
                <View
                    style={{
                        width: ms(40),
                        height: ms(40),
                        borderRadius: ms(14),
                        backgroundColor: chipBg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: ms(12),
                    }}
                >
                    <Ionicons name={icon} size={ms(18)} color={chipColor} />
                </View>
                <View style={{ flex: 1, paddingRight: ms(8) }}>
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color }} numberOfLines={1}>
                        {label}
                    </Text>
                    {desc ? (
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED, marginTop: 2 }} numberOfLines={1}>
                            {desc}
                        </Text>
                    ) : null}
                </View>
                {right ?? (
                    <View
                        style={{
                            width: ms(28),
                            height: ms(28),
                            borderRadius: ms(10),
                            backgroundColor: PAGE_BG,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: BORDER,
                        }}
                    >
                        <Ionicons name="chevron-forward" size={ms(14)} color={INK} />
                    </View>
                )}
            </View>
        </Pressable>
    );
}

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
    return (
        <Pressable
            onPress={onToggle}
            accessibilityRole="switch"
            accessibilityState={{ checked: value }}
            style={{
                width: ms(48),
                height: ms(28),
                borderRadius: 14,
                backgroundColor: value ? GREEN : "#D1D5DB",
                justifyContent: "center",
                paddingHorizontal: 3,
            }}
        >
            <View
                style={{
                    width: ms(22),
                    height: ms(22),
                    borderRadius: 11,
                    backgroundColor: "#FFFFFF",
                    alignSelf: value ? "flex-end" : "flex-start",
                }}
            />
        </Pressable>
    );
}

export default function AccountSettings({
    onBack,
    onChangePassword,
    onNotificationSettings,
    onLogout,
    onDeleteAccount,
}: Props) {
    const insets = useSafeAreaInsets();
    const [darkMode, setDarkMode] = useState(false);
    const [locationOn, setLocationOn] = useState(false);

    const toggleLocationPermission = async () => {
        Haptics.selectionAsync();
        if (locationOn) {
            setLocationOn(false);
            return;
        }

        const requestPermission = (): Promise<boolean> => {
            return new Promise((resolve) => {
                Alert.alert(
                    '"BusTracker" Would Like to Access Your Location',
                    'Allow location access for live GPS tracking & trip sharing with parents.',
                    [
                        { text: "Don't Allow", style: "cancel", onPress: () => resolve(false) },
                        { text: "Allow", style: "default", onPress: () => resolve(true) },
                    ],
                );
            });
        };

        const granted = await requestPermission();
        if (granted) {
            setLocationOn(true);
        } else {
            // Denied -> silently keep OFF!
            setLocationOn(false);
        }
    };

    const confirmLogout = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: () => onLogout?.() },
        ]);
    };

    const confirmDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
            "Delete Account",
            "This will permanently delete your account and all data. This action cannot be undone.\n\nAre you absolutely sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Forever",
                    style: "destructive",
                    onPress: () =>
                        // second confirm — Play Store best practice for destructive actions
                        Alert.alert("Confirm Deletion", "Last chance — delete account permanently?", [
                            { text: "Keep My Account", style: "cancel" },
                            { text: "Yes, Delete", style: "destructive", onPress: () => onDeleteAccount?.() },
                        ]),
                },
            ],
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            {/* curved header backdrop */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -ms(110),
                    left: -ms(40),
                    right: -ms(40),
                    height: ms(240) + insets.top,
                    backgroundColor: ACCENT,
                    borderBottomLeftRadius: ms(90),
                    borderBottomRightRadius: ms(90),
                }}
            />

            {/* header */}
            <View
                style={{
                    paddingTop: insets.top + ms(10),
                    paddingHorizontal: ms(20),
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <Pressable
                    onPress={onBack}
                    accessibilityLabel="Go back"
                    style={{
                        width: ms(42),
                        height: ms(42),
                        borderRadius: ms(15),
                        backgroundColor: "#FFFFFF",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 3,
                    }}
                >
                    <Ionicons name="arrow-back" size={ms(19)} color={INK} />
                </Pressable>
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK }}>Account Settings</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: insets.bottom + ms(30) }}
            >
                {/* Security */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: MUTED, marginTop: ms(20), marginBottom: ms(8), marginLeft: 4 }}>
                    SECURITY
                </Text>
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: ms(6) }}>
                    <Row
                        icon="lock-closed-outline"
                        label="Change Password"
                        desc="Update login password & security PIN"
                        onPress={onChangePassword}
                        last
                    />
                </View>

                {/* Preferences */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: MUTED, marginTop: ms(20), marginBottom: ms(8), marginLeft: 4 }}>
                    PREFERENCES
                </Text>
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: ms(6) }}>
                    <Row
                        icon="globe-outline"
                        label="Language"
                        desc="App interface display language"
                        chipBg={BLUE_SOFT}
                        chipColor={BLUE}
                        right={
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(12.5), color: MUTED }}>English</Text>
                                <View style={{ width: ms(26), height: ms(26), borderRadius: ms(9), backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER }}>
                                    <Ionicons name="chevron-forward" size={ms(13)} color={INK} />
                                </View>
                            </View>
                        }
                        onPress={() => { }}
                    />
                    <Row
                        icon="moon-outline"
                        label="Dark Mode"
                        desc="Switch between light and dark color themes"
                        chipBg="#EEF2FF"
                        chipColor="#4F46E5"
                        right={<Toggle value={darkMode} onToggle={() => { Haptics.selectionAsync(); setDarkMode((v) => !v); }} />}
                        onPress={() => setDarkMode((v) => !v)}
                    />
                    <Row
                        icon="notifications-outline"
                        label="Notification Settings"
                        desc="Trip updates, route alerts & reminders"
                        onPress={onNotificationSettings}
                    />
                    <Row
                        icon="location-outline"
                        label="Location Permission"
                        desc="GPS live tracking and trip sharing"
                        chipBg="#DCFCE7"
                        chipColor={GREEN}
                        right={<Toggle value={locationOn} onToggle={toggleLocationPermission} />}
                        onPress={toggleLocationPermission}
                    />
                    <Row
                        icon="phone-portrait-outline"
                        label="App Permissions"
                        desc="Manage camera, storage & phone access"
                        onPress={() => Linking.openSettings()}
                        last
                    />
                </View>

                {/* Support */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: MUTED, marginTop: ms(20), marginBottom: ms(8), marginLeft: 4 }}>
                    SUPPORT
                </Text>
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: ms(6) }}>
                    <Row
                        icon="help-circle-outline"
                        label="Help & Support"
                        desc="FAQs, user guides and support chat"
                        onPress={() => { }}
                    />
                    <Row
                        icon="call-outline"
                        label="Contact School"
                        desc="Direct hotline to school administration"
                        chipBg="#DCFCE7"
                        chipColor={GREEN}
                        onPress={() => Linking.openURL("tel:+911204567890")}
                        last
                    />
                </View>

                {/* Legal */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: MUTED, marginTop: ms(20), marginBottom: ms(8), marginLeft: 4 }}>
                    LEGAL
                </Text>
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: ms(6) }}>
                    <Row
                        icon="document-text-outline"
                        label="Privacy Policy"
                        desc="How your data is protected & stored"
                        onPress={() => { }}
                    />
                    <Row
                        icon="reader-outline"
                        label="Terms & Conditions"
                        desc="Service terms and usage policies"
                        onPress={() => { }}
                    />
                    <Row
                        icon="information-circle-outline"
                        label="About App"
                        desc="Version details and release notes"
                        right={
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(12.5), color: MUTED }}>v1.0.0</Text>
                                <View style={{ width: ms(26), height: ms(26), borderRadius: ms(9), backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER }}>
                                    <Ionicons name="chevron-forward" size={ms(13)} color={INK} />
                                </View>
                            </View>
                        }
                        onPress={() => { }}
                        last
                    />
                </View>

                {/* Danger zone */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: RED, marginTop: ms(20), marginBottom: ms(8), marginLeft: 4 }}>
                    DANGER ZONE
                </Text>
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: "#FECACA", padding: ms(6) }}>
                    <Row
                        icon="log-out-outline"
                        label="Logout"
                        desc="Sign out of your driver session"
                        color={RED}
                        chipBg={RED_SOFT}
                        chipColor={RED}
                        onPress={confirmLogout}
                    />
                    <Row
                        icon="trash-outline"
                        label="Delete Account"
                        desc="Permanently delete your account & data"
                        color={RED}
                        chipBg={RED_SOFT}
                        chipColor={RED}
                        onPress={confirmDelete}
                        last
                    />
                </View>

                <Text style={{ textAlign: "center", fontFamily: FONT.regular, fontSize: ms(11), color: FAINT, marginTop: ms(20) }}>
                    BusTracker · Version 1.0.0
                </Text>
            </ScrollView>
        </View>
    );
}
