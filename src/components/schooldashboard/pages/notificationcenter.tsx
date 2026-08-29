import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    ACCENT, ACCENT_DEEP, ACCENT_SOFT, BLUE, BLUE_SOFT, BORDER, CARD_BG, Card, FAINT, FONT, GREEN,
    GREEN_SOFT, INK, MUTED, ORANGE, ORANGE_SOFT, PAGE_BG, PageHeader, Press, PURPLE, PURPLE_SOFT, RED, RED_SOFT,
    SectionTitle, ms, useSchoolData,
} from "../common";
import { notifyBusNearby } from "../../../services/locationService";

const TEMPLATES = [
    { id: "delay", icon: "time" as const, title: "Bus Delay", body: "Your child's bus is running 15 minutes late today. We apologize for the inconvenience.", color: ORANGE, soft: ORANGE_SOFT },
    { id: "driver", icon: "swap-horizontal" as const, title: "Driver Change", body: "A new driver has been assigned to your child's bus starting tomorrow.", color: BLUE, soft: BLUE_SOFT },
    { id: "holiday", icon: "sunny" as const, title: "Holiday Notice", body: "School buses will not operate tomorrow due to a scheduled holiday.", color: GREEN, soft: GREEN_SOFT },
    { id: "custom", icon: "create" as const, title: "Custom Message", body: "", color: PURPLE, soft: PURPLE_SOFT },
];

const AUDIENCES = [
    { id: "all", icon: "people" as const, label: "All Parents & Staff" },
    { id: "parents", icon: "person" as const, label: "Parents Only" },
    { id: "bus", icon: "bus" as const, label: "Specific Bus Route" },
    { id: "driver", icon: "id-card" as const, label: "Drivers Only" },
];

type RecentSend = { id: string; icon: keyof typeof Ionicons.glyphMap; text: string; time: string; color: string; soft: string };

