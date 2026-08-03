/* ============================================================================
   LIVE BUS TRACKING — Full-screen Map UI (School Admin)
   Copy to: src/components/schooldashboard/pages/livetracking.tsx

   MAP PROVIDER: MapLibre + OpenFreeMap (OpenStreetMap tiles) — FREE, no key.

   INSTALL (one time):
     npx expo install @maplibre/maplibre-react-native
   Then add to app.json plugins:  "@maplibre/maplibre-react-native"
   and rebuild the dev client:    eas build --platform android --profile development

   UI ONLY — dummy markers/speed/ETA. No GPS/backend logic. Ready to wire
   your driver locationService later (replace DUMMY coords with live data).

   Includes:
   - Full-screen MapLibre map (OpenFreeMap "liberty" style)
   - 5 colored bus markers + 1 school marker
   - Search bar, route filter, fullscreen btn, my-location, zoom +/-
   - Bottom sliding glass panel with bus info + actions
   - Tap bus → full Bus Detail screen (per-bus dedicated live view)
   ========================================================================== */

import React, { useMemo, useRef, useState } from "react";
import { Alert, Linking, ScrollView, Text, TextInput, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Map, Camera, Marker,
} from "@maplibre/maplibre-react-native";

import {
    ACCENT, ACCENT_DEEP, ACCENT_SOFT, BLUE, BLUE_SOFT, BORDER, BUSES, CARD_BG, Card, Chip, DBus, FAINT, FONT,
    GREEN, GREEN_SOFT, INK, InfoRow, MUTED, ORANGE, ORANGE_SOFT, PAGE_BG, PageHeader, Press, PURPLE, PURPLE_SOFT,
    RED, RED_SOFT, SectionTitle, busStatusColor, driverForBus, ms,
} from "../common";

/* Free vector style — OpenFreeMap (OpenStreetMap data), no API key */
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/* Dummy coordinates around Noida Sector 62 (school) */
const SCHOOL_COORD: [number, number] = [77.364, 28.6271];
const BUS_COORDS: Record<string, [number, number]> = {
    b1: [77.372, 28.632],
    b2: [77.354, 28.6205],
    b3: [77.3645, 28.6268], // parked at school
    b4: [77.381, 28.6175],
    b5: [77.346, 28.635],
};

