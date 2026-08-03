/* ============================================================================
   DRIVER MANAGEMENT — School Admin
   Copy to: src/components/schooldashboard/pages/drivermanagement.tsx
   Add / Edit / Remove / Suspend / Activate / Bus Change / Call / Live Location.
   ========================================================================== */

import React, { useState } from "react";
import { Alert, Linking, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import {
    ACCENT, ACCENT_DEEP, ACCENT_SOFT, BLUE, BLUE_SOFT, BORDER, CARD_BG, Card, Chip, DDriver, DRIVERS, FAINT, FONT,
    GREEN, GREEN_SOFT, INK, InfoRow, MUTED, ORANGE, ORANGE_SOFT, PAGE_BG, PageHeader, Press, PURPLE, PURPLE_SOFT,
    RED, RED_SOFT, SectionTitle, busById, ms,
} from "../common";

const DRIVER_VIDEO = require("../../../../assets/expo.icon/Assets/driver-navigation-animation-gif-download-9531985.mp4");

export default function DriverManagementPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<DDriver | null>(null);
    const [query, setQuery] = useState("");

    const player = useVideoPlayer(DRIVER_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });

    const act = (label: string) => Alert.alert(label, "Demo UI only — connect your backend to perform this action.", [{ text: "OK" }]);

    const list = DRIVERS.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()) || d.driverId.toLowerCase().includes(query.toLowerCase()));

    /* ── DRIVER DETAIL ── */
    if (selected) {
        const bus = busById(selected.busId);
        const suspended = selected.status === "Suspended";
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title={selected.name} subtitle={selected.driverId} onBack={() => setSelected(null)} topInset={insets.top}
                    right={<Chip text={selected.status} color={suspended ? RED : GREEN} soft={suspended ? RED_SOFT : GREEN_SOFT} />} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                    <Card>
                        <InfoRow icon="call" label="Phone Number" value={selected.phone} color={GREEN} soft={GREEN_SOFT} />
                        <InfoRow icon="card" label="Driving License" value={selected.license} color={BLUE} soft={BLUE_SOFT} />
                        <InfoRow icon="bus" label="Assigned Bus" value={bus ? `${bus.number} · ${bus.vehicleNumber}` : "Not assigned"} />
                        <InfoRow icon="ribbon" label="Experience" value={`${selected.experience} · ${selected.trips} trips · ★ ${selected.rating}`} color={PURPLE} soft={PURPLE_SOFT} />
                    </Card>

                    <SectionTitle icon="options" title="Actions" />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ms(10) }}>
                        {(
                            [
                                { icon: "call", label: "Call Driver", color: GREEN, soft: GREEN_SOFT, fn: () => Linking.openURL(`tel:${selected.phone.replace(/\s/g, "")}`) },
                                { icon: "locate", label: "Live Location", color: BLUE, soft: BLUE_SOFT, fn: () => act("Live Location") },
                                { icon: "create", label: "Edit Driver", color: PURPLE, soft: PURPLE_SOFT, fn: () => act("Edit Driver") },
                                { icon: "swap-horizontal", label: "Change Bus", color: ORANGE, soft: ORANGE_SOFT, fn: () => act("Change Bus") },
                                { icon: "time", label: "Trip History", color: ACCENT_DEEP, soft: ACCENT_SOFT, fn: () => act("Trip History") },
                                suspended
                                    ? { icon: "play-circle" as const, label: "Activate", color: GREEN, soft: GREEN_SOFT, fn: () => act("Driver Activated") }
                                    : { icon: "pause-circle" as const, label: "Suspend", color: ORANGE, soft: ORANGE_SOFT, fn: () => act("Driver Suspended") },
                                { icon: "trash", label: "Remove Driver", color: RED, soft: RED_SOFT, fn: () => Alert.alert("Remove Driver?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => act("Driver Removed") }]) },
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
            <PageHeader title="Driver Management" subtitle={`${DRIVERS.length} drivers`} onBack={onBack} topInset={insets.top}
                right={
                    <Press onPress={() => act("Add Driver")} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: INK, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8) }}>
                        <Ionicons name="add" size={ms(15)} color={ACCENT} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#FFFFFF" }}>Add</Text>
                    </Press>
                } />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                <View style={{ height: ms(120), borderRadius: ms(20), overflow: "hidden", marginBottom: ms(14), backgroundColor: ACCENT_SOFT }}>
                    <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls={false} contentFit="cover" />
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(48), gap: 8, marginBottom: ms(14) }}>
                    <Ionicons name="search" size={ms(16)} color={FAINT} />
                    <TextInput value={query} onChangeText={setQuery} placeholder="Search driver name or ID" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13.5), color: INK }} />
                </View>

                {list.map((d) => {
                    const bus = busById(d.busId);
                    const suspended = d.status === "Suspended";
                    return (
                        <Press key={d.id} onPress={() => setSelected(d)} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(11) }}>
                            <View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="person" size={ms(20)} color={GREEN} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: INK }}>{d.name}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>
                                    {d.driverId} · {bus ? bus.number : "No bus"} · ★ {d.rating}
                                </Text>
                            </View>
                            <Press onPress={() => Linking.openURL(`tel:${d.phone.replace(/\s/g, "")}`)} style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="call" size={ms(15)} color={GREEN} />
                            </Press>
                            <Chip text={d.status} color={suspended ? RED : GREEN} soft={suspended ? RED_SOFT : GREEN_SOFT} />
                        </Press>
                    );
                })}
            </ScrollView>
        </View>
    );
}
