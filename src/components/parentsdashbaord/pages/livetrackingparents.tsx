/* ============================================================================
   PARENT PORTAL — LIVE BUS TRACKING (real-time simulated, subscription gated)
   Copy to: src/components/parentsdashbaord/pages/livetrackingparents.tsx

   MAP: MapLibre + OpenFreeMap (free, no API key).
   GATE: Map is ONLY visible while subscription is trial/active.
         Expired parents see TrackingGate ("buy subscription first").
   ========================================================================== */

import React, { useEffect, useRef, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Map, Camera, Marker } from "@maplibre/maplibre-react-native";

import { BUS, Chip, FONT, Press, STUDENT, busStatusTone, ms, useParentData, useSubscription, useTheme } from "../common";
import TrackingGate from "./trackinggate";
import { getLiveGPSCoordinates, notifyBusNearby, requestDeviceLocationPermission, subscribeToDriverLocation } from "../../../services/locationService";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/* Route from school toward parent home (Noida Sector 62 dummy path) */
const SCHOOL_COORD: [number, number] = [77.364, 28.6271];
const ROUTE_PATH: [number, number][] = [
    [77.364, 28.6271], [77.3665, 28.6259], [77.3688, 28.6248], [77.3706, 28.6236],
    [77.3722, 28.6224], [77.3739, 28.6212], [77.3757, 28.6200], [77.3772, 28.6190],
    [77.379, 28.6178],
];

