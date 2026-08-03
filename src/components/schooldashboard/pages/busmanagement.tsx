/* ============================================================================
   BUS MANAGEMENT — School Admin
   Copy to: src/components/schooldashboard/pages/busmanagement.tsx
   Add / Edit / Delete / Disable / Replace / History / Maintenance — dummy UI.
   ========================================================================== */

import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import {
    ACCENT, ACCENT_DEEP, ACCENT_SOFT, BLUE, BLUE_SOFT, BORDER, BUSES, CARD_BG, Card, Chip, DBus, DRIVERS, FAINT,
    FONT, GREEN, GREEN_SOFT, INK, InfoRow, MUTED, ORANGE, ORANGE_SOFT, PAGE_BG, PageHeader, Press, PURPLE,
    PURPLE_SOFT, RED, RED_SOFT, SectionTitle, busStatusColor, driverForBus, ms,
} from "../common";

const BUS_VIDEO = require("../../../../assets/expo.icon/Assets/smart-bus-animation-gif-download-14231477.mp4");

export default function BusManagementPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<DBus | null>(null);
    const [adding, setAdding] = useState(false);
    const [query, setQuery] = useState("");

    const player = useVideoPlayer(BUS_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });

    const list = BUSES.filter(
        (b) => b.number.toLowerCase().includes(query.toLowerCase()) || b.vehicleNumber.toLowerCase().includes(query.toLowerCase())
    );

    const act = (label: string) =>
        Alert.alert(label, "Demo UI only — connect your backend to perform this action.", [{ text: "OK" }]);

    /* ── ADD / EDIT FORM ── */
    if (adding || (selected && adding)) {
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title={selected ? "Edit Bus" : "Add New Bus"} subtitle="Bus details & assignment" onBack={() => setAdding(false)} topInset={insets.top} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                    {[
                        { icon: "bus" as const, label: "Bus Number", ph: "e.g. BUS-06", val: selected?.number },
                        { icon: "card" as const, label: "Vehicle Number", ph: "e.g. DL01XY9999", val: selected?.vehicleNumber },
                        { icon: "pricetag" as const, label: "Bus Name", ph: "e.g. Yellow Falcon", val: selected?.name },
                    ].map((f) => (
                        <View key={f.label} style={{ marginBottom: ms(12) }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK, marginBottom: 6 }}>{f.label}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(52), gap: 8 }}>
                                <View style={{ width: ms(30), height: ms(30), borderRadius: ms(10), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name={f.icon} size={ms(14)} color={ACCENT_DEEP} />
                                </View>
                                <TextInput defaultValue={f.val} placeholder={f.ph} placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(14), color: INK }} />
                            </View>
                        </View>
                    ))}

                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK, marginBottom: 6 }}>Assign Driver</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: ms(12) }}>
                        {DRIVERS.slice(0, 4).map((d) => (
                            <Press key={d.id} onPress={() => { }} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: CARD_BG, borderWidth: 1.5, borderColor: d.busId === selected?.id ? ACCENT : BORDER, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8) }}>
                                <Ionicons name="person" size={ms(13)} color={d.busId === selected?.id ? ACCENT_DEEP : MUTED} />
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>{d.name}</Text>
                            </Press>
                        ))}
                    </View>

                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK, marginBottom: 6 }}>Assign Helper</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(52), gap: 8, marginBottom: ms(20) }}>
                        <View style={{ width: ms(30), height: ms(30), borderRadius: ms(10), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="person-add" size={ms(14)} color={GREEN} />
                        </View>
                        <TextInput defaultValue={selected?.helper} placeholder="Helper name" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(14), color: INK }} />
                    </View>

                    <Press onPress={() => { act(selected ? "Bus Updated" : "Bus Added"); setAdding(false); }} style={{ height: ms(54), borderRadius: ms(18), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
                        <Ionicons name="checkmark-circle" size={ms(18)} color={INK} />
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>{selected ? "Save Changes" : "Add Bus"}</Text>
                    </Press>
                </ScrollView>
            </View>
        );
    }

    /* ── BUS DETAIL ── */
    if (selected) {
        const st = busStatusColor(selected.status);
        const drv = driverForBus(selected.id);
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title={selected.number} subtitle={selected.vehicleNumber} onBack={() => setSelected(null)} topInset={insets.top}
                    right={<Chip text={selected.status} color={st.color} soft={st.soft} />} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                    <Card>
                        <InfoRow icon="pricetag" label="Bus Name" value={selected.name} />
                        <InfoRow icon="person" label="Driver Name" value={drv?.name ?? "Unassigned"} color={GREEN} soft={GREEN_SOFT} />
                        <InfoRow icon="person-add" label="Helper Name" value={selected.helper} color={BLUE} soft={BLUE_SOFT} />
                        <InfoRow icon="location" label="Current Location" value={selected.location} color={RED} soft={RED_SOFT} />
                        <InfoRow icon="construct" label="Maintenance Status" value={selected.status === "Maintenance" ? "In service center" : "Healthy · Next service in 40 days"} color={PURPLE} soft={PURPLE_SOFT} />
                        <InfoRow icon="time" label="Last Updated" value={selected.lastUpdated} color={ORANGE} soft={ORANGE_SOFT} />
                    </Card>

                    <SectionTitle icon="options" title="Actions" />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ms(10) }}>
                        {(
                            [
                                { icon: "create", label: "Edit Bus", color: BLUE, soft: BLUE_SOFT, fn: () => setAdding(true) },
                                { icon: "swap-horizontal", label: "Replace Bus", color: PURPLE, soft: PURPLE_SOFT, fn: () => act("Replace Bus") },
                                { icon: "pause-circle", label: "Disable Bus", color: ORANGE, soft: ORANGE_SOFT, fn: () => act("Disable Bus") },
                                { icon: "time", label: "Bus History", color: GREEN, soft: GREEN_SOFT, fn: () => act("Bus History") },
                                { icon: "trash", label: "Delete Bus", color: RED, soft: RED_SOFT, fn: () => Alert.alert("Delete Bus?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => act("Bus Deleted") }]) },
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
            <PageHeader title="Bus Management" subtitle={`${BUSES.length} buses in fleet`} onBack={onBack} topInset={insets.top}
                right={
                    <Press onPress={() => { setSelected(null); setAdding(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: INK, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8) }}>
                        <Ionicons name="add" size={ms(15)} color={ACCENT} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#FFFFFF" }}>Add</Text>
                    </Press>
                } />

            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                {/* Hero video card */}
                <View style={{ height: ms(120), borderRadius: ms(20), overflow: "hidden", marginBottom: ms(14), backgroundColor: ACCENT_SOFT }}>
                    <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls={false} contentFit="cover" />
                </View>

                {/* Search */}
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(48), gap: 8, marginBottom: ms(14) }}>
                    <Ionicons name="search" size={ms(16)} color={FAINT} />
                    <TextInput value={query} onChangeText={setQuery} placeholder="Search bus or vehicle number" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13.5), color: INK }} />
                </View>

                {list.map((b) => {
                    const st = busStatusColor(b.status);
                    const drv = driverForBus(b.id);
                    return (
                        <Press key={b.id} onPress={() => setSelected(b)} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10) }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                                <View style={{ width: ms(42), height: ms(42), borderRadius: ms(14), backgroundColor: b.color + "1A", alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="bus" size={ms(20)} color={b.color} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: FONT.display, fontSize: ms(14.5), color: INK }}>{b.number} · {b.name}</Text>
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{b.vehicleNumber}</Text>
                                </View>
                                <Chip text={b.status} color={st.color} soft={st.soft} />
                            </View>
                            <View style={{ flexDirection: "row", marginTop: ms(10), gap: ms(8) }}>
                                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 5 }}>
                                    <Ionicons name="person" size={ms(12)} color={FAINT} />
                                    <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{drv?.name ?? "Unassigned"}</Text>
                                </View>
                                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 5 }}>
                                    <Ionicons name="location" size={ms(12)} color={FAINT} />
                                    <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{b.location}</Text>
                                </View>
                            </View>
                        </Press>
                    );
                })}
            </ScrollView>
        </View>
    );
}
