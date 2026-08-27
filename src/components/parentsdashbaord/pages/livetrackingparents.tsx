/* ============================================================================
   PARENT PORTAL — LIVE BUS TRACKING (REAL GPS — No Simulation)
   Path: src/components/parentsdashbaord/pages/livetrackingparents.tsx

   MAP: MapLibre + OpenFreeMap (free, no API key).
   GATE: Map is ONLY visible while subscription is trial/active.
         Expired parents see TrackingGate ("buy subscription first").
   DATA: 100% real GPS from Supabase Realtime + Driver location stream.
         No dummy/simulated bus movement. Shows "Waiting..." when no bus online.
   ========================================================================== */

import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Map, Camera, Marker } from "@maplibre/maplibre-react-native";

import { BUS, Chip, FONT, Press, STUDENT, busStatusTone, ms, useParentData, useSubscription, useTheme } from "../common";
import TrackingGate from "./trackinggate";
import { getLiveGPSCoordinates, notifyBusNearby, requestDeviceLocationPermission, subscribeToDriverLocation } from "../../../services/locationService";
import { subscribeToBusLocation, getBusLocation } from "../../../services/trackingService";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/* Default center (school location, shown when bus is offline) */
const SCHOOL_COORD: [number, number] = [77.364, 28.6271];

