/* ============================================================================
   BUS ASSIGNMENT — School Admin
   Copy to: src/components/schooldashboard/pages/busassignment.tsx
   Flow: Select Bus → Select Student → Assign. Bus change from same page.
   ========================================================================== */

import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    ACCENT, ACCENT_DEEP, ACCENT_SOFT, BLUE, BLUE_SOFT, BORDER, BUSES, CARD_BG, Chip, FONT, GREEN, GREEN_SOFT,
    INK, MUTED, ORANGE, ORANGE_SOFT, PAGE_BG, PageHeader, Press, RED, RED_SOFT, STUDENTS, SectionTitle,
    busById, busStatusColor, ms,
} from "../common";

export default function BusAssignmentPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const [busId, setBusId] = useState<string | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);

    const assign = () => {
        const bus = busById(busId);
        const stu = STUDENTS.find((s) => s.id === studentId);
        Alert.alert("Assigned", `${stu?.name} assigned to ${bus?.number} (${bus?.vehicleNumber}).\n\nDemo UI only — connect backend to save.`, [
            { text: "OK", onPress: () => { setBusId(null); setStudentId(null); } },
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Bus Assignment" subtitle="Assign or change a student's bus" onBack={onBack} topInset={insets.top} />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(120) }} showsVerticalScrollIndicator={false}>
                {/* Step 1 — bus */}
                <SectionTitle icon="bus" title="Step 1 · Select Bus" right={busId ? <Ionicons name="checkmark-circle" size={ms(18)} color={GREEN} /> : undefined} />
                <View style={{ gap: ms(8) }}>
                    {BUSES.map((b) => {
                        const active = busId === b.id;
                        const st = busStatusColor(b.status);
                        return (
                            <Press key={b.id} onPress={() => setBusId(b.id)} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), backgroundColor: active ? ACCENT_SOFT : CARD_BG, borderRadius: ms(16), borderWidth: 1.5, borderColor: active ? ACCENT : BORDER, padding: ms(12) }}>
                                <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: b.color + "1A", alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="bus" size={ms(17)} color={b.color} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>{b.number} · {b.vehicleNumber}</Text>
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{b.route} · {b.students} students on board</Text>
                                </View>
                                {active ? <Ionicons name="checkmark-circle" size={ms(20)} color={ACCENT_DEEP} /> : <Chip text={b.status} color={st.color} soft={st.soft} />}
                            </Press>
                        );
                    })}
                </View>

                {/* Step 2 — student */}
                <SectionTitle icon="school" title="Step 2 · Select Student" right={studentId ? <Ionicons name="checkmark-circle" size={ms(18)} color={GREEN} /> : undefined} />
                <View style={{ gap: ms(8) }}>
                    {STUDENTS.map((s) => {
                        const active = studentId === s.id;
                        const cur = busById(s.busId);
                        return (
                            <Press key={s.id} onPress={() => setStudentId(s.id)} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), backgroundColor: active ? ACCENT_SOFT : CARD_BG, borderRadius: ms(16), borderWidth: 1.5, borderColor: active ? ACCENT : BORDER, padding: ms(12) }}>
                                <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(13), color: ORANGE }}>{s.name.charAt(0)}</Text>
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>{s.name}</Text>
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>Class {s.klass}-{s.section} · current: {cur ? cur.number : "no bus"}</Text>
                                </View>
                                {active ? <Ionicons name="checkmark-circle" size={ms(20)} color={ACCENT_DEEP} /> : <Chip text={cur ? cur.number : "No Bus"} color={cur ? BLUE : RED} soft={cur ? BLUE_SOFT : RED_SOFT} />}
                            </Press>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Sticky assign bar */}
            <View style={{ position: "absolute", left: ms(16), right: ms(16), bottom: Math.max(insets.bottom, ms(14)) }}>
                <Press disabled={!busId || !studentId} onPress={assign} style={{ height: ms(56), borderRadius: ms(19), backgroundColor: busId && studentId ? ACCENT : "#E5E7EB", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
                    <Ionicons name="git-compare" size={ms(18)} color={busId && studentId ? INK : "#9CA3AF"} />
                    <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: busId && studentId ? INK : "#9CA3AF" }}>
                        {busId && studentId ? "Assign Student to Bus" : "Select a bus & student"}
                    </Text>
                </Press>
            </View>
        </View>
    );
}
