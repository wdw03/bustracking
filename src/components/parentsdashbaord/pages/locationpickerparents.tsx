import React, { useEffect, useMemo, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Map, Camera, Marker } from "@maplibre/maplibre-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONT, Press, ms, useParentData, useTheme } from "../common";
import { getLiveGPSCoordinates, requestDeviceLocationPermission } from "../../../services/locationService";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
type Coordinate = [number, number];
const SUGGESTIONS: { label: string; address: string; coordinate: Coordinate }[] = [
    { label: "Green Valley Apartments, Sector 62", address: "B-204, Green Valley Apartments, Sector 62, Noida", coordinate: [77.379, 28.6178] },
    { label: "Sector 62 Metro Station", address: "Sector 62 Metro Station, Noida", coordinate: [77.374, 28.620] },
    { label: "Fortune School Road, Noida", address: "Fortune School Road, Sector 62, Noida", coordinate: [77.370, 28.623] },
];

export default function LocationPickerParentsPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const { INK, MUTED, FAINT, BORDER, CARD_BG, PAGE_BG, ACCENT, BLUE, BLUE_SOFT, GREEN } = useTheme();
    const { homeAddress, homeCoordinate, setHomeAddress, setHomeCoordinate } = useParentData();
    const [coordinate, setCoordinate] = useState<Coordinate>(homeCoordinate);
    const [address, setAddress] = useState(homeAddress);
    const [query, setQuery] = useState("");
    const [locating, setLocating] = useState(false);
    const [saved, setSaved] = useState(false);
    const [remoteSuggestions, setRemoteSuggestions] = useState<{ label: string; address: string; coordinate: Coordinate }[]>([]);
    const suggestions = useMemo(() => query.trim() ? SUGGESTIONS.filter((item) => `${item.label} ${item.address}`.toLowerCase().includes(query.toLowerCase())) : [], [query]);

    useEffect(() => {
        if (query.trim().length < 3) { setRemoteSuggestions([]); return; }
        const timer = setTimeout(() => {
            fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query.trim())}`, { headers: { Accept: "application/json" } })
                .then((response) => response.json())
                .then((places: { display_name: string; lat: string; lon: string }[]) => setRemoteSuggestions(places.map((place) => ({ label: place.display_name.split(",").slice(0, 2).join(","), address: place.display_name, coordinate: [Number(place.lon), Number(place.lat)] as Coordinate }))))
                .catch(() => setRemoteSuggestions([]));
        }, 450);
        return () => clearTimeout(timer);
    }, [query]);

    const visibleSuggestions = [...suggestions, ...remoteSuggestions.filter((remote) => !suggestions.some((item) => item.address === remote.address))].slice(0, 5);

    const selectCoordinate = (next: Coordinate, label = "Pinned home location") => {
        setCoordinate(next);
        setAddress(`${label} (${next[1].toFixed(5)}, ${next[0].toFixed(5)})`);
        setSaved(false);
    };

    const useCurrentLocation = async () => {
        setLocating(true);
        try {
            const allowed = await requestDeviceLocationPermission();
            if (!allowed) { Alert.alert("Location permission needed", "Allow location access to set your exact home point."); return; }
            const location = await getLiveGPSCoordinates();
            selectCoordinate([location.longitude, location.latitude], "Current location");
            setQuery("");
        } finally { setLocating(false); }
    };

    const save = () => {
        setHomeCoordinate(coordinate);
        setHomeAddress(address);
        setSaved(true);
        Alert.alert("Home location saved", "Bus arrival alerts will use this exact point.", [{ text: "Done", onPress: onBack }]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <Map style={{ flex: 1 }} mapStyle={MAP_STYLE} logo={false} attribution={false} onPress={(event) => selectCoordinate(event.nativeEvent.lngLat)}>
                <Camera center={coordinate} zoom={15} duration={350} />
                <Marker id="selected-home" lngLat={coordinate}>
                    <View style={{ alignItems: "center" }}>
                        <View style={{ width: ms(44), height: ms(44), borderRadius: ms(17), backgroundColor: BLUE, borderWidth: 3, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}><Ionicons name="home" size={ms(21)} color="#FFFFFF" /></View>
                        <View style={{ marginTop: 3, backgroundColor: "#111827", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}><Text style={{ fontFamily: FONT.semibold, fontSize: ms(9), color: "#FFFFFF" }}>Your home</Text></View>
                    </View>
                </Marker>
            </Map>

            <View style={{ position: "absolute", top: insets.top + ms(10), left: ms(14), right: ms(14), gap: ms(8) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: ms(8) }}>
                    <Press onPress={onBack} style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER }}><Ionicons name="chevron-back" size={ms(20)} color={INK} /></Press>
                    <View style={{ flex: 1, height: ms(44), flexDirection: "row", alignItems: "center", gap: ms(8), backgroundColor: CARD_BG, borderRadius: ms(15), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12) }}>
                        <Ionicons name="search" size={ms(17)} color={FAINT} />
                        <TextInput value={query} onChangeText={setQuery} placeholder="Search home, landmark or area" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(12.5), color: INK }} />
                        {query.length > 0 ? <Press onPress={() => setQuery("")}><Ionicons name="close-circle" size={ms(17)} color={FAINT} /></Press> : null}
                    </View>
                </View>
                {visibleSuggestions.length > 0 ? <View style={{ backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
                    {visibleSuggestions.map((item) => <Press key={item.address} onPress={() => { selectCoordinate(item.coordinate, item.address); setQuery(""); }} style={{ flexDirection: "row", alignItems: "center", gap: ms(9), padding: ms(11), borderBottomWidth: 1, borderBottomColor: BORDER }}><Ionicons name="location-outline" size={ms(17)} color={BLUE} /><Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(11.5), color: INK }}>{item.label}</Text></Press>)}
                </View> : null}
            </View>

            <View style={{ position: "absolute", right: ms(16), top: insets.top + ms(68), gap: ms(8) }}>
                <Press onPress={useCurrentLocation} disabled={locating} style={{ width: ms(46), height: ms(46), borderRadius: ms(16), backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER, opacity: locating ? 0.6 : 1 }}><Ionicons name="locate" size={ms(20)} color={BLUE} /></Press>
            </View>

            <View style={{ position: "absolute", bottom: Math.max(insets.bottom, ms(14)), left: ms(14), right: ms(14), backgroundColor: CARD_BG, borderRadius: ms(22), borderWidth: 1, borderColor: BORDER, padding: ms(14), shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: ms(9) }}><View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: BLUE_SOFT, alignItems: "center", justifyContent: "center" }}><Ionicons name="pin" size={ms(17)} color={BLUE} /></View><View style={{ flex: 1 }}><Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: INK }}>Set your child’s home stop</Text><Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED, marginTop: 2 }}>{address}</Text></View></View>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED, marginTop: ms(9) }}>Tap anywhere on the map to move the pin.</Text>
                <Press onPress={save} style={{ marginTop: ms(11), height: ms(48), borderRadius: ms(16), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: ms(7) }}><Ionicons name="checkmark-circle" size={ms(18)} color="#111827" /><Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: "#111827" }}>{saved ? "Location saved" : "Save home location"}</Text></Press>
            </View>
        </View>
    );
}