export default function NotificationCenterPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const { buses, sendSchoolNotification } = useSchoolData();
    const [template, setTemplate] = useState(TEMPLATES[0]);
    const [audience, setAudience] = useState("all");
    const [busId, setBusId] = useState<string | null>(null);
    const [message, setMessage] = useState(TEMPLATES[0].body);
    const [isSending, setIsSending] = useState(false);
    const [recentSends, setRecentSends] = useState<RecentSend[]>([
        { id: "n1", icon: "time", text: "Bus Delay → All Parents", time: "Today, 7:42 AM", color: ORANGE, soft: ORANGE_SOFT },
        { id: "n2", icon: "swap-horizontal", text: "Driver Change → Route parents", time: "Yesterday", color: BLUE, soft: BLUE_SOFT },
        { id: "n3", icon: "sunny", text: "Holiday Notice → All Parents", time: "24 Jan", color: GREEN, soft: GREEN_SOFT },
    ]);

    const send = async () => {
        if (!message.trim()) return Alert.alert("Empty message", "Please write a message first.");
        const selectedBus = buses.find((b) => b.id === busId);
        const aud = AUDIENCES.find((a) => a.id === audience)?.label;

        setIsSending(true);
        try {
            await sendSchoolNotification(template.title, message.trim(), audience, busId);
            await notifyBusNearby(template.title, message.trim());

            const newRecent: RecentSend = {
                id: `rec-${Date.now()}`,
                icon: template.icon,
                text: `${template.title} → ${aud}${audience === "bus" && selectedBus ? ` (${selectedBus.number})` : ""}`,
                time: "Just now",
                color: template.color,
                soft: template.soft,
            };
            setRecentSends((prev) => [newRecent, ...prev]);

            Alert.alert("Notification Sent", `Broadcast sent to ${aud}${audience === "bus" && selectedBus ? ` (${selectedBus.number})` : ""} and saved to database.`);
            if (template.id === "custom") setMessage("");
        } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to send notification.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Notification Center" subtitle="Send alerts to parents & drivers" onBack={onBack} topInset={insets.top} />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                {/* Templates */}
                <SectionTitle icon="albums" title="Notification Type" />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ms(10) }}>
                    {TEMPLATES.map((t) => {
                        const active = template.id === t.id;
                        return (
                            <Press key={t.id} onPress={() => { setTemplate(t); setMessage(t.body); }} style={{ flexBasis: "48%", flexGrow: 1, backgroundColor: active ? ACCENT_SOFT : CARD_BG, borderRadius: ms(16), borderWidth: 1.5, borderColor: active ? ACCENT : BORDER, padding: ms(13), flexDirection: "row", alignItems: "center", gap: 9 }}>
                                <View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: t.soft, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name={t.icon} size={ms(16)} color={t.color} />
                                </View>
                                <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>{t.title}</Text>
                                {active ? <Ionicons name="checkmark-circle" size={ms(16)} color={ACCENT_DEEP} /> : null}
                            </Press>
                        );
                    })}
                </View>

                {/* Message */}
                <SectionTitle icon="chatbubble-ellipses" title="Message" />
                <View style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1.5, borderColor: BORDER, padding: ms(12) }}>
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        placeholder="Write your notification message..."
                        placeholderTextColor={FAINT}
                        style={{ minHeight: ms(90), fontFamily: FONT.regular, fontSize: ms(13.5), color: INK, textAlignVertical: "top" }}
                    />
                    <Text style={{ alignSelf: "flex-end", fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT }}>{message.length}/240</Text>
                </View>

                {/* Audience */}
                <SectionTitle icon="megaphone" title="Send To" />
                <View style={{ gap: ms(8) }}>
                    {AUDIENCES.map((a) => {
                        const active = audience === a.id;
                        return (
                            <Press key={a.id} onPress={() => setAudience(a.id)} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), backgroundColor: active ? ACCENT_SOFT : CARD_BG, borderRadius: ms(15), borderWidth: 1.5, borderColor: active ? ACCENT : BORDER, padding: ms(12) }}>
                                <View style={{ width: ms(32), height: ms(32), borderRadius: ms(11), backgroundColor: active ? "#FFFFFF" : PAGE_BG, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name={a.icon} size={ms(15)} color={active ? ACCENT_DEEP : MUTED} />
                                </View>
                                <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>{a.label}</Text>
                                <View style={{ width: ms(20), height: ms(20), borderRadius: ms(10), borderWidth: 2, borderColor: active ? ACCENT_DEEP : BORDER, alignItems: "center", justifyContent: "center" }}>
                                    {active ? <View style={{ width: ms(10), height: ms(10), borderRadius: ms(5), backgroundColor: ACCENT_DEEP }} /> : null}
                                </View>
                            </Press>
                        );
                    })}
                </View>

                {/* Bus picker (when audience = bus) */}
                {audience === "bus" ? (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: ms(10) }}>
                        {buses.length === 0 ? (
                            <Text style={{ fontFamily: FONT.regular, color: MUTED, fontSize: ms(12) }}>No buses registered</Text>
                        ) : buses.map((b) => (
                            <Press key={b.id} onPress={() => setBusId(b.id)} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: busId === b.id ? INK : CARD_BG, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8), borderWidth: 1, borderColor: busId === b.id ? INK : BORDER }}>
                                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: b.color }} />
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: busId === b.id ? "#FFFFFF" : INK }}>{b.number}</Text>
                            </Press>
                        ))}
                    </View>
                ) : null}

                <Press onPress={isSending ? undefined : send} style={{ marginTop: ms(20), height: ms(54), borderRadius: ms(18), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: isSending ? 0.7 : 1 }}>
                    <Ionicons name={isSending ? "hourglass" : "send"} size={ms(16)} color={INK} />
                    <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>{isSending ? "Sending Broadcast..." : "Send Notification"}</Text>
                </Press>

                {/* Recent sends */}
                <SectionTitle icon="time" title="Recently Sent" />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    {recentSends.map((n, i) => (
                        <View key={n.id} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(12), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                            <View style={{ width: ms(32), height: ms(32), borderRadius: ms(11), backgroundColor: n.soft, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={n.icon} size={ms(15)} color={n.color} />
                            </View>
                            <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(12.5), color: INK }}>{n.text}</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT }}>{n.time}</Text>
                        </View>
                    ))}
                </Card>
            </ScrollView>
        </View>
    );
}
