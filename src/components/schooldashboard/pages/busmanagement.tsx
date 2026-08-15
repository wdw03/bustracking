/* ============================================================================
   BUS MANAGEMENT — School Admin
   Copy to: src/components/schooldashboard/pages/busmanagement.tsx
   Add / Edit / Delete / Disable / Replace / History / Maintenance — dummy UI.
   ========================================================================== */

import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import {
    Card, Chip, DBus, DRIVERS, FONT,
    InfoRow, PageHeader, Press, SectionTitle, SkeletonItem, busStatusColor, driverForBus, ms, useSchoolData, useTheme
} from "../common";

const BUS_VIDEO = require("../../../../assets/expo.icon/Assets/smart-bus-animation-gif-download-14231477.mp4");

export default function BusManagementPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<DBus | null>(null);
    const [adding, setAdding] = useState(false);
    const [query, setQuery] = useState("");
    const [form, setForm] = useState({ number: "", vehicleNumber: "", name: "", helper: "" });

    React.useEffect(() => {
        const onHardwareBack = () => {
            if (adding) { setAdding(false); return true; }
            if (selected) { setSelected(null); return true; }
            return false;
        };
        const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
        return () => sub.remove();
    }, [adding, selected]);
    const { buses, drivers, addBus, updateBus, removeBus, isLoading } = useSchoolData();
    const { INK, PAGE_BG, CARD_BG, BORDER, ACCENT, ACCENT_DEEP, ACCENT_SOFT, MUTED, FAINT, BLUE, BLUE_SOFT, GREEN, GREEN_SOFT, RED, RED_SOFT, PURPLE, PURPLE_SOFT, ORANGE, ORANGE_SOFT } = useTheme();

    const player = useVideoPlayer(BUS_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });

    const list = buses.filter(
        (b) => b.number.toLowerCase().includes(query.toLowerCase()) || b.vehicleNumber.toLowerCase().includes(query.toLowerCase())
    );

    const act = (label: string) =>
        Alert.alert(label, "The requested bus action has been completed.", [{ text: "OK" }]);

    /* ── ADD / EDIT FORM ── */
    const openAdd = () => { setSelected(null); setForm({ number: "", vehicleNumber: "", name: "", helper: "" }); setAdding(true); };
    const openEdit = () => { if (!selected) return; setForm({ number: selected.number, vehicleNumber: selected.vehicleNumber, name: selected.name, helper: selected.helper }); setAdding(true); };
    const saveBus = () => {
        if (!form.number.trim() || !form.vehicleNumber.trim() || !form.name.trim()) {
            Alert.alert("Missing details", "Bus number, vehicle number and bus name are required.");
            return;
        }
        const bus: DBus = selected ? { ...selected, ...form, number: form.number.trim().toUpperCase(), vehicleNumber: form.vehicleNumber.trim().toUpperCase(), name: form.name.trim(), helper: form.helper.trim() || "Not assigned" } : {
            id: `b-${Date.now()}`, number: form.number.trim().toUpperCase(), vehicleNumber: form.vehicleNumber.trim().toUpperCase(), name: form.name.trim(), helper: form.helper.trim() || "Not assigned", driverId: "", helperPhone: "", status: "Offline", location: "School parking", speed: 0, color: "#0891B2", students: 0, route: "Route to be assigned", lastUpdated: "Just added", battery: 100, gps: "Offline",
        };
        if (selected) updateBus(bus); else addBus(bus);
        setSelected(bus); setAdding(false);
        Alert.alert(selected ? "Bus updated" : "Bus added", `${bus.number} is now available in the dashboard and live map.`);
    };
    const toggleBusAvailability = () => {
        if (!selected) return;
        const nextStatus: DBus["status"] = selected.status === "Disabled" ? "Offline" : "Disabled";
        const nextBus = { ...selected, status: nextStatus };
        updateBus(nextBus);
        setSelected(nextBus);
        Alert.alert(nextStatus === "Disabled" ? "Bus disabled" : "Bus enabled", `${nextBus.number} is now ${nextStatus === "Disabled" ? "hidden from active operations" : "available for operations"}.`);
    };

    if (adding || (selected && adding)) {
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title={selected ? "Edit Bus" : "Add New Bus"} subtitle="Bus details & assignment" onBack={() => setAdding(false)} topInset={insets.top} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                    {[
                        { icon: "bus" as const, label: "Bus Number", ph: "e.g. BUS-06", key: "number" as const },
                        { icon: "card" as const, label: "Vehicle Number", ph: "e.g. DL01XY9999", key: "vehicleNumber" as const },
                        { icon: "pricetag" as const, label: "Bus Name", ph: "e.g. Yellow Falcon", key: "name" as const },
                    ].map((f) => (
                        <View key={f.label} style={{ marginBottom: ms(12) }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK, marginBottom: 6 }}>{f.label}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(52), gap: 8 }}>
                                <View style={{ width: ms(30), height: ms(30), borderRadius: ms(10), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name={f.icon} size={ms(14)} color={ACCENT_DEEP} />
                                </View>
                                <TextInput value={form[f.key]} onChangeText={(value) => setForm((current) => ({ ...current, [f.key]: value }))} placeholder={f.ph} placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(14), color: INK }} />
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
                        <TextInput value={form.helper} onChangeText={(helper) => setForm((current) => ({ ...current, helper }))} placeholder="Helper name" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(14), color: INK }} />
                    </View>

                    <Press onPress={saveBus} style={{ height: ms(54), borderRadius: ms(18), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
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
        const drv = driverForBus(selected.id, drivers);
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

                    <SectionTitle icon="options" title="Manage this bus" right={<Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }}>Quick actions</Text>} />
                    <Card style={{ padding: 0, overflow: "hidden" }}>
                        {[
                            { icon: "create" as const, label: "Edit bus details", hint: "Vehicle, helper and assignment", color: BLUE, soft: BLUE_SOFT, fn: openEdit },
                            { icon: "swap-horizontal" as const, label: "Replace bus", hint: "Change the assigned vehicle", color: PURPLE, soft: PURPLE_SOFT, fn: () => act("Replacement request saved") },
                            { icon: selected.status === "Disabled" ? "play-circle" as const : "pause-circle" as const, label: selected.status === "Disabled" ? "Enable bus" : "Disable bus", hint: selected.status === "Disabled" ? "Return this bus to the fleet" : "Pause operations temporarily", color: ORANGE, soft: ORANGE_SOFT, fn: toggleBusAvailability },
                            { icon: "time" as const, label: "Bus history", hint: "Trips, status and updates", color: GREEN, soft: GREEN_SOFT, fn: () => act("Bus history opened") },
                            { icon: "trash" as const, label: "Delete bus", hint: "Remove this bus permanently", color: RED, soft: RED_SOFT, fn: () => Alert.alert("Delete Bus?", "Students assigned to it will become unassigned.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => { removeBus(selected.id); setSelected(null); } }]) },
                        ].map((a, index) => (
                            <Press key={a.label} onPress={a.fn} style={{ minHeight: ms(58), paddingHorizontal: ms(12), paddingVertical: ms(9), flexDirection: "row", alignItems: "center", gap: ms(10), borderBottomWidth: index === 4 ? 0 : 1, borderBottomColor: BORDER }}>
                                <View style={{ width: ms(34), height: ms(34), borderRadius: ms(11), backgroundColor: a.soft, alignItems: "center", justifyContent: "center" }}><Ionicons name={a.icon} size={ms(16)} color={a.color} /></View>
                                <View style={{ flex: 1, minWidth: 0 }}><Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: a.label === "Delete bus" ? RED : INK }}>{a.label}</Text><Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED, marginTop: 1 }}>{a.hint}</Text></View>
                                <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />
                            </Press>
                        ))}
                    </Card>
                </ScrollView>
            </View>
        );
    }

    /* ── LIST ── */
    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Bus Management" subtitle={`${buses.length} buses in fleet`} onBack={onBack} topInset={insets.top}
                right={
                    <Press onPress={openAdd} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: INK, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8) }}>
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
                <View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(14) }}>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(50), gap: 8 }}>
                        <Ionicons name="search" size={ms(16)} color={FAINT} />
                        <TextInput value={query} onChangeText={setQuery} placeholder="Search bus or vehicle number" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }} />
                    </View>
                    <Press onPress={() => setQuery(query.trim())} style={{ width: ms(50), height: ms(50), borderRadius: ms(16), backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="search" size={ms(17)} color={ACCENT} />
                    </Press>
                </View>

                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <View key={i} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10) }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                                <SkeletonItem height={ms(42)} width={ms(42)} borderRadius={ms(14)} />
                                <View style={{ flex: 1 }}>
                                    <SkeletonItem height={ms(15)} width="50%" />
                                    <SkeletonItem height={ms(12)} width="70%" style={{ marginTop: ms(4) }} />
                                </View>
                                <SkeletonItem height={ms(24)} width={ms(60)} borderRadius={999} />
                            </View>
                            <View style={{ flexDirection: "row", marginTop: ms(10), gap: ms(8) }}>
                                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 5 }}>
                                    <SkeletonItem height={ms(12)} width="80%" />
                                </View>
                                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 5 }}>
                                    <SkeletonItem height={ms(12)} width="80%" />
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    list.map((b) => {
                        const st = busStatusColor(b.status);
                        const drv = driverForBus(b.id, drivers);
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
                    })
                )}
            </ScrollView>
        </View>
    );
}
