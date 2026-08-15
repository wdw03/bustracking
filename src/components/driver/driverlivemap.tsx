import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text, View, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Map, Camera, Marker } from "@maplibre/maplibre-react-native";
import { publishDriverLocation, subscribeToLiveGPS, LocationData } from "../../services/locationService";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const ms = (value: number) => Math.round((Dimensions.get("window").width / 390) * value);

export default function DriverLiveMap({ active, schoolName, busNumber, busId }: { active: boolean; schoolName: string; busNumber?: string; busId?: string }) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [fix, setFix] = useState<LocationData | null>(null);
    const [mapZoom, setMapZoom] = useState(15.2);
    const [followMap, setFollowMap] = useState(true);
    const [manualCenter, setManualCenter] = useState<[number, number] | null>(null);
    const [hasFix, setHasFix] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [heading, setHeading] = useState(0);
    const target = useRef<[number, number] | null>(null);
    const previousFix = useRef<[number, number] | null>(null);
    const lastMapZoom = useRef(15.2);
    const zoomGestureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasInitialFix = useRef(false);
    const autoZoomEnabled = useRef(true);

    // Keep the small driver map feeling like a navigation app: a slower bus is
    // shown closer up, while a faster bus gets a wider view of the road ahead.
    const zoomForSpeed = (speed: number) => {
        if (speed >= 45) return 13.8;
        if (speed >= 30) return 14.2;
        if (speed >= 15) return 14.7;
        if (speed >= 5) return 15.2;
        return 15.8;
    };

    useEffect(() => {
        if (!active) {
            setFollowMap(true);
            setManualCenter(null);
            setFix(null);
            setGpsError(null);
            setPosition(null);
            target.current = null;
            setHasFix(false);
            setHeading(0);
            previousFix.current = null;
            hasInitialFix.current = false;
            autoZoomEnabled.current = true;
            return;
        }
        setFollowMap(true);
        setManualCenter(null);
        setHasFix(false);
        setGpsError(null);
        setPosition(null);
        target.current = null;
        setHeading(0);
        previousFix.current = null;
        hasInitialFix.current = false;
        autoZoomEnabled.current = true;
        let unsubscribe: (() => void) | undefined;
        let disposed = false;
        subscribeToLiveGPS((location) => {
            target.current = [location.longitude, location.latitude];
            setFix(location);
            setHasFix(true);
            const nextPoint: [number, number] = [location.longitude, location.latitude];
            if (previousFix.current) {
                const dx = nextPoint[0] - previousFix.current[0];
                const dy = nextPoint[1] - previousFix.current[1];
                if (Math.abs(dx) + Math.abs(dy) > 0.000001) setHeading((Math.atan2(dx, dy) * 180) / Math.PI);
            }
            previousFix.current = nextPoint;
            if (autoZoomEnabled.current) {
                const desiredZoom = zoomForSpeed(Number(location.speed ?? 0));
                setMapZoom((currentZoom) => {
                    // Ease zoom changes so GPS updates never cause a jarring jump.
                    const nextZoom = currentZoom + (desiredZoom - currentZoom) * 0.16;
                    lastMapZoom.current = nextZoom;
                    return Math.abs(nextZoom - currentZoom) < 0.01 ? currentZoom : nextZoom;
                });
            }
            if (!hasInitialFix.current) {
                hasInitialFix.current = true;
                setPosition([location.longitude, location.latitude]);
            }
            if (busId) publishDriverLocation(busId, location);
        }, () => setGpsError("Real GPS unavailable. Check device location settings.")).then((stop) => { unsubscribe = stop; if (disposed) stop(); }).catch(() => setGpsError("Real GPS unavailable. Check device location settings."));
        const animation = setInterval(() => {
            if (!target.current) return;
            setPosition((current) => [
                (current ?? target.current!)[0] + (target.current![0] - (current ?? target.current!)[0]) * 0.18,
                (current ?? target.current!)[1] + (target.current![1] - (current ?? target.current!)[1]) * 0.18,
            ]);
        }, 50);
        return () => { disposed = true; unsubscribe?.(); clearInterval(animation); };
    }, [active, busId]);

    useEffect(() => () => {
        if (zoomGestureTimer.current) clearTimeout(zoomGestureTimer.current);
    }, []);

    return (
        <View style={{ height: ms(235), borderRadius: ms(22), overflow: "hidden", borderWidth: 1, borderColor: "#D1D5DB", marginTop: ms(14), backgroundColor: "#E5E7EB" }}>
            <Map
                style={{ flex: 1 }} mapStyle={MAP_STYLE} logo={false} attribution={false}
                dragPan touchZoom doubleTapZoom doubleTapHoldZoom
                onRegionDidChange={(event) => {
                    if (!event.nativeEvent.userInteraction) return;
                    const nextZoom = event.nativeEvent.zoom;
                    const zoomChanged = Math.abs(nextZoom - lastMapZoom.current) > 0.02;
                    setMapZoom(nextZoom);
                    lastMapZoom.current = nextZoom;
                    if (zoomChanged) {
                        // A pinch/scroll is an intentional override. Live
                        // centering continues, but automatic speed zoom waits
                        // until the driver taps the locate button again.
                        autoZoomEnabled.current = false;
                        if (zoomGestureTimer.current) clearTimeout(zoomGestureTimer.current);
                        zoomGestureTimer.current = setTimeout(() => { zoomGestureTimer.current = null; }, 450);
                    }
                }}
            >
                {position ? <Camera center={followMap ? position : (manualCenter ?? position)} zoom={mapZoom} duration={240} easing="ease" /> : null}
                {active && hasFix && position ? <Marker id="driver-live" lngLat={position}>
                    <View style={{ alignItems: "center" }}>
                        <View style={{ transform: [{ rotate: `${heading}deg` }] }}>
                            <View style={{ width: ms(44), height: ms(44), borderRadius: ms(16), backgroundColor: "#FFD500", borderWidth: 3, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 7 }}>
                                <Ionicons name="bus" size={ms(21)} color="#111827" />
                            </View>
                        </View>
                        <View style={{ marginTop: 3, backgroundColor: "#111827", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ fontSize: ms(9), fontWeight: "700", color: "#FFD500" }}>{busNumber ?? "LIVE BUS"}</Text>
                        </View>
                    </View>
                </Marker> : null}
            </Map>
            <View style={{ position: "absolute", top: ms(10), left: ms(10), right: ms(10), backgroundColor: "rgba(255,255,255,0.94)", borderRadius: ms(14), paddingHorizontal: ms(11), paddingVertical: ms(8), flexDirection: "row", alignItems: "center", gap: ms(8) }}>
                <View style={{ width: ms(9), height: ms(9), borderRadius: 99, backgroundColor: active ? "#16A34A" : "#9CA3AF" }} />
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: ms(11.5), fontWeight: "700", color: "#111827" }}>{active ? "Live location sharing" : "Location sharing is off"}</Text>
                    <Text numberOfLines={1} style={{ fontSize: ms(9.5), color: gpsError ? "#DC2626" : "#6B7280" }}>{active ? (gpsError ? gpsError : hasFix ? `${schoolName} · ${fix?.speed ?? 0} km/h · GPS ${fix?.accuracy ? `${fix.accuracy}m` : "live"}` : `${schoolName} · Waiting for real GPS fix...`) : "Start sharing to show your moving bus"}</Text>
                </View>
                <Ionicons name={active ? "navigate" : "location-outline"} size={ms(17)} color={active ? "#16A34A" : "#6B7280"} />
            </View>
            <View style={{ position: "absolute", right: ms(10), top: ms(62), gap: ms(7) }}>
                <Pressable onPress={() => { autoZoomEnabled.current = false; setMapZoom((value) => { const next = Math.min(19, value + 1); lastMapZoom.current = next; return next; }); }} style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#D1D5DB", elevation: 4 }}>
                    <Ionicons name="add" size={ms(17)} color="#111827" />
                </Pressable>
                <Pressable onPress={() => { autoZoomEnabled.current = false; setMapZoom((value) => { const next = Math.max(9, value - 1); lastMapZoom.current = next; return next; }); }} style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#D1D5DB", elevation: 4 }}>
                    <Ionicons name="remove" size={ms(17)} color="#111827" />
                </Pressable>
                <Pressable onPress={() => { autoZoomEnabled.current = true; setManualCenter(null); setFollowMap(true); setMapZoom((value) => { const next = Math.max(value, 15.2); lastMapZoom.current = next; return next; }); }} style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: followMap ? "#FFD500" : "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#D1D5DB", elevation: 4 }}>
                    <Ionicons name="locate" size={ms(17)} color="#111827" />
                </Pressable>
            </View>
            {active ? <View style={{ position: "absolute", left: ms(10), right: ms(10), bottom: ms(10), backgroundColor: "rgba(17,24,39,0.92)", borderRadius: ms(16), padding: ms(10), flexDirection: "row", alignItems: "center", gap: ms(8) }}>
                <View style={{ flex: 1 }}><Text style={{ fontSize: ms(9), color: "#9CA3AF", fontWeight: "600" }}>CURRENT SPEED</Text><Text style={{ fontSize: ms(16), color: "#FFFFFF", fontWeight: "800", marginTop: 2 }}>{fix?.speed ?? 0} km/h</Text></View>
                <View style={{ width: 1, height: ms(28), backgroundColor: "#374151" }} />
                <View style={{ flex: 1 }}><Text style={{ fontSize: ms(9), color: "#9CA3AF", fontWeight: "600" }}>GPS ACCURACY</Text><Text style={{ fontSize: ms(13), color: "#FFFFFF", fontWeight: "700", marginTop: 3 }}>{fix?.accuracy ? `${fix.accuracy} m` : "Locking…"}</Text></View>
                <View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: "#FFD500", alignItems: "center", justifyContent: "center" }}><Ionicons name="locate" size={ms(18)} color="#111827" /></View>
            </View> : null}
        </View>
    );
}
