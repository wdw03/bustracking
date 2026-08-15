import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminRecord, SkeletonBlock, StatusBadge, styles } from "./pagekit";

export default function FleetMapCard({ records, title = "Fleet live map", subtitle = "Bus locations and route status" }: { records: AdminRecord[]; title?: string; subtitle?: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const selected = records.find((record) => record.id === selectedId);
  useEffect(() => { const timer = setTimeout(() => setLoading(false), 520); return () => clearTimeout(timer); }, []);
  if (loading) return <View style={map.card}><SkeletonBlock width="42%" height={15} /><SkeletonBlock width="66%" height={10} /><SkeletonBlock width="100%" height={220} radius={18} /></View>;
  const changeZoom = (delta: number) => setZoom((value) => Math.max(0.85, Math.min(1.8, Number((value + delta).toFixed(2)))));
  const selectBus = (id: string) => { setSelectedId((value) => value === id ? null : id); setZoom(1.25); };
  return <View style={map.card}>
    <View style={map.header}><View><Text style={styles.mapTitle}>{title}</Text><Text style={map.subtitle}>{subtitle}</Text></View><View style={map.live}><View style={map.liveDot} /><Text style={map.liveText}>LIVE</Text></View></View>
    <View style={styles.mapPreview}>
      <View style={[map.layer, { transform: [{ scale: zoom }] }]}>
        <View style={map.roadA} /><View style={map.roadB} /><View style={map.roadC} />
        {records.map((record, index) => { const active = selectedId === record.id; const color = record.status === "running" ? "#16A34A" : record.status === "offline" ? "#98A2B3" : "#EA580C"; return <Pressable key={record.id} onPress={() => selectBus(record.id)} style={[styles.mapPin, { left: `${13 + (index % 4) * 23}%`, top: `${38 + (index % 2) * 23}%` }]}><View style={[styles.pinCircle, { backgroundColor: active ? "#172554" : color, transform: [{ scale: active ? 1.16 : 1 }] }]}><Ionicons name="bus" size={16} color="#FFFFFF" /></View><Text style={[styles.pinText, active && map.activeLabel]} numberOfLines={1}>{shortBusName(record.title)}</Text></Pressable>; })}
      </View>
      <View style={map.controls}><Pressable accessibilityLabel="Zoom in" onPress={() => changeZoom(0.15)} style={map.controlButton}><Ionicons name="add" size={17} color="#172033" /></Pressable><Pressable accessibilityLabel="Zoom out" onPress={() => changeZoom(-0.15)} style={map.controlButton}><Ionicons name="remove" size={17} color="#172033" /></Pressable><View style={map.controlDivider} /><Pressable accessibilityLabel="Fit all buses" onPress={() => { setZoom(1); setSelectedId(null); }} style={map.controlButton}><Ionicons name="locate-outline" size={16} color="#2563EB" /></Pressable></View>
      <View style={map.zoomPill}><Text style={map.zoomText}>{Math.round(zoom * 100)}%</Text></View>
      <Text style={styles.mapLegend}>● Running   ● Stopped   ● Offline</Text>
    </View>
    {selected ? <View style={map.selected}><View style={styles.cardTop}><View style={styles.recordIcon}><Ionicons name="bus-outline" size={19} color="#2563EB" /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.cardTitle}>{selected.title}</Text><Text style={styles.cardSubtitle}>{selected.subtitle}</Text></View><StatusBadge status={selected.status} /></View>{selected.fields?.slice(0, 2).map((field) => <Text key={field} style={styles.field}>{field}</Text>)}<Pressable onPress={() => { setSelectedId(null); setZoom(1); }} style={map.clear}><Text style={map.clearText}>Clear selection</Text></Pressable></View> : <Text style={map.hint}>Tap a bus marker to focus it. Use the controls to zoom or fit all buses.</Text>}
  </View>;
}

function shortBusName(title: string) { return title.split(" ").slice(0, 2).join(" "); }

const map = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 18, padding: 13, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 9 },
  subtitle: { color: "#667085", fontFamily: "Inter-Regular", fontSize: 9.5, marginTop: 3 },
  live: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#ECFDF3", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#16A34A" },
  liveText: { color: "#16A34A", fontFamily: "Inter-Bold", fontSize: 9 },
  layer: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  roadA: { position: "absolute", height: 2, left: -20, right: -20, top: 122, backgroundColor: "#FFFFFFAA", transform: [{ rotate: "-10deg" }] },
  roadB: { position: "absolute", width: 2, top: 32, bottom: -20, left: "55%", backgroundColor: "#FFFFFFAA", transform: [{ rotate: "24deg" }] },
  roadC: { position: "absolute", height: 1, left: -20, right: -20, top: 180, backgroundColor: "#FFFFFF77", transform: [{ rotate: "18deg" }] },
  controls: { position: "absolute", right: 10, top: 46, backgroundColor: "#FFFFFFEE", borderRadius: 11, padding: 4, gap: 4, shadowColor: "#172554", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  controlButton: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  controlDivider: { height: 1, backgroundColor: "#E4E7EC", marginHorizontal: 4 },
  zoomPill: { position: "absolute", right: 10, bottom: 11, borderRadius: 99, backgroundColor: "#172554E8", paddingHorizontal: 8, paddingVertical: 5 },
  zoomText: { color: "#FFFFFF", fontFamily: "Inter-Bold", fontSize: 9 },
  activeLabel: { color: "#FFFFFF", backgroundColor: "#172554" },
  selected: { borderRadius: 13, borderWidth: 1, borderColor: "#C7D2FE", backgroundColor: "#FAFCFF", padding: 10, marginTop: 9 },
  clear: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, backgroundColor: "#EEF2FF", marginTop: 9 },
  clearText: { color: "#2563EB", fontFamily: "Inter-Bold", fontSize: 9.5 },
  hint: { color: "#667085", fontFamily: "Inter-Regular", fontSize: 10, marginTop: 8 },
});