function distanceKm(a: [number, number], b: [number, number]) {
    const toRad = (value: number) => value * Math.PI / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function coordinateAt(progress: number): [number, number] {
    const max = ROUTE_PATH.length - 1;
    const safe = Math.max(0, Math.min(max, progress));
    const index = Math.min(Math.floor(safe), max - 1);
    const fraction = safe - index;
    const start = ROUTE_PATH[index];
    const end = ROUTE_PATH[index + 1];
    return [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
}

export default function LiveTrackingParentsPage({ onBuy }: { onBuy: () => void }) {
    const t = useTheme();
    const { INK, MUTED, BORDER, CARD_BG, PAGE_BG, ACCENT, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, BLUE, BLUE_SOFT, RED, isDark } = t;
    const { canTrack } = useSubscription();
    const { homeAddress, homeCoordinate, setHomeAddress, setHomeCoordinate, addNotification } = useParentData();

    /* Simulated real-time bus movement along the route */
    const [routeProgress, setRouteProgress] = useState(2);
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
    const direction = useRef<1 | -1>(1);
    const liveTarget = useRef<[number, number] | null>(null);
    const liveDisplay = useRef<[number, number] | null>(null);
    const [liveBusCoord, setLiveBusCoord] = useState<[number, number] | null>(null);

    useEffect(() => {
        if (!canTrack) return;
        const id = setInterval(() => {
            setRouteProgress((current) => {
                const max = ROUTE_PATH.length - 1;
                const next = current + direction.current * 0.012;
                if (next >= max) { direction.current = -1; return max - 0.001; }
                if (next <= 0) { direction.current = 1; return 0.001; }
                return next;
            });
        }, 40);
        return () => clearInterval(id);
    }, [canTrack]);

    // When a driver is sharing GPS in this same app session, use that real
    // feed and interpolate between fixes so the parent marker stays smooth.
    useEffect(() => {
        if (!canTrack) return;
        const unsubscribe = subscribeToDriverLocation(BUS.id, (location) => {
            const next: [number, number] = [location.longitude, location.latitude];
            liveTarget.current = next;
            if (!liveDisplay.current) {
                liveDisplay.current = next;
                setLiveBusCoord(next);
            }
        });
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
        return () => { unsubscribe(); clearInterval(animation); };
    }, [canTrack]);

    useEffect(() => () => {
        if (zoomGestureTimer.current) clearTimeout(zoomGestureTimer.current);
    }, []);

    const simulatedBusCoord = coordinateAt(routeProgress);
    const busCoord = liveBusCoord ?? simulatedBusCoord;
    const busDistance = distanceKm(busCoord, homeCoordinate);
    const isBusNearby = busDistance <= 1;

    useEffect(() => {
        if (isBusNearby && !nearAlertSent.current) {
            nearAlertSent.current = true;
            const body = `${BUS.number} is ${busDistance.toFixed(1)} km away. ${STUDENT.name}'s bus will reach your stop shortly.`;
            // Use a fresh id for every new nearby pass so the notification
            // center can show the alert again after the bus leaves and returns.
            addNotification({ id: `bus-near-home-${Date.now()}`, icon: "notifications", title: "Bus is near your home", body, time: "Just now", tone: "green", unread: true });
            notifyBusNearby("Bus is near your home", body).catch(() => undefined);
            Alert.alert("Bus is nearby", body, [{ text: "View map" }]);
        }
        if (!isBusNearby) nearAlertSent.current = false;
    }, [addNotification, busDistance, isBusNearby]);

    /* ── PAYWALL: no subscription → no map ── */
    if (!canTrack) return <TrackingGate onBuy={onBuy} />;

    const remaining = direction.current === 1 ? ROUTE_PATH.length - 1 - routeProgress : routeProgress;
    const etaMin = Math.max(1, Math.ceil(remaining * 1.4));
    const st = busStatusTone(BUS.status, t);

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

    const selectHomeFromMap = (event: { nativeEvent: { lngLat: [number, number] } }) => {
        if (!pickingHome) return;
        const [longitude, latitude] = event.nativeEvent.lngLat;
        const coordinate: [number, number] = [longitude, latitude];
        setHomeCoordinate(coordinate);
        setHomeAddress(`Pinned home location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
        setFocusCoord(coordinate);
        setFollowBus(false);
        setPickingHome(false);
        camKey.current += 1;
    };

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            {/* ── Full screen live map ── */}
            <Map
                style={{ flex: 1 }} mapStyle={MAP_STYLE} logo={false} attribution={false} onLongPress={selectHomeFromMap}
                dragPan touchZoom doubleTapZoom doubleTapHoldZoom
                onRegionDidChange={(event) => {
                    if (event.nativeEvent.userInteraction) {
                        const nextZoom = event.nativeEvent.zoom;
                        const zoomChanged = Math.abs(nextZoom - lastMapZoom.current) > 0.02;
                        setMapZoom(nextZoom);
                        lastMapZoom.current = nextZoom;

                        // A pinch/double-tap zoom must not hide the moving bus.
                        // Keep follow mode for the complete zoom gesture; pause
                        // follow only when the user actually pans the map.
                        if (zoomChanged) {
                            if (zoomGestureTimer.current) clearTimeout(zoomGestureTimer.current);
                            zoomGestureTimer.current = setTimeout(() => { zoomGestureTimer.current = null; }, 450);
                        } else if (!zoomGestureTimer.current) {
                            const nextCenter = event.nativeEvent.center;
                            if (Array.isArray(nextCenter) && nextCenter.length === 2) {
                                setFocusCoord([Number(nextCenter[0]), Number(nextCenter[1])]);
                            }
                            setFollowBus(false);
                        }
                    }
                }}
            >
                <Camera
                    key={`cam-${followBus ? "follow" : "free"}-${camKey.current}`}
                    center={followBus ? busCoord : (focusCoord ?? homeCoordinate)}
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

                {/* Live bus marker */}
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
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED, marginTop: 3 }}>Driver {BUS.driver} · {BUS.speed} km/h</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: GREEN, marginTop: 3 }}>GPS {BUS.gps} · {BUS.status}</Text>
                        </View> : null}
                    </View>
                </Marker>
            </Map>

            {/* ── Top status pill ── */}
            <View style={{ position: "absolute", top: ms(14), left: ms(14), right: ms(14), flexDirection: "row", gap: ms(8) }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: ms(8), backgroundColor: CARD_BG, borderRadius: ms(15), borderWidth: 1, borderColor: BORDER, paddingVertical: ms(9), paddingHorizontal: ms(12) }}>
                    <View style={{ width: ms(9), height: ms(9), borderRadius: 99, backgroundColor: GREEN }} />
                    <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>
                        Live · GPS {BUS.gps} · updated {BUS.lastUpdated}
                    </Text>
                    <Chip text={BUS.status} color={st.color} soft={st.soft} />
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

            {isBusNearby ? <View style={{ position: "absolute", top: pickingHome ? ms(122) : ms(70), left: ms(16), right: ms(16), backgroundColor: GREEN_SOFT, borderColor: GREEN, borderWidth: 1, borderRadius: ms(14), padding: ms(11), flexDirection: "row", alignItems: "center", gap: ms(8) }}>
                <Ionicons name="notifications" size={ms(18)} color={GREEN} />
                <View style={{ flex: 1 }}><Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>Bus is nearby</Text><Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }}>{BUS.number} is {busDistance.toFixed(1)} km from your saved home stop.</Text></View>
                <Press onPress={() => setSelectedBus(true)}><Ionicons name="chevron-forward" size={ms(16)} color={GREEN} /></Press>
            </View> : null}

            {/* ── Bottom ETA + driver card ── */}
            <View style={{ position: "absolute", left: ms(16), right: ms(16), bottom: ms(106) }}>
                <View style={{ backgroundColor: CARD_BG, borderRadius: ms(32), borderWidth: 1, borderColor: BORDER, padding: ms(18), shadowColor: "#000", shadowOpacity: isDark ? 0.35 : 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12 }}>
                    {/* ETA row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(14) }}>
                        <View style={{ width: ms(52), height: ms(52), borderRadius: ms(20), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="time" size={ms(24)} color={ACCENT_DEEP} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: INK }}>
                                {remaining < 0.08 ? "Bus has arrived" : direction.current === 1 ? `Arriving in ~${etaMin} min` : `Returning in ~${etaMin} min`}
                            </Text>
                            <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED, marginTop: 2 }}>
                                {STUDENT.name} · {BUS.number} · {BUS.vehicleNumber}
                            </Text>
                        </View>
                        <Chip text={`${BUS.speed} km/h`} color={BLUE} soft={BLUE_SOFT} />
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
