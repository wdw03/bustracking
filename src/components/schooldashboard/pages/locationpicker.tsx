import React, { useEffect, useMemo, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Map, Camera, Marker } from "@maplibre/maplibre-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ACCENT, BLUE, BLUE_SOFT, BORDER, CARD_BG, FAINT, FONT, INK, MUTED, PAGE_BG, Press, ms, useSettings, useTheme } from "../common";
import { getLiveGPSCoordinates, requestDeviceLocationPermission } from "../../../services/locationService";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
type Coordinate = [number, number];
const SUGGESTIONS = [
    { label: "Knowledge Park, Sector 62, Noida", address: "Plot 7, Knowledge Park, Sector 62, Noida, UP 201301", coordinate: [77.364, 28.6271] as Coordinate },
    { label: "Sector 62 Metro Station, Noida", address: "Sector 62 Metro Station, Noida, UP", coordinate: [77.374, 28.620] as Coordinate },
    { label: "Noida City Centre", address: "Noida City Centre, Sector 32, Noida, UP", coordinate: [77.344, 28.574] as Coordinate },
];

export default function SchoolLocationPicker({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const { INK: themeInk, MUTED: themeMuted, FAINT: themeFaint, BORDER: themeBorder, CARD_BG: themeCard, PAGE_BG: themePage } = useTheme();
    const { schoolAddress, schoolCoordinate, setSchoolAddress, setSchoolCoordinate } = useSettings();
    const [coordinate, setCoordinate] = useState<Coordinate>(schoolCoordinate);
    const [address, setAddress] = useState(schoolAddress);
    const [query, setQuery] = useState("");
    const [locating, setLocating] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mapZoom, setMapZoom] = useState(15);
    const [remote, setRemote] = useState<{ label: string; address: string; coordinate: Coordinate }[]>([]);
    const results = useMemo(() => [...SUGGESTIONS.filter((item) => query.trim() && `${item.label} ${item.address}`.toLowerCase().includes(query.toLowerCase())), ...remote].slice(0, 5), [query, remote]);
    useEffect(() => {
        if (query.trim().length < 3) { setRemote([]); return; }
        const id = setTimeout(() => fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query.trim())}`, { headers: { Accept: "application/json" } }).then((res) => res.json()).then((places: { display_name: string; lat: string; lon: string }[]) => setRemote(places.map((place) => ({ label: place.display_name.split(",").slice(0, 2).join(","), address: place.display_name, coordinate: [Number(place.lon), Number(place.lat)] as Coordinate })))).catch(() => setRemote([])), 450);
        return () => clearTimeout(id);
    }, [query]);
    const select = (next: Coordinate, label = "Pinned school location") => { setCoordinate(next); setAddress(`${label} (${next[1].toFixed(5)}, ${next[0].toFixed(5)})`); setQuery(""); setSaved(false); };
    const current = async () => {
        setLocating(true);
        try {
            const allowed = await requestDeviceLocationPermission();
            if (!allowed) { Alert.alert("Location permission needed", "Allow location access to set the school's exact map point."); return; }
            const location = await getLiveGPSCoordinates();
            select([location.longitude, location.latitude], "Current location");
            setMapZoom(16);
        } catch {
            Alert.alert("Unable to get location", "Please check GPS permission and try again.");
        } finally { setLocating(false); }
    };
    const save = () => { setSchoolCoordinate(coordinate); setSchoolAddress(address); setSaved(true); Alert.alert("School location saved", "Live bus maps will use this school point.", [{ text: "Done", onPress: onBack }]); };

    return <View style={{ flex: 1, backgroundColor: themePage }}><Map style={{ flex: 1 }} mapStyle={MAP_STYLE} logo={false} attribution={false} dragPan touchZoom doubleTapZoom doubleTapHoldZoom onPress={(event) => select(event.nativeEvent.lngLat)} onRegionDidChange={(event) => { if (event.nativeEvent.userInteraction) setMapZoom(event.nativeEvent.zoom); }}><Camera center={coordinate} zoom={mapZoom} duration={350} /><Marker id="school-location" lngLat={coordinate}><View style={{ alignItems: "center" }}><View style={{ width: ms(44), height: ms(44), borderRadius: ms(17), backgroundColor: "#7C3AED", borderWidth: 3, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}><Ionicons name="school" size={ms(21)} color="#FFFFFF" /></View><View style={{ marginTop: 3, backgroundColor: "#111827", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}><Text style={{ fontFamily: FONT.semibold, fontSize: ms(9), color: "#FFFFFF" }}>School</Text></View></View></Marker></Map><View style={{ position: "absolute", top: insets.top + ms(10), left: ms(14), right: ms(14), gap: ms(8) }}><View style={{ flexDirection: "row", alignItems: "center", gap: ms(8) }}><Press onPress={onBack} style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: themeCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: themeBorder }}><Ionicons name="chevron-back" size={ms(20)} color={themeInk} /></Press><View style={{ flex: 1, height: ms(44), flexDirection: "row", alignItems: "center", gap: ms(8), backgroundColor: themeCard, borderRadius: ms(15), borderWidth: 1, borderColor: themeBorder, paddingHorizontal: ms(12) }}><Ionicons name="search" size={ms(17)} color={themeFaint} /><TextInput value={query} onChangeText={setQuery} placeholder="Search school address or landmark" placeholderTextColor={themeFaint} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(12.5), color: themeInk }} />{query.length > 0 ? <Press onPress={() => setQuery("")}><Ionicons name="close-circle" size={ms(17)} color={themeFaint} /></Press> : null}</View></View>{results.length > 0 ? <View style={{ backgroundColor: themeCard, borderRadius: ms(16), borderWidth: 1, borderColor: themeBorder, overflow: "hidden" }}>{results.map((item) => <Press key={item.address} onPress={() => select(item.coordinate, item.address)} style={{ flexDirection: "row", alignItems: "center", gap: ms(9), padding: ms(11), borderBottomWidth: 1, borderBottomColor: themeBorder }}><Ionicons name="location-outline" size={ms(17)} color={BLUE} /><Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(11.5), color: themeInk }}>{item.label}</Text></Press>)}</View> : null}</View><View style={{ position: "absolute", right: ms(16), top: insets.top + ms(68), gap: ms(8) }}><Press onPress={current} disabled={locating} style={{ width: ms(46), height: ms(46), borderRadius: ms(16), backgroundColor: themeCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: themeBorder, opacity: locating ? 0.6 : 1 }}><Ionicons name="locate" size={ms(20)} color={BLUE} /></Press><Press onPress={() => setMapZoom((value) => Math.min(19, value + 1))} style={{ width: ms(42), height: ms(42), borderRadius: ms(14), backgroundColor: themeCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: themeBorder }}><Ionicons name="add" size={ms(18)} color={themeInk} /></Press><Press onPress={() => setMapZoom((value) => Math.max(9, value - 1))} style={{ width: ms(42), height: ms(42), borderRadius: ms(14), backgroundColor: themeCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: themeBorder }}><Ionicons name="remove" size={ms(18)} color={themeInk} /></Press></View><View style={{ position: "absolute", bottom: Math.max(insets.bottom, ms(14)), left: ms(14), right: ms(14), backgroundColor: themeCard, borderRadius: ms(22), borderWidth: 1, borderColor: themeBorder, padding: ms(14), shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}><View style={{ flexDirection: "row", alignItems: "center", gap: ms(9) }}><View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: BLUE_SOFT, alignItems: "center", justifyContent: "center" }}><Ionicons name="school" size={ms(17)} color={BLUE} /></View><View style={{ flex: 1 }}><Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: themeInk }}>Set school location</Text><Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: themeMuted, marginTop: 2 }}>{address}</Text></View></View><Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: themeMuted, marginTop: ms(9) }}>Tap anywhere on the map to move the pin.</Text><Press onPress={save} style={{ marginTop: ms(11), height: ms(48), borderRadius: ms(16), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: ms(7) }}><Ionicons name="checkmark-circle" size={ms(18)} color="#111827" /><Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: "#111827" }}>{saved ? "Location saved" : "Save school location"}</Text></Press></View></View>;
}
