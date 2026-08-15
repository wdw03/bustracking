import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LocationData, publishDriverLocation, subscribeToLiveGPS } from "../../services/locationService";

export default function DriverLiveMap({ active, schoolName, busNumber, busId }: { active: boolean; schoolName: string; busNumber?: string; busId?: string }) {
    const [fix, setFix] = useState<LocationData | null>(null);
    useEffect(() => {
        if (!active) return;
        let mounted = true;
        let stop: (() => void) | undefined;
        subscribeToLiveGPS((location) => {
            if (!mounted) return;
            setFix(location);
            if (busId) publishDriverLocation(busId, location);
        }).then((unsubscribe) => { stop = unsubscribe; if (!mounted) unsubscribe(); }).catch(() => undefined);
        return () => { mounted = false; stop?.(); };
    }, [active, busId]);
    return <View style={{ height: 210, borderRadius: 22, marginTop: 14, backgroundColor: active ? "#E8F3FF" : "#F3F4F6", alignItems: "center", justifyContent: "center", padding: 18 }}>
        <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: active ? "#DBEAFE" : "#E5E7EB", alignItems: "center", justifyContent: "center" }}><Ionicons name="navigate" size={28} color={active ? "#2563EB" : "#9CA3AF"} /></View>
        <Text style={{ marginTop: 10, fontWeight: "700", color: "#111827" }}>{active ? "Live location sharing" : "Location sharing is off"}</Text>
        <Text style={{ marginTop: 5, color: "#6B7280", textAlign: "center" }}>{active ? (fix ? `${busNumber ?? "Bus"} · ${schoolName} · ${fix.speed ?? 0} km/h · GPS live` : `${busNumber ?? "Bus"} · Waiting for real GPS permission...`) : "Start sharing to show your moving bus"}</Text>
    </View>;
}