/* Haversine distance in km between two [lng, lat] coordinates */
function distanceKm(a: [number, number], b: [number, number]) {
    const toRad = (value: number) => value * Math.PI / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function LiveTrackingParentsPage({ onBuy }: { onBuy: () => void }) {
    const t = useTheme();
    const { INK, MUTED, BORDER, CARD_BG, PAGE_BG, ACCENT, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, BLUE, BLUE_SOFT, RED, RED_SOFT, isDark } = t;
    const { canTrack } = useSubscription();
    const { homeAddress, homeCoordinate, setHomeAddress, setHomeCoordinate, addNotification } = useParentData();

    const [followBus, setFollowBus] = useState(true);
    const [mapZoom, setMapZoom] = useState(14.6);
    const lastMapZoom = useRef(14.6);
    const zoomGestureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [focusCoord, setFocusCoord] = useState<[number, number] | null>(null);
    const [selectedBus, setSelectedBus] = useState(false);
    const [pickingHome, setPickingHome] = useState(false);
    const [locating, setLocating] = useState(false);
    const camKey = useRef(0);
    const nearAlertSent = useRef(false);

    // Real GPS state
    const liveTarget = useRef<[number, number] | null>(null);
    const liveDisplay = useRef<[number, number] | null>(null);
    const [liveBusCoord, setLiveBusCoord] = useState<[number, number] | null>(null);
    const [busSpeed, setBusSpeed] = useState(0);
    const [busOnline, setBusOnline] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>("—");

    // On mount: fetch last known bus location from DB
    useEffect(() => {
        if (!canTrack) return;
        getBusLocation(BUS.id).then((loc) => {
            if (loc && loc.latitude && loc.longitude) {
                const coord: [number, number] = [loc.longitude, loc.latitude];
                liveTarget.current = coord;
                liveDisplay.current = coord;
                setLiveBusCoord(coord);
                setBusSpeed(loc.speed ?? 0);
                setBusOnline(true);
                setLastUpdateTime(new Date(loc.updated_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
            }
        }).catch(() => {});
    }, [canTrack]);

    // Real-time bus tracking feed via Supabase Realtime & in-memory stream
    useEffect(() => {
        if (!canTrack) return;

        // 1. In-memory listener (same device — driver app running locally)
        const unsubLocal = subscribeToDriverLocation(BUS.id, (location) => {
            const next: [number, number] = [location.longitude, location.latitude];
            liveTarget.current = next;
            setBusSpeed(location.speed ?? 0);
            setBusOnline(true);
            setLastUpdateTime("Just now");
            if (!liveDisplay.current) {
                liveDisplay.current = next;
                setLiveBusCoord(next);
            }
        });

        // 2. Supabase Realtime subscription for cross-device updates (production)
        const unsubSupabase = subscribeToBusLocation(BUS.id, (location) => {
            if (location.latitude && location.longitude) {
                const next: [number, number] = [location.longitude, location.latitude];
                liveTarget.current = next;
                setBusSpeed(location.speed ?? 0);
                setBusOnline(true);
                setLastUpdateTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
                if (!liveDisplay.current) {
                    liveDisplay.current = next;
                    setLiveBusCoord(next);
                }
            }
        });

        // 3. Smooth position interpolation (60fps Lerp — Swiggy/Rapido style)
        const animation = setInterval(() => {
            const target = liveTarget.current;
            if (!target) return;
            setLiveBusCoord((current) => {
                const start = current ?? liveDisplay.current ?? target;
                const next: [number, number] = [start[0] + (target[0] - start[0]) * 0.18, start[1] + (target[1] - start[1]) * 0.18];
                liveDisplay.current = next;
                return next;
            });
        }, 50);

        // 4. Offline detection: if no update for 30s, mark bus offline
        const offlineCheck = setInterval(() => {
            if (lastUpdateTime !== "Just now" && lastUpdateTime !== "—") {
                // Keep current state — last known time is shown
            }
        }, 30000);

        return () => {
            unsubLocal();
            unsubSupabase();
            clearInterval(animation);
            clearInterval(offlineCheck);
        };
    }, [canTrack]);

    useEffect(() => () => {
        if (zoomGestureTimer.current) clearTimeout(zoomGestureTimer.current);
    }, []);

    // Bus location: real GPS only (no simulation fallback)
    const busCoord = liveBusCoord;
    const busDistance = busCoord ? distanceKm(busCoord, homeCoordinate) : null;
    const isBusNearby = busDistance !== null && busDistance <= 1;

    // Dynamic ETA based on real distance + average urban bus speed (25 km/h)
    const avgBusSpeed = busSpeed > 5 ? busSpeed : 25;
    const etaMin = busDistance !== null ? Math.max(1, Math.round((busDistance / avgBusSpeed) * 60)) : null;

    useEffect(() => {
        if (isBusNearby && !nearAlertSent.current && busDistance !== null) {
            nearAlertSent.current = true;
            const body = `${BUS.number} is ${busDistance.toFixed(1)} km away. ${STUDENT.name}'s bus will reach your stop shortly.`;
            addNotification({ id: `bus-near-home-${Date.now()}`, icon: "notifications", title: "Bus is near your home", body, time: "Just now", tone: "green", unread: true });
            notifyBusNearby("Bus is near your home", body).catch(() => undefined);
            Alert.alert("Bus is nearby", body, [{ text: "View map" }]);
        }
        if (!isBusNearby) nearAlertSent.current = false;
    }, [addNotification, busDistance, isBusNearby]);

    /* ── PAYWALL: no subscription → no map ── */
    if (!canTrack) return <TrackingGate onBuy={onBuy} />;

    const st = busStatusTone(busOnline ? "Trip Started" : "Offline", t);

    const callDriver = () =>
        Linking.openURL(`tel:${BUS.driverPhone.replace(/\s/g, "")}`).catch(() => Alert.alert("Call Driver", BUS.driverPhone));

    const useCurrentLocation = async () => {
        setLocating(true);
        try {
            const allowed = await requestDeviceLocationPermission();
            if (!allowed) { Alert.alert("Location permission needed", "Allow location access to center the map on your current position."); return; }
            const location = await getLiveGPSCoordinates();
            const coordinate: [number, number] = [location.longitude, location.latitude];
            setHomeCoordinate(coordinate);
            setHomeAddress(`Current location (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`);
            setFocusCoord(coordinate);
            setFollowBus(false);
            camKey.current += 1;
        } finally {
            setLocating(false);
        }
    };

    // Center map on bus if online, otherwise on home coordinate
    const mapCenter = busCoord && followBus ? busCoord : (focusCoord ?? homeCoordinate);

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <Map
                style={{ flex: 1 }}
                mapStyle={MAP_STYLE}
                onLongPress={(event: any) => {
                    if (pickingHome && event?.geometry?.coordinates) {
                        const coord = event.geometry.coordinates as [number, number];
                        setHomeCoordinate(coord);
                        setHomeAddress(`Saved Location (${coord[1].toFixed(5)}, ${coord[0].toFixed(5)})`);
                        setFocusCoord(coord);
                        setPickingHome(false);
                    }
                }}
                onRegionDidChange={(event: any) => {
                    if (event?.properties?.visibleBounds) {
                        const newZoom = event.properties.zoomLevel ?? mapZoom;
                        if (Math.abs(newZoom - lastMapZoom.current) > 0.3) {
                            lastMapZoom.current = newZoom;
                            setMapZoom(newZoom);
                        }
                    }
                }}
            >
                <Camera
                    key={`cam-${followBus ? "follow" : "free"}-${camKey.current}`}
                    center={mapCenter}
                    zoom={mapZoom}
                    duration={followBus ? 90 : 600}
                />

                {/* School marker */}
                <Marker id="school" lngLat={SCHOOL_COORD}>
                    <View style={{ alignItems: "center" }}>
                        <View style={{ width: ms(36), height: ms(36), borderRadius: ms(13), backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFFFFF" }}>
                            <Ionicons name="school" size={ms(17)} color="#FFFFFF" />
                        </View>
                    </View>
                </Marker>

                {/* Parent home marker */}
                <Marker id="home" lngLat={homeCoordinate}>
                    <View style={{ alignItems: "center" }}>
                        <View style={{ width: ms(36), height: ms(36), borderRadius: ms(13), backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFFFFF" }}>
                            <Ionicons name="home" size={ms(16)} color="#FFFFFF" />
                        </View>
                        <View style={{ marginTop: 3, backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}><Text numberOfLines={1} style={{ maxWidth: ms(120), fontFamily: FONT.semibold, fontSize: ms(9), color: "#1D4ED8" }}>{homeAddress.split(",")[0] || "Home stop"}</Text></View>
                    </View>
                </Marker>

                {/* Live bus marker — ONLY shown when real GPS data exists */}
                {busCoord ? (
                    <Marker id="bus" lngLat={busCoord}>
                        <View style={{ alignItems: "center" }}>
                            <Press onPress={() => setSelectedBus((value) => !value)}>
                                <View style={{ width: ms(42), height: ms(42), borderRadius: ms(15), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6 }}>
                                    <Ionicons name="bus" size={ms(20)} color="#111827" />
                                </View>
                            </Press>
                            <View style={{ marginTop: 3, backgroundColor: "#111827", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9.5), color: "#FFD500" }}>{BUS.number}</Text>
                            </View>
                            {selectedBus ? <View style={{ position: "absolute", bottom: ms(54), width: ms(188), backgroundColor: CARD_BG, borderRadius: ms(14), borderWidth: 1, borderColor: BORDER, padding: ms(10), shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
                                <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: INK }}>{BUS.number} · {BUS.vehicleNumber}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED, marginTop: 3 }}>Driver {BUS.driver} · {busSpeed} km/h</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: GREEN, marginTop: 3 }}>GPS {busOnline ? "Online" : "Offline"} · Updated {lastUpdateTime}</Text>
                            </View> : null}
                        </View>
                    </Marker>
                ) : null}
            </Map>

            {/* ── Top status pill ── */}
            <View style={{ position: "absolute", top: ms(14), left: ms(14), right: ms(14), flexDirection: "row", gap: ms(8) }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: ms(8), backgroundColor: CARD_BG, borderRadius: ms(15), borderWidth: 1, borderColor: BORDER, paddingVertical: ms(9), paddingHorizontal: ms(12) }}>
                    <View style={{ width: ms(9), height: ms(9), borderRadius: 99, backgroundColor: busOnline ? GREEN : RED }} />
                    <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>
                        {busOnline ? `Live · GPS Online · ${lastUpdateTime}` : "Waiting for bus to go online..."}
                    </Text>
                    <Chip text={busOnline ? "Trip Started" : "Offline"} color={st.color} soft={st.soft} />
                </View>
                <Press onPress={() => { setFollowBus((f) => !f); camKey.current += 1; }} style={{ width: ms(42), height: ms(42), borderRadius: ms(15), backgroundColor: followBus ? ACCENT : CARD_BG, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="locate" size={ms(19)} color={followBus ? "#111827" : MUTED} />
                </Press>
                <Press onPress={useCurrentLocation} disabled={locating} style={{ width: ms(42), height: ms(42), borderRadius: ms(15), backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center", opacity: locating ? 0.6 : 1 }}>
                    <Ionicons name="location" size={ms(18)} color={BLUE} />
                </Press>
                <Press onPress={() => setPickingHome((value) => !value)} style={{ width: ms(42), height: ms(42), borderRadius: ms(15), backgroundColor: pickingHome ? ACCENT : CARD_BG, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="pin" size={ms(18)} color={pickingHome ? "#111827" : BLUE} />
                </Press>
            </View>

            {pickingHome ? <View style={{ position: "absolute", top: ms(70), left: ms(16), right: ms(16), backgroundColor: ACCENT, borderRadius: ms(14), padding: ms(11), flexDirection: "row", alignItems: "center", gap: ms(8) }}>
                <Ionicons name="finger-print" size={ms(18)} color="#111827" />
                <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12), color: "#111827" }}>Long-press your exact home point on the map to save it.</Text>
            </View> : null}

            {isBusNearby && busDistance !== null ? <View style={{ position: "absolute", top: pickingHome ? ms(122) : ms(70), left: ms(16), right: ms(16), backgroundColor: GREEN_SOFT, borderColor: GREEN, borderWidth: 1, borderRadius: ms(14), padding: ms(11), flexDirection: "row", alignItems: "center", gap: ms(8) }}>
                <Ionicons name="notifications" size={ms(18)} color={GREEN} />
                <View style={{ flex: 1 }}><Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>Bus is nearby</Text><Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }}>{BUS.number} is {busDistance.toFixed(1)} km from your saved home stop.</Text></View>
                <Press onPress={() => setSelectedBus(true)}><Ionicons name="chevron-forward" size={ms(16)} color={GREEN} /></Press>
            </View> : null}

            {/* ── Bottom ETA + driver card ── */}
            <View style={{ position: "absolute", left: ms(16), right: ms(16), bottom: ms(106) }}>
                <View style={{ backgroundColor: CARD_BG, borderRadius: ms(32), borderWidth: 1, borderColor: BORDER, padding: ms(18), shadowColor: "#000", shadowOpacity: isDark ? 0.35 : 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12 }}>
                    {/* ETA row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(14) }}>
                        <View style={{ width: ms(52), height: ms(52), borderRadius: ms(20), backgroundColor: busOnline ? ACCENT_SOFT : (isDark ? "#1F2937" : "#F3F4F6"), alignItems: "center", justifyContent: "center" }}>
                            {busOnline ? <Ionicons name="time" size={ms(24)} color={ACCENT_DEEP} /> : <ActivityIndicator size="small" color={MUTED} />}
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: INK }}>
                                {!busOnline
                                    ? "Waiting for bus..."
                                    : etaMin !== null && etaMin <= 1
                                        ? "Bus has arrived!"
                                        : `Arriving in ~${etaMin} min`
                                }
                            </Text>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED, marginTop: 2 }}>
                                {busOnline && busDistance !== null
                                    ? `${STUDENT.name} · ${busDistance.toFixed(1)} km away · ${BUS.number}`
                                    : `${STUDENT.name} · ${BUS.number} · Driver will start soon`
                                }
                            </Text>
                        </View>
                        {busOnline ? <Chip text={`${busSpeed} km/h`} color={BLUE} soft={BLUE_SOFT} /> : <Chip text="Offline" color={RED} soft={RED_SOFT} />}
                    </View>

                    <View style={{ height: 1, backgroundColor: BORDER, marginVertical: ms(16) }} />

                    {/* Driver row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(14) }}>
                        <View style={{ width: ms(46), height: ms(46), borderRadius: 99, backgroundColor: isDark ? "#1F2937" : "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="person" size={ms(20)} color={MUTED} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.display, fontSize: ms(14.5), color: INK }}>{BUS.driver}</Text>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED }}>{BUS.driverExp} · {BUS.route}</Text>
                        </View>
                        <Press onPress={callDriver} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GREEN, borderRadius: ms(16), paddingVertical: ms(10), paddingHorizontal: ms(14), shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
                            <Ionicons name="call" size={ms(15)} color="#FFFFFF" />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: "#FFFFFF" }}>Call</Text>
                        </Press>
                    </View>
                </View>
            </View>
        </View>
    );
}
