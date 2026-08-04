/* ============================================================================
   REPORTS — School Admin
   Copy to: src/components/schooldashboard/pages/reports.tsx
   Daily & monthly trip reports with simple bar visualization — dummy data.
   ========================================================================== */

import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    ACCENT, ACCENT_DEEP, ACCENT_SOFT, BLUE, BLUE_SOFT, BORDER, CARD_BG, Card, Chip, FAINT, FONT, GREEN,
    GREEN_SOFT, INK, MUTED, ORANGE, ORANGE_SOFT, PAGE_BG, PageHeader, Press, PURPLE, PURPLE_SOFT, SectionTitle,
    StatCard, SkeletonItem, ms, useSchoolData,
} from "../common";

const DAILY = [
    { day: "Mon", trips: 14 }, { day: "Tue", trips: 14 }, { day: "Wed", trips: 12 },
    { day: "Thu", trips: 14 }, { day: "Fri", trips: 13 }, { day: "Sat", trips: 8 }, { day: "Sun", trips: 0 },
];

const MONTHLY = [
    { m: "Sep", trips: 296 }, { m: "Oct", trips: 312 }, { m: "Nov", trips: 288 },
    { m: "Dec", trips: 214 }, { m: "Jan", trips: 324 },
];

export default function ReportsPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const { buses, isLoading } = useSchoolData();
    const [mode, setMode] = useState<"daily" | "monthly">("daily");

    const data = mode === "daily" ? DAILY.map((d) => ({ label: d.day, v: d.trips })) : MONTHLY.map((d) => ({ label: d.m, v: d.trips }));
    const max = Math.max(...data.map((d) => d.v), 1);

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Reports" subtitle="Trips & performance" onBack={onBack} topInset={insets.top}
                right={
                    <Press onPress={() => Alert.alert("Export ready", "Your report has been prepared as a PDF.")} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: INK, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8) }}>
                        <Ionicons name="download" size={ms(13)} color={ACCENT} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: "#FFFFFF" }}>Export</Text>
                    </Press>
                } />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                {/* Summary stats */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ms(10) }}>
                    <StatCard icon="today" label="Today's Trips" value="14" color={BLUE} soft={BLUE_SOFT} />
                    <StatCard icon="calendar" label="This Month" value="324" color={GREEN} soft={GREEN_SOFT} />
                    <StatCard icon="arrow-up-circle" label="Today's Pickups" value="164" color={ORANGE} soft={ORANGE_SOFT} />
                    <StatCard icon="arrow-down-circle" label="Today's Drop-offs" value="158" color={PURPLE} soft={PURPLE_SOFT} />
                </View>

                {/* Toggle */}
                <SectionTitle icon="bar-chart" title="Trip Report" right={
                    <View style={{ flexDirection: "row", backgroundColor: CARD_BG, borderRadius: 999, borderWidth: 1, borderColor: BORDER, padding: 3 }}>
                        {(["daily", "monthly"] as const).map((m) => (
                            <Press key={m} onPress={() => setMode(m)} style={{ backgroundColor: mode === m ? ACCENT : "transparent", borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(6) }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: mode === m ? INK : MUTED }}>{m === "daily" ? "Daily" : "Monthly"}</Text>
                            </Press>
                        ))}
                    </View>
                } />

                {/* Bar chart (pure views) */}
                <Card>
                    <View style={{ flexDirection: "row", alignItems: "flex-end", height: ms(140), gap: ms(8) }}>
                        {data.map((d) => (
                            <View key={d.label} style={{ flex: 1, alignItems: "center", gap: 5 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9.5), color: MUTED }}>{d.v}</Text>
                                <View style={{ width: "68%", height: Math.max((d.v / max) * ms(96), 4), borderRadius: ms(7), backgroundColor: d.v === max ? ACCENT : ACCENT_SOFT, borderWidth: 1, borderColor: d.v === max ? ACCENT_DEEP + "40" : "transparent" }} />
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(10), color: FAINT }}>{d.label}</Text>
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Per-bus performance */}
                <SectionTitle icon="bus" title="Per-Bus Trips (This Month)" />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(12), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                            <SkeletonItem height={ms(34)} width={ms(34)} borderRadius={ms(12)} />
                            <View style={{ flex: 1 }}>
                                <SkeletonItem height={ms(13)} width="40%" />
                                <SkeletonItem height={ms(6)} width="100%" borderRadius={999} style={{ marginTop: 5 }} />
                            </View>
                            <SkeletonItem height={ms(24)} width={ms(50)} borderRadius={999} />
                        </View>
                    )) : buses.map((b, i) => {
                        const trips = [68, 72, 55, 74, 20][i] ?? 40;
                        return (
                            <View key={b.id} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(12), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                                <View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: b.color + "1A", alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="bus" size={ms(15)} color={b.color} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>{b.number}</Text>
                                    <View style={{ height: ms(6), borderRadius: 999, backgroundColor: PAGE_BG, overflow: "hidden", marginTop: 5 }}>
                                        <View style={{ width: `${(trips / 74) * 100}%`, height: "100%", borderRadius: 999, backgroundColor: b.color }} />
                                    </View>
                                </View>
                                <Chip text={`${trips} trips`} color={INK} soft={PAGE_BG} />
                            </View>
                        );
                    })}
                </Card>
            </ScrollView>
        </View>
    );
}