export default function LiveTrackingPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<DBus | null>(null);
    const [detail, setDetail] = useState<DBus | null>(null);
    const [query, setQuery] = useState("");
    const [zoom, setZoom] = useState(13.2);
    const [center, setCenter] = useState<[number, number]>(SCHOOL_COORD);
    const camKey = useRef(0);

    const act = (label: string) => Alert.alert(label, "Demo UI only — connect your backend/GPS later.", [{ text: "OK" }]);

    const visibleBuses = useMemo(
        () => BUSES.filter((b) => b.number.toLowerCase().includes(query.toLowerCase()) || b.vehicleNumber.toLowerCase().includes(query.toLowerCase())),
        [query]
    );

    const focusBus = (b: DBus) => {
        setSelected(b);
        setCenter(BUS_COORDS[b.id] ?? SCHOOL_COORD);
        setZoom(14.5);
        camKey.current += 1;
    };

    /* ── FULL BUS DETAIL SCREEN ── */
    if (detail) {
        const st = busStatusColor(detail.status);
        const drv = driverForBus(detail.id);
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title={detail.number} subtitle={`${detail.vehicleNumber} · ${detail.route}`} onBack={() => setDetail(null)} topInset={insets.top}
                    right={<Chip text={detail.gps === "Online" ? "GPS Online" : "GPS Offline"} color={detail.gps === "Online" ? GREEN : RED} soft={detail.gps === "Online" ? GREEN_SOFT : RED_SOFT} />} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                    {/* Mini live map for THIS bus only */}
                    <View style={{ height: ms(190), borderRadius: ms(20), overflow: "hidden", borderWidth: 1, borderColor: BORDER, marginBottom: ms(14) }}>
                        <Map style={{ flex: 1 }} mapStyle={MAP_STYLE} logo={false} attribution={false}>
                            <Camera center={BUS_COORDS[detail.id] ?? SCHOOL_COORD} zoom={14.6} duration={0} />
                            <Marker id={`det-${detail.id}`} lngLat={BUS_COORDS[detail.id] ?? SCHOOL_COORD}>
                                <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: detail.color, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFFFFF" }}>
                                    <Ionicons name="bus" size={ms(18)} color="#FFFFFF" />
                                </View>
                            </Marker>
                        </Map>
                    </View>

                    {/* Live stats grid */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ms(10) }}>
                        {(
                            [
                                { icon: "speedometer", label: "Current Speed", value: `${detail.speed} km/h`, color: BLUE, soft: BLUE_SOFT },
                                { icon: "battery-half", label: "Battery", value: `${detail.battery}%`, color: GREEN, soft: GREEN_SOFT },
                                { icon: "people", label: "Students Present", value: `${detail.students - 2}/${detail.students}`, color: ORANGE, soft: ORANGE_SOFT },
                                { icon: "flag", label: "Remaining Stops", value: "4", color: PURPLE, soft: PURPLE_SOFT },
                                { icon: "checkmark-done", label: "Pickup Completed", value: "8 stops", color: GREEN, soft: GREEN_SOFT },
                                { icon: "time", label: "Last Updated", value: detail.lastUpdated, color: ACCENT_DEEP, soft: ACCENT_SOFT },
                            ] as const
                        ).map((s) => (
                            <View key={s.label} style={{ flexBasis: "48%", flexGrow: 1, backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, padding: ms(12), flexDirection: "row", alignItems: "center", gap: 9 }}>
                                <View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: s.soft, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name={s.icon} size={ms(16)} color={s.color} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>{s.value}</Text>
                                    <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }}>{s.label}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <SectionTitle icon="person" title="Crew" />
                    <Card>
                        <InfoRow icon="person" label="Driver" value={`${drv?.name ?? "Unassigned"} · ${drv?.phone ?? ""}`} color={GREEN} soft={GREEN_SOFT} />
                        <InfoRow icon="person-add" label="Helper" value={`${detail.helper} · ${detail.helperPhone}`} color={BLUE} soft={BLUE_SOFT} />
                        <InfoRow icon="location" label="Current Location" value={detail.location} color={RED} soft={RED_SOFT} />
                        <InfoRow icon="hardware-chip" label="Engine · GPS" value={`${detail.status === "Running" ? "Engine ON" : "Engine OFF"} · GPS ${detail.gps}`} color={PURPLE} soft={PURPLE_SOFT} />
                    </Card>

                    {/* Action buttons */}
                    <View style={{ flexDirection: "row", gap: ms(10), marginTop: ms(16) }}>
                        <Press onPress={() => drv && Linking.openURL(`tel:${drv.phone.replace(/\s/g, "")}`)} style={{ flex: 1, height: ms(52), borderRadius: ms(17), backgroundColor: INK, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }}>
                            <Ionicons name="call" size={ms(16)} color={ACCENT} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: "#FFFFFF" }}>Contact Driver</Text>
                        </Press>
                        <Press onPress={() => act("Navigation")} style={{ flex: 1, height: ms(52), borderRadius: ms(17), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }}>
                            <Ionicons name="navigate" size={ms(16)} color={INK} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>Navigate</Text>
                        </Press>
                    </View>
                    <Press onPress={() => act("EMERGENCY alert sent to driver & parents")} style={{ height: ms(52), borderRadius: ms(17), backgroundColor: RED_SOFT, borderWidth: 1.5, borderColor: "#FECACA", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, marginTop: ms(10) }}>
                        <Ionicons name="alert-circle" size={ms(17)} color={RED} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: RED }}>Emergency</Text>
                    </Press>
                </ScrollView>
            </View>
        );
    }

    /* ── FULL-SCREEN MAP ── */
    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <Map style={{ flex: 1 }} mapStyle={MAP_STYLE} logo={false} attribution={false}>
                <Camera key={camKey.current} center={center} zoom={zoom} duration={600} />

                {/* School marker */}
                <Marker id="school" lngLat={SCHOOL_COORD}>
                    <View style={{ alignItems: "center" }}>
                        <View style={{ width: ms(42), height: ms(42), borderRadius: ms(15), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6 }}>
                            <Ionicons name="school" size={ms(20)} color={INK} />
                        </View>
                    </View>
                </Marker>

                {/* Bus markers — each bus its own color */}
                {visibleBuses.map((b) => (
                    <Marker key={b.id} id={b.id} lngLat={BUS_COORDS[b.id] ?? SCHOOL_COORD}>
                        <Pressable onPress={() => focusBus(b)} style={{ alignItems: "center" }}>
                            <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: b.color, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: selected?.id === b.id ? ACCENT : "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 5 }}>
                                <Ionicons name="bus" size={ms(16)} color="#FFFFFF" />
                            </View>
                        </Pressable>
                    </Marker>
                ))}
            </Map>

            {/* ── Top bar: back + glass search + filter (never overlaps map controls) ── */}
            <View style={{ position: "absolute", top: insets.top + ms(8), left: ms(14), right: ms(14), flexDirection: "row", gap: ms(8), alignItems: "center" }}>
                <Press onPress={onBack} style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}>
                    <Ionicons name="chevron-back" size={ms(20)} color={INK} />
                </Press>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", height: ms(44), borderRadius: ms(15), backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: ms(12), gap: 7, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}>
                    <Ionicons name="search" size={ms(15)} color={FAINT} />
                    <TextInput value={query} onChangeText={setQuery} placeholder="Search bus number..." placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }} />
                </View>
                <Press onPress={() => act("Route Filter")} style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}>
                    <Ionicons name="filter" size={ms(17)} color={INK} />
                </Press>
            </View>

            {/* ── Right floating controls ── */}
            <View style={{ position: "absolute", right: ms(14), top: insets.top + ms(66), gap: ms(8) }}>
                {(
                    [
                        { icon: "expand" as const, fn: () => act("Fullscreen") },
                        { icon: "add" as const, fn: () => { setZoom((z) => Math.min(z + 1, 18)); camKey.current += 1; } },
                        { icon: "remove" as const, fn: () => { setZoom((z) => Math.max(z - 1, 9)); camKey.current += 1; } },
                        { icon: "locate" as const, fn: () => { setCenter(SCHOOL_COORD); setZoom(13.2); camKey.current += 1; } },
                    ]
                ).map((c, i) => (
                    <Press key={i} onPress={c.fn} style={{ width: ms(42), height: ms(42), borderRadius: ms(14), backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}>
                        <Ionicons name={c.icon} size={ms(18)} color={INK} />
                    </Press>
                ))}
            </View>

            {/* ── Bottom sliding glass panel ── */}
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
                {/* Bus chips scroller */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: ms(14), gap: ms(8), paddingBottom: ms(10) }}>
                    {BUSES.map((b) => (
                        <Press key={b.id} onPress={() => focusBus(b)} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: selected?.id === b.id ? INK : "rgba(255,255,255,0.94)", borderRadius: 999, paddingHorizontal: ms(13), paddingVertical: ms(9), borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.color }} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: selected?.id === b.id ? "#FFFFFF" : INK }}>{b.number}</Text>
                        </Press>
                    ))}
                </ScrollView>

                {/* Info panel */}
                {selected ? (
                    <View style={{ backgroundColor: "rgba(255,255,255,0.97)", borderTopLeftRadius: ms(26), borderTopRightRadius: ms(26), padding: ms(16), paddingBottom: Math.max(insets.bottom, ms(14)), borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: -6 }, elevation: 12 }}>
                        <View style={{ width: ms(40), height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: ms(10) }} />
                        <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                            <View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: selected.color, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="bus" size={ms(20)} color="#FFFFFF" />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.display, fontSize: ms(15.5), color: INK }}>{selected.number} · {selected.vehicleNumber}</Text>
                                <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>
                                    {driverForBus(selected.id)?.name ?? "Unassigned"} · {selected.location}
                                </Text>
                            </View>
                            <Press onPress={() => setSelected(null)} style={{ width: ms(30), height: ms(30), borderRadius: ms(10), backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="close" size={ms(15)} color={MUTED} />
                            </Press>
                        </View>

                        <View style={{ flexDirection: "row", gap: ms(8), marginTop: ms(12) }}>
                            {(
                                [
                                    { icon: "speedometer" as const, label: `${selected.speed} km/h`, color: BLUE, soft: BLUE_SOFT },
                                    { icon: "radio" as const, label: `GPS ${selected.gps}`, color: selected.gps === "Online" ? GREEN : RED, soft: selected.gps === "Online" ? GREEN_SOFT : RED_SOFT },
                                    { icon: "time" as const, label: selected.lastUpdated, color: ORANGE, soft: ORANGE_SOFT },
                                    { icon: "timer" as const, label: "ETA 12 min", color: PURPLE, soft: PURPLE_SOFT },
                                ]
                            ).map((c) => (
                                <View key={c.label} style={{ flex: 1, alignItems: "center", backgroundColor: c.soft, borderRadius: ms(13), paddingVertical: ms(8), gap: 3 }}>
                                    <Ionicons name={c.icon} size={ms(14)} color={c.color} />
                                    <Text numberOfLines={1} style={{ fontFamily: FONT.semibold, fontSize: ms(9.5), color: c.color }}>{c.label}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ flexDirection: "row", gap: ms(10), marginTop: ms(12) }}>
                            <Press onPress={() => { const d = driverForBus(selected.id); if (d) Linking.openURL(`tel:${d.phone.replace(/\s/g, "")}`); }} style={{ flex: 1, height: ms(48), borderRadius: ms(16), backgroundColor: INK, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }}>
                                <Ionicons name="call" size={ms(15)} color={ACCENT} />
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: "#FFFFFF" }}>Contact Driver</Text>
                            </Press>
                            <Press onPress={() => setDetail(selected)} style={{ flex: 1, height: ms(48), borderRadius: ms(16), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }}>
                                <Ionicons name="document-text" size={ms(15)} color={INK} />
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>View Bus Details</Text>
                            </Press>
                        </View>
                    </View>
                ) : (
                    <View style={{ backgroundColor: "rgba(255,255,255,0.95)", borderTopLeftRadius: ms(26), borderTopRightRadius: ms(26), paddingVertical: ms(16), paddingBottom: Math.max(insets.bottom, ms(16)), alignItems: "center" }}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: MUTED }}>Tap a bus marker or chip to see live details</Text>
                    </View>
                )}
            </View>
        </View>
    );
}
