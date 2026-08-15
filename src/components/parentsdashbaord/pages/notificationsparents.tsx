/* ============================================================================
   PARENT PORTAL — NOTIFICATION CENTER
   Copy to: src/components/parentsdashbaord/pages/notificationsparents.tsx
   ========================================================================== */

import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Chip, FONT, Press, VIDEOS, VideoHero, ms, useParentData, useTheme } from "../common";

type Filter = "All" | "Bus" | "School" | "Billing";

export default function NotificationsParentsPage() {
    const { INK, MUTED, FAINT, BORDER, CARD_BG, PAGE_BG, ACCENT, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, BLUE, BLUE_SOFT, ORANGE, ORANGE_SOFT, RED, RED_SOFT, PURPLE, PURPLE_SOFT, isDark } = useTheme();
    const [filter, setFilter] = useState<Filter>("All");
    const { notifications } = useParentData();

    const toneColors: Record<string, { color: string; soft: string }> = {
        green: { color: GREEN, soft: GREEN_SOFT },
        blue: { color: BLUE, soft: BLUE_SOFT },
        orange: { color: ORANGE, soft: ORANGE_SOFT },
        red: { color: RED, soft: RED_SOFT },
        purple: { color: PURPLE, soft: PURPLE_SOFT },
        accent: { color: ACCENT_DEEP, soft: ACCENT_SOFT },
    };

    const busTones = ["green", "blue", "orange"];
    const filtered = notifications.filter((n) => {
        if (filter === "All") return true;
        if (filter === "Bus") return busTones.includes(n.tone) && n.icon !== "megaphone";
        if (filter === "School") return n.tone === "purple" || n.icon === "megaphone" || n.icon === "school";
        return n.tone === "accent" || n.icon === "card";
    });

    const unreadCount = notifications.filter((n) => n.unread).length;

    return (
        <ScrollView style={{ flex: 1, backgroundColor: PAGE_BG }} contentContainerStyle={{ padding: ms(16), paddingBottom: ms(110) }} showsVerticalScrollIndicator={false}>
            {/* Video hero with overlay text */}
            <VideoHero
                source={VIDEOS.smartBus}
                height={150}
                title="Notification Center"
                subtitle={`${unreadCount} new updates about ${"Aarav"}'s bus today`}
                badge={<Chip text={`${unreadCount} New`} color={ACCENT_DEEP} soft={ACCENT_SOFT} />}
            />

            {/* Filters */}
            <View style={{ flexDirection: "row", gap: ms(8), marginTop: ms(14), marginBottom: ms(4) }}>
                {(["All", "Bus", "School", "Billing"] as Filter[]).map((f) => {
                    const active = filter === f;
                    return (
                        <Press key={f} onPress={() => setFilter(f)} style={{
                            flex: 1, alignItems: "center", paddingVertical: ms(9), borderRadius: ms(13),
                            backgroundColor: active ? ACCENT : CARD_BG,
                            borderWidth: 1, borderColor: active ? ACCENT : BORDER,
                        }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: active ? "#111827" : MUTED }}>{f}</Text>
                        </Press>
                    );
                })}
            </View>

            {/* Notification cards */}
            <View style={{ gap: ms(10), marginTop: ms(10) }}>
                {filtered.map((n) => {
                    const tone = toneColors[n.tone];
                    return (
                        <View key={n.id} style={{
                            flexDirection: "row", gap: ms(12), backgroundColor: CARD_BG,
                            borderRadius: ms(18), borderWidth: 1,
                            borderColor: n.unread ? tone.color + "55" : BORDER,
                            padding: ms(13),
                        }}>
                            <View style={{ width: ms(42), height: ms(42), borderRadius: ms(15), backgroundColor: tone.soft, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={n.icon} size={ms(19)} color={tone.color} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: ms(6) }}>
                                    <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT.display, fontSize: ms(13.5), color: INK }}>{n.title}</Text>
                                    {n.unread ? <View style={{ width: ms(8), height: ms(8), borderRadius: 99, backgroundColor: tone.color }} /> : null}
                                </View>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED, marginTop: 2, lineHeight: ms(17) }}>{n.body}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT, marginTop: ms(5) }}>{n.time}</Text>
                            </View>
                        </View>
                    );
                })}
                {filtered.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: ms(40), gap: ms(8) }}>
                        <Ionicons name="notifications-off" size={ms(30)} color={FAINT} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: MUTED }}>No notifications in this category</Text>
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
}
