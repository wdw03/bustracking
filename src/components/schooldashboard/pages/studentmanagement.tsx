/* ============================================================================
   STUDENT MANAGEMENT — School Admin
   Copy to: src/components/schooldashboard/pages/studentmanagement.tsx
   Add / Edit / Delete / Transfer / Bus Change / Search / Bulk Import.
   ========================================================================== */

import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import {
    ACCENT, ACCENT_DEEP, ACCENT_SOFT, BLUE, BLUE_SOFT, BORDER, CARD_BG, Card, Chip, DStudent, FAINT, FONT, GREEN,
    GREEN_SOFT, INK, InfoRow, MUTED, ORANGE, ORANGE_SOFT, PAGE_BG, PageHeader, Press, PURPLE, PURPLE_SOFT, RED,
    RED_SOFT, STUDENTS, SectionTitle, busById, ms,
} from "../common";

const KIDS_VIDEO = require("../../../../assets/expo.icon/Assets/diverse-kids-getting-on-school-bus-animation-gif-download-10282491.mp4");

export default function StudentManagementPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<DStudent | null>(null);
    const [query, setQuery] = useState("");

    const player = useVideoPlayer(KIDS_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });
    const act = (label: string) => Alert.alert(label, "Demo UI only — connect your backend to perform this action.", [{ text: "OK" }]);

    const list = STUDENTS.filter(
        (s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.admissionNo.toLowerCase().includes(query.toLowerCase()) || s.klass.toLowerCase() === query.toLowerCase()
    );

    /* ── STUDENT DETAIL ── */
    if (selected) {
        const bus = busById(selected.busId);
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title={selected.name} subtitle={`Class ${selected.klass}-${selected.section} · Roll ${selected.rollNo}`} onBack={() => setSelected(null)} topInset={insets.top} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                    <Card>
                        <InfoRow icon="document-text" label="Admission Number" value={selected.admissionNo} color={BLUE} soft={BLUE_SOFT} />
                        <InfoRow icon="finger-print" label="Student ID" value={selected.studentId} color={PURPLE} soft={PURPLE_SOFT} />
                        <InfoRow icon="male-female" label="Gender · Date of Birth" value={`${selected.gender} · ${selected.dob}`} color={ORANGE} soft={ORANGE_SOFT} />
                        <InfoRow icon="people" label="Parent Name" value={selected.parentName} color={GREEN} soft={GREEN_SOFT} />
                        <InfoRow icon="call" label="Parent Phone" value={selected.parentPhone} color={GREEN} soft={GREEN_SOFT} />
                        <InfoRow icon="bus" label="Assigned Bus" value={bus ? `${bus.number} · ${bus.vehicleNumber} · ${bus.route}` : "Not assigned"} />
                    </Card>

                    <SectionTitle icon="options" title="Actions" />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ms(10) }}>
                        {(
                            [
                                { icon: "create", label: "Edit Student", color: BLUE, soft: BLUE_SOFT, fn: () => act("Edit Student") },
                                { icon: "swap-horizontal", label: "Change Bus", color: ORANGE, soft: ORANGE_SOFT, fn: () => act("Change Bus") },
                                { icon: "arrow-redo", label: "Transfer", color: PURPLE, soft: PURPLE_SOFT, fn: () => act("Transfer Student") },
                                { icon: "trash", label: "Delete", color: RED, soft: RED_SOFT, fn: () => Alert.alert("Delete Student?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => act("Student Deleted") }]) },
                            ] as const
                        ).map((a) => (
                            <Press key={a.label} onPress={a.fn} style={{ flexBasis: "48%", flexGrow: 1, backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, padding: ms(13), flexDirection: "row", alignItems: "center", gap: 9 }}>
                                <View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: a.soft, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name={a.icon} size={ms(16)} color={a.color} />
                                </View>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>{a.label}</Text>
                            </Press>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    }

    /* ── LIST ── */
    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Student Management" subtitle={`${STUDENTS.length * 87} students`} onBack={onBack} topInset={insets.top}
                right={
                    <Press onPress={() => act("Add Student")} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: INK, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8) }}>
                        <Ionicons name="add" size={ms(15)} color={ACCENT} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#FFFFFF" }}>Add</Text>
                    </Press>
                } />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                <View style={{ height: ms(120), borderRadius: ms(20), overflow: "hidden", marginBottom: ms(14), backgroundColor: ACCENT_SOFT }}>
                    <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls={false} contentFit="cover" />
                </View>

                {/* Search + bulk import */}
                <View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(14) }}>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(48), gap: 8 }}>
                        <Ionicons name="search" size={ms(16)} color={FAINT} />
                        <TextInput value={query} onChangeText={setQuery} placeholder="Search name, admission no, class" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }} />
                    </View>
                    <Press onPress={() => act("Bulk Import (Excel)")} style={{ width: ms(48), height: ms(48), borderRadius: ms(16), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#BBF7D0" }}>
                        <Ionicons name="cloud-upload" size={ms(19)} color={GREEN} />
                    </Press>
                </View>

                {list.map((s) => {
                    const bus = busById(s.busId);
                    return (
                        <Press key={s.id} onPress={() => setSelected(s)} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(11) }}>
                            <View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(15), color: ORANGE }}>{s.name.charAt(0)}</Text>
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: INK }}>{s.name}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>
                                    Class {s.klass}-{s.section} · Roll {s.rollNo} · {s.admissionNo}
                                </Text>
                            </View>
                            <Chip text={bus ? bus.number : "No Bus"} color={bus ? BLUE : RED} soft={bus ? BLUE_SOFT : RED_SOFT} />
                        </Press>
                    );
                })}
            </ScrollView>
        </View>
    );
}
