import React from "react";
import { Alert, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Press, FONT, ms, useParentData, useTheme } from "../common";
import { getLiveGPSCoordinates, requestDeviceLocationPermission } from "../../../services/locationService";

export default function LocationPickerParentsPage({ onBack }: { onBack: () => void }) {
    const { INK, MUTED, CARD_BG, PAGE_BG, ACCENT, BLUE, BORDER } = useTheme();
    const { setHomeAddress, setHomeCoordinate } = useParentData();
    const choose = async () => { const allowed = await requestDeviceLocationPermission(); if (!allowed) { Alert.alert("Location permission needed", "Allow browser location access first."); return; } const location = await getLiveGPSCoordinates(); setHomeCoordinate([location.longitude, location.latitude]); setHomeAddress(`Current location (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`); Alert.alert("Home location saved", "Your exact current location is saved.", [{ text: "Done", onPress: onBack }]); };
    return <View style={{ flex: 1, backgroundColor: PAGE_BG, padding: 18, justifyContent: "center" }}><View style={{ backgroundColor: CARD_BG, borderRadius: 24, borderWidth: 1, borderColor: BORDER, padding: 24, alignItems: "center" }}><View style={{ width: 70, height: 70, borderRadius: 24, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" }}><Ionicons name="map" size={32} color={BLUE} /></View><Text style={{ marginTop: 16, fontFamily: FONT.display, fontSize: 19, color: INK, textAlign: "center" }}>Choose your home location</Text><Text style={{ marginTop: 8, fontFamily: FONT.regular, fontSize: 13, color: MUTED, textAlign: "center" }}>Use your browser’s current location to set the exact home stop.</Text><Press onPress={choose} style={{ marginTop: 18, width: "100%", height: 48, borderRadius: 16, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }}><Ionicons name="locate" size={18} color="#111827" /><Text style={{ fontFamily: FONT.display, color: "#111827" }}>Use current location</Text></Press><Press onPress={onBack} style={{ marginTop: 10, padding: 10 }}><Text style={{ fontFamily: FONT.semibold, color: BLUE }}>Back</Text></Press></View></View>;
}
