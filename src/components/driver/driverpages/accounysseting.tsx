import React, { useState } from "react";
import { Alert, Dimensions, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#FFD60A";
const ACCENT_SOFT = "#FFF6CC";
const ACCENT_DEEP = "#E6BC00";
const INK = "#101010";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER = "#ECEDF0";
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

function ArrowBadge({ color = INK, bg = "#F7F8FA" }: { color?: string; bg?: string }) {
    return (
        <View
            style={{
                width: ms(32),
                height: ms(32),
                borderRadius: 12,
                borderTopLeftRadius: ms(15),
                backgroundColor: bg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
            }}
        >
            <Ionicons name="arrow-forward" size={ms(14)} color={color} />
        </View>
    );
}

function Row({
    icon,
    label,
    color = INK,
    chipBg = ACCENT_SOFT,
    chipColor = ACCENT_DEEP,
    onPress,
    right,
    last,
}: {
    icon: any;
    label: string;
    color?: string;
    chipBg?: string;
    chipColor?: string;
    onPress?: () => void;
    right?: React.ReactNode;
    last?: boolean;
}) {
    return (
        <Pressable
            android_ripple={null}
            onPress={() => {
                Haptics.selectionAsync();
                onPress?.();
            }}
            accessibilityRole="button"
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: ms(13),
                paddingHorizontal: ms(10),
                backgroundColor: pressed ? PAGE_BG : "transparent",
                borderRadius: 16,
                borderBottomWidth: last ? 0 : 1,
                borderBottomColor: "#F3F4F6",
                opacity: pressed ? 0.85 : 1,
            })}
        >
            <View
                style={{
                    width: ms(36),
                    height: ms(36),
                    borderRadius: 13,
                    borderTopLeftRadius: ms(17),
                    backgroundColor: chipBg,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={icon} size={ms(16)} color={chipColor} />
            </View>
            <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(14), color }}>{label}</Text>
            {right ?? <ArrowBadge color={chipColor} bg={chipBg} />}
        </Pressable>
    );
}

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
    return (
        <Pressable
            android_ripple={null}
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
    const [locationOn, setLocationOn] = useState(true);

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
            {/* Curved header backdrop */}
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

            {/* Header */}
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
                    android_ripple={null}
                    onPress={onBack}
                    accessibilityLabel="Go back"
                    style={({ pressed }) => ({
                        width: ms(42),
                        height: ms(42),
                        borderRadius: 16,
                        borderTopLeftRadius: ms(20),
                        borderBottomRightRadius: ms(20),
                        backgroundColor: pressed ? ACCENT_SOFT : "#FFFFFF",
                        borderWidth: 1.5,
                        borderColor: BORDER,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 3,
                        opacity: pressed ? 0.85 : 1,
                    })}
                >
                    <Ionicons name="arrow-back" size={ms(20)} color={INK} />
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
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderTopLeftRadius: 26, borderWidth: 1.5, borderColor: BORDER, padding: ms(6) }}>
                    <Row icon="lock-closed-outline" label="Change Password" onPress={onChangePassword} last />
                </View>

                {/* Preferences */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: MUTED, marginTop: ms(20), marginBottom: ms(8), marginLeft: 4 }}>
                    PREFERENCES
                </Text>
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderTopLeftRadius: 26, borderWidth: 1.5, borderColor: BORDER, padding: ms(6) }}>
                    <Row icon="globe-outline" label="Language" chipBg={BLUE_SOFT} chipColor={BLUE}
                        right={
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(12.5), color: MUTED }}>English</Text>
                                <ArrowBadge color={BLUE} bg={BLUE_SOFT} />
                            </View>
                        }
                        onPress={() => { }}
                    />
                    <Row
                        icon="moon-outline"
                        label="Dark Mode"
                        chipBg="#EEF2FF"
                        chipColor="#4F46E5"
                        right={<Toggle value={darkMode} onToggle={() => { Haptics.selectionAsync(); setDarkMode((v) => !v); }} />}
                        onPress={() => setDarkMode((v) => !v)}
                    />
                    <Row icon="notifications-outline" label="Notification Settings" onPress={onNotificationSettings} />
                    <Row
                        icon="location-outline"
                        label="Location Permission"
                        chipBg="#DCFCE7"
                        chipColor={GREEN}
                        right={<Toggle value={locationOn} onToggle={() => { Haptics.selectionAsync(); setLocationOn((v) => !v); }} />}
                        onPress={() => setLocationOn((v) => !v)}
                    />
                    <Row icon="phone-portrait-outline" label="App Permissions" onPress={() => Linking.openSettings()} last />
                </View>

                {/* Support */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: MUTED, marginTop: ms(20), marginBottom: ms(8), marginLeft: 4 }}>
                    SUPPORT
                </Text>
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderTopLeftRadius: 26, borderWidth: 1.5, borderColor: BORDER, padding: ms(6) }}>
                    <Row icon="help-circle-outline" label="Help & Support" onPress={() => { }} />
                    <Row icon="call-outline" label="Contact School" chipBg="#DCFCE7" chipColor={GREEN} onPress={() => Linking.openURL("tel:+911204567890")} last />
                </View>

                {/* Legal */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: MUTED, marginTop: ms(20), marginBottom: ms(8), marginLeft: 4 }}>
                    LEGAL
                </Text>
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderTopLeftRadius: 26, borderWidth: 1.5, borderColor: BORDER, padding: ms(6) }}>
                    <Row icon="document-text-outline" label="Privacy Policy" onPress={() => { }} />
                    <Row icon="reader-outline" label="Terms & Conditions" onPress={() => { }} />
                    <Row icon="information-circle-outline" label="About App"
                        right={
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(12.5), color: MUTED }}>v1.0.0</Text>
                                <ArrowBadge color={ACCENT_DEEP} bg={ACCENT_SOFT} />
                            </View>
                        }
                        onPress={() => { }}
                        last
                    />
                </View>

                {/* Danger Zone */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: RED, marginTop: ms(20), marginBottom: ms(8), marginLeft: 4 }}>
                    DANGER ZONE
                </Text>
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderTopLeftRadius: 26, borderWidth: 1.5, borderColor: "#FECACA", padding: ms(6) }}>
                    <Row
                        icon="log-out-outline"
                        label="Logout"
                        color={RED}
                        chipBg={RED_SOFT}
                        chipColor={RED}
                        onPress={confirmLogout}
                    />
                    <Row
                        icon="trash-outline"
                        label="Delete Account"
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
