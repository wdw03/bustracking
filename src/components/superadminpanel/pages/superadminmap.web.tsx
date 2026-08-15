import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SuperAdminFleetMap() {
  return <View style={{ minHeight: 230, borderRadius: 18, backgroundColor: "#DCE8E5", borderWidth: 1, borderColor: "#C8D8D4", alignItems: "center", justifyContent: "center", padding: 20 }}><Ionicons name="map-outline" size={32} color="#2563EB" /><Text style={{ color: "#172033", fontFamily: "Inter-Bold", fontSize: 13, marginTop: 9 }}>Live schools and fleet map</Text><Text style={{ color: "#667085", fontFamily: "Inter-Regular", fontSize: 10, textAlign: "center", marginTop: 4 }}>Open the Android/iOS build to interact with the MapLibre map.</Text></View>;
}
