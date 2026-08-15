/* ============================================================================
   PARENT PORTAL — LIVE TRACKING (WEB FALLBACK)
   MapLibre native module is not available on web — show the same subscription
   gate + a live status panel instead of the map. Native app shows real map.
   ========================================================================== */

import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BUS, Chip, FONT, Press, STUDENT, busStatusTone, ms, useParentData, useSubscription, useTheme } from "../common";
import TrackingGate from "./trackinggate";
import { getLiveGPSCoordinates, requestDeviceLocationPermission } from "../../../services/locationService";

export default function LiveTrackingParentsPage({ onBuy }: { onBuy: () => void }) {
    const t = useTheme();
    const { INK, MUTED, BORDER, CARD_BG, PAGE_BG, ACCENT, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, BLUE, BLUE_SOFT, isDark } = t;
    const { canTrack } = useSubscription();
    const { homeAddress, setHomeAddress, setHomeCoordinate } = useParentData();

    const [etaMin, setEtaMin] = useState(12);
    const [locating, setLocating] = useState(false);
    useEffect(() => {
        if (!canTrack) return;
        const id = setInterval(() => setEtaMin((e) => (e <= 1 ? 12 : e - 1)), 4000);
        return () => clearInterval(id);
    }, [canTrack]);

    const useCurrentLocation = async () => {
        setLocating(true);
        try {
            const allowed = await requestDeviceLocationPermission();
            if (!allowed) { Alert.alert("Location permission needed", "Allow browser location access to save your exact home stop."); return; }
            const location = await getLiveGPSCoordinates();
            setHomeCoordinate([location.longitude, location.latitude]);
            setHomeAddress(`Current location (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`);
        } finally {
            setLocating(false);
        }
    };

    /* ── PAYWALL: no subscription → no map ── */
    if (!canTrack) return <TrackingGate onBuy={onBuy} />;

    const st = busStatusTone(BUS.status, t);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: PAGE_BG }} contentContainerStyle={{ padding: ms(16), paddingBottom: ms(110) }} showsVerticalScrollIndicator={false}>
            {/* Map placeholder (real MapLibre map renders on Android/iOS) */}
            <View style={{ height: ms(300), borderRadius: ms(24), borderWidth: 1, borderColor: BORDER, backgroundColor: isDark ? "#0B1220" : "#EEF2F7", alignItems: "center", justifyContent: "center", gap: ms(10), overflow: "hidden" }}>
                <View style={{ width: ms(64), height: ms(64), borderRadius: ms(22), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="map" size={ms(30)} color={ACCENT_DEEP} />
                </View>
                <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>Live route overview</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED, textAlign: "center", paddingHorizontal: ms(24) }}>
                    {BUS.number} is moving live. Your saved home stop is shown below so arrival alerts stay accurate.
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: ms(6), backgroundColor: isDark ? "#111827" : "#FFFFFF", borderRadius: ms(12), paddingVertical: ms(8), paddingHorizontal: ms(10), maxWidth: "92%" }}>
                    <Ionicons name="home" size={ms(15)} color={BLUE} />
                    <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(10.5), color: INK }}>{homeAddress}</Text>
                </View>
                <Press onPress={useCurrentLocation} disabled={locating} style={{ flexDirection: "row", alignItems: "center", gap: ms(6), backgroundColor: BLUE_SOFT, borderRadius: ms(12), paddingVertical: ms(8), paddingHorizontal: ms(12), opacity: locating ? 0.6 : 1 }}>
                    <Ionicons name="location" size={ms(15)} color={BLUE} />
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: BLUE }}>{locating ? "Locating…" : "Use current location"}</Text>
                </Press>
                <View style={{ position: "absolute", top: ms(12), left: ms(12) }}>
                    <Chip text={`Live · GPS ${BUS.gps}`} color={GREEN} soft={GREEN_SOFT} />
                </View>
            </View>

            {/* ETA + driver card (same as native bottom card) */}
            <View style={{ marginTop: ms(14), backgroundColor: CARD_BG, borderRadius: ms(22), borderWidth: 1, borderColor: BORDER, padding: ms(14) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                    <View style={{ width: ms(48), height: ms(48), borderRadius: ms(16), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="time" size={ms(22)} color={ACCENT_DEEP} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(17), color: INK }}>Arriving in ~{etaMin} min</Text>
                        <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 1 }}>
                            {STUDENT.name} · {BUS.number} · {BUS.vehicleNumber}
                        </Text>
                    </View>
                    <Chip text={`${BUS.speed} km/h`} color={BLUE} soft={BLUE_SOFT} />
                </View>

                <View style={{ height: 1, backgroundColor: BORDER, marginVertical: ms(12) }} />

                <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                    <View style={{ width: ms(42), height: ms(42), borderRadius: 99, backgroundColor: isDark ? "#1F2937" : "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="person" size={ms(19)} color={MUTED} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ fontFamily: FONT.display, fontSize: ms(13.5), color: INK }}>{BUS.driver}</Text>
                        <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{BUS.driverExp} · {BUS.route}</Text>
                    </View>
                    <Press onPress={() => Alert.alert("Call Driver", BUS.driverPhone)} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GREEN, borderRadius: ms(13), paddingVertical: ms(9), paddingHorizontal: ms(13) }}>
                        <Ionicons name="call" size={ms(14)} color="#FFFFFF" />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#FFFFFF" }}>Call</Text>
                    </Press>
                </View>
            </View>

            {/* Status chip row */}
            <View style={{ marginTop: ms(12), flexDirection: "row", gap: ms(8), flexWrap: "wrap" }}>
                <Chip text={BUS.status} color={st.color} soft={st.soft} />
                <Chip text={`Route 7`} color={BLUE} soft={BLUE_SOFT} />
                <Chip text={`Updated ${BUS.lastUpdated}`} color={MUTED} soft={isDark ? "#1F2937" : "#F3F4F6"} />
            </View>
        </ScrollView>
    );
}
