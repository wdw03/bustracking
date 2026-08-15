/* ============================================================================
   PARENT PORTAL — TRIP HISTORY
   Copy to: src/components/parentsdashbaord/pages/triphistoryparents.tsx
   ========================================================================== */

import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Chip, FONT, TRIPS, VIDEOS, VideoHero, ms, useTheme } from "../common";

export default function TripHistoryParentsPage() {
    const { INK, MUTED, FAINT, BORDER, CARD_BG, PAGE_BG, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, BLUE, BLUE_SOFT, RED, RED_SOFT } = useTheme();

    const statusChip = (status: string) =>
        status === "Completed"
            ? { color: GREEN, soft: GREEN_SOFT }
            : status === "In Progress"
                ? { color: BLUE, soft: BLUE_SOFT }
                : { color: RED, soft: RED_SOFT };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: PAGE_BG }} contentContainerStyle={{ padding: ms(16), paddingBottom: ms(110) }} showsVerticalScrollIndicator={false}>
            {/* Video hero with overlay text */}
            <VideoHero
                source={VIDEOS.route}
                height={150}
                title="Trip History"
                subtitle="Every pickup and drop, recorded for your peace of mind."
            />

            {/* Summary chips */}
            <View style={{ flexDirection: "row", gap: ms(10), marginTop: ms(14) }}>
                {[
                    { label: "This Week", value: "9 trips", color: BLUE, soft: BLUE_SOFT, icon: "calendar" as const },
                    { label: "On Time", value: "96%", color: GREEN, soft: GREEN_SOFT, icon: "checkmark-circle" as const },
                    { label: "Avg Ride", value: "36 min", color: ACCENT_DEEP, soft: ACCENT_SOFT, icon: "time" as const },
                ].map((s) => (
                    <View key={s.label} style={{ flex: 1, backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, padding: ms(12), gap: ms(6) }}>
                        <View style={{ width: ms(30), height: ms(30), borderRadius: ms(11), backgroundColor: s.soft, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name={s.icon} size={ms(15)} color={s.color} />
                        </View>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(15), color: INK }}>{s.value}</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Trip cards */}
            <View style={{ gap: ms(12), marginTop: ms(16) }}>
                {TRIPS.map((trip) => {
                    const chip = statusChip(trip.status);
                    return (
                        <View key={trip.id} style={{ backgroundColor: CARD_BG, borderRadius: ms(20), borderWidth: 1, borderColor: BORDER, padding: ms(14) }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: ms(8) }}>
                                <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: ms(14), color: INK }}>{trip.date}</Text>
                                <Chip text={trip.status} color={chip.color} soft={chip.soft} />
                            </View>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: FAINT, marginTop: 2 }}>{trip.label}</Text>

                            <View style={{ height: 1, backgroundColor: BORDER, marginVertical: ms(11) }} />

                            {/* Timeline */}
                            <View style={{ gap: ms(9) }}>
                                {[
                                    { icon: "sunny" as const, label: "Pickup", value: trip.pickup },
                                    { icon: "school" as const, label: "School Arrival", value: trip.schoolArrival },
                                    { icon: "bus" as const, label: "Return Start", value: trip.returnStart },
                                    { icon: "home" as const, label: "Home Drop", value: trip.homeDrop },
                                ].map((row) => (
                                    <View key={row.label} style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                                        <Ionicons name={row.icon} size={ms(14)} color={MUTED} style={{ width: ms(18) }} />
                                        <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(12), color: MUTED }}>{row.label}</Text>
                                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>{row.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                })}
            </View>

            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: FAINT, textAlign: "center", marginTop: ms(16) }}>
                Showing last 5 trips · Complete history syncs from server
            </Text>
        </ScrollView>
    );
}
