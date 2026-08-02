import React, { useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
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

type SettingKey = "tripAlerts" | "routeChanges" | "schoolAnnouncements" | "documentReminders" | "sound" | "vibration";

const SETTINGS: { key: SettingKey; icon: any; chipBg: string; chipColor: string; title: string; desc: string }[] = [
    { key: "tripAlerts", icon: "bus-outline", chipBg: ACCENT_SOFT, chipColor: ACCENT_DEEP, title: "Trip Alerts", desc: "Start, stop and delay alerts for your trips" },
    { key: "routeChanges", icon: "map-outline", chipBg: BLUE_SOFT, chipColor: BLUE, title: "Route Changes", desc: "When the school updates your route or stops" },
    { key: "schoolAnnouncements", icon: "megaphone-outline", chipBg: "#FEF3C7", chipColor: "#D97706", title: "School Announcements", desc: "Important notices from your school" },
    { key: "documentReminders", icon: "document-text-outline", chipBg: "#F3E8FF", chipColor: "#7C3AED", title: "Document Reminders", desc: "License and certificate expiry reminders" },
    { key: "sound", icon: "volume-high-outline", chipBg: "#DCFCE7", chipColor: GREEN, title: "Sound", desc: "Play sound for notifications" },
    { key: "vibration", icon: "phone-portrait-outline", chipBg: "#FEE2E2", chipColor: "#DC2626", title: "Vibration", desc: "Vibrate on new notifications" },
];

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

export default function NotificationSettings({ onBack }: { onBack?: () => void }) {
    const insets = useSafeAreaInsets();
    const [values, setValues] = useState<Record<SettingKey, boolean>>({
        tripAlerts: true,
        routeChanges: true,
        schoolAnnouncements: true,
        documentReminders: true,
        sound: true,
        vibration: false,
    });

    const allOn = Object.values(values).every(Boolean);

    const toggle = (key: SettingKey) => {
        Haptics.selectionAsync();
        setValues((v) => ({ ...v, [key]: !v[key] }));
    };

    const toggleAll = () => {
        Haptics.selectionAsync();
        const next = !allOn;
        setValues({
            tripAlerts: next,
            routeChanges: next,
            schoolAnnouncements: next,
            documentReminders: next,
            sound: next,
            vibration: next,
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            {/* Header backdrop */}
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
                <Text style={{ flex: 1, fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK }}>Notifications</Text>
                <Pressable
                    android_ripple={null}
                    onPress={toggleAll}
                    style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        backgroundColor: "#FFFFFF",
                        borderRadius: 999,
                        paddingHorizontal: ms(12),
                        paddingVertical: ms(8),
                        borderWidth: 1.5,
                        borderColor: BORDER,
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 3,
                        opacity: pressed ? 0.85 : 1,
                    })}
                >
                    <Ionicons name={allOn ? "notifications" : "notifications-off"} size={ms(13)} color={allOn ? GREEN : FAINT} />
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>{allOn ? "All On" : "All Off"}</Text>
                </Pressable>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: insets.bottom + ms(30) }}
            >
                <View
                    style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderTopLeftRadius: 28,
                        borderWidth: 1.5,
                        borderColor: BORDER,
                        padding: ms(6),
                        marginTop: ms(18),
                    }}
                >
                    {SETTINGS.map((s, i) => (
                        <View
                            key={s.key}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 12,
                                paddingVertical: ms(13),
                                paddingHorizontal: ms(10),
                                borderBottomWidth: i < SETTINGS.length - 1 ? 1 : 0,
                                borderBottomColor: "#F3F4F6",
                            }}
                        >
                            <View
                                style={{
                                    width: ms(38),
                                    height: ms(38),
                                    borderRadius: 14,
                                    borderTopLeftRadius: ms(18),
                                    backgroundColor: s.chipBg,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name={s.icon} size={ms(17)} color={s.chipColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color: INK }}>{s.title}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 1, lineHeight: ms(16) }}>
                                    {s.desc}
                                </Text>
                            </View>
                            <Toggle value={values[s.key]} onToggle={() => toggle(s.key)} />
                        </View>
                    ))}
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        marginTop: ms(18),
                    }}
                >
                    <Ionicons name="shield-checkmark-outline" size={ms(13)} color={FAINT} />
                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: FAINT }}>
                        You will always receive critical safety alerts
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
