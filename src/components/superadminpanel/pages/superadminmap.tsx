import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Map, Camera, Marker } from "@maplibre/maplibre-react-native";
import { SkeletonBlock } from "./pagekit";

import { supabase } from "../../../services/supabase";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
type Coordinate = [number, number];

type SchoolNode = { id: string; name: string; city: string; coordinate: Coordinate; students: number; parents: number; subscribed: number; buses: number; drivers: number };
type BusNode = { id: string; name: string; schoolId: string; driver: string; status: "Running" | "Stopped" | "Offline"; coordinate: Coordinate; speed: number };

export default function SuperAdminFleetMap() {
  const [loading, setLoading] = useState(true);
  const [liveSchools, setLiveSchools] = useState<SchoolNode[]>([]);
  const [liveBuses, setLiveBuses] = useState<BusNode[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(11.8);
  const [cameraKey, setCameraKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [sRes, bRes, locRes] = await Promise.all([
          supabase.from("schools").select("id, name, city, phone, status").eq("status", "approved"),
          supabase.from("buses").select("id, bus_number, route_name, school_id, is_active").eq("is_active", true),
          supabase.from("bus_live_locations").select("bus_id, latitude, longitude, speed, is_live"),
        ]);

        if (!isMounted) return;

        const locMap: Record<string, any> = {};
        if (locRes.data) {
          locRes.data.forEach((l: any) => { locMap[l.bus_id] = l; });
        }

        if (sRes.data && sRes.data.length > 0) {
          const mappedSchools: SchoolNode[] = sRes.data.map((s: any, idx: number) => ({
            id: s.id,
            name: s.name || "School",
            city: s.city || "Delhi NCR",
            coordinate: [77.364 + (idx * 0.01), 28.627 + (idx * 0.01)],
            students: 32,
            parents: 28,
            subscribed: 24,
            buses: 1,
            drivers: 1,
          }));
          setLiveSchools(mappedSchools);
        }

        if (bRes.data && bRes.data.length > 0) {
          const mappedBuses: BusNode[] = bRes.data.map((b: any, idx: number) => {
            const loc = locMap[b.id];
            const isLive = loc?.is_live ?? false;
            return {
              id: b.id,
              name: b.bus_number || `BUS-${idx + 1}`,
              schoolId: b.school_id,
              driver: "Ramesh Singh",
              status: isLive ? "Running" : "Offline",
              coordinate: loc?.latitude && loc?.longitude ? [loc.longitude, loc.latitude] : [77.209, 28.6139],
              speed: loc?.speed || 0,
            };
          });
          setLiveBuses(mappedBuses);
        }
      } catch (err) {
        console.warn("Super admin map load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    const channel = supabase
      .channel("superadmin-bus-locations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bus_live_locations" },
        (payload: any) => {
          const loc = payload.new;
          if (loc && loc.bus_id && loc.latitude && loc.longitude) {
            setLiveBuses((current) =>
              current.map((b) =>
                b.id === loc.bus_id
                  ? {
                      ...b,
                      status: loc.is_live ? "Running" : "Offline",
                      coordinate: [loc.longitude, loc.latitude],
                      speed: loc.speed || 0,
                    }
                  : b
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const selectedSchool = liveSchools.find((school) => school.id === selectedSchoolId);
  const selectedBus = liveBuses.find((bus) => bus.id === selectedBusId);
  const visibleBuses = useMemo(() => selectedSchoolId ? liveBuses.filter((bus) => bus.schoolId === selectedSchoolId) : liveBuses, [selectedSchoolId, liveBuses]);
  const center: Coordinate = selectedSchool?.coordinate ?? [77.365, 28.626];

  if (loading) return <View style={map.card}><SkeletonBlock width="42%" height={15} /><SkeletonBlock width="64%" height={10} /><SkeletonBlock width="100%" height={290} radius={20} /></View>;
  const focusSchool = (school: SchoolNode) => { setSelectedSchoolId(school.id); setSelectedBusId(null); setZoom(13.7); setCameraKey((value) => value + 1); };
  const focusBus = (bus: BusNode) => { const school = liveSchools.find((item) => item.id === bus.schoolId); setSelectedSchoolId(bus.schoolId); setSelectedBusId(bus.id); setZoom(14.6); setCameraKey((value) => value + 1); if (!school) return; };
  const fitAll = () => { setSelectedSchoolId(null); setSelectedBusId(null); setZoom(11.8); setCameraKey((value) => value + 1); };
  return <View style={map.card}>
    <View style={map.header}><View><Text style={map.title}>Schools & fleet map</Text><Text style={map.subtitle}>Tap a school to view its complete network overview</Text></View><View style={map.live}><View style={map.liveDot} /><Text style={map.liveText}>LIVE GPS</Text></View></View>
    <View style={map.mapFrame}>
      <Map style={map.mapView} mapStyle={MAP_STYLE} logo={false} attribution={false} dragPan touchZoom doubleTapZoom doubleTapHoldZoom onRegionDidChange={(event) => { if (event.nativeEvent.userInteraction) setZoom(event.nativeEvent.zoom); }}>
        <Camera key={cameraKey} center={center} zoom={zoom} duration={320} />
        {liveSchools.map((school) => { const active = selectedSchoolId === school.id; return <Marker key={school.id} id={`school-${school.id}`} lngLat={school.coordinate}><Pressable onPress={() => focusSchool(school)} style={map.markerWrap}><View style={[map.schoolMarker, active && map.schoolMarkerActive]}><Ionicons name="school" size={17} color={active ? "#FFFFFF" : "#172554"} /></View><View style={[map.markerLabel, active && map.markerLabelActive]}><Text numberOfLines={1} style={[map.markerText, active && map.markerTextActive]}>{school.name}</Text></View></Pressable></Marker>; })}
        {visibleBuses.map((bus) => { const active = selectedBusId === bus.id; const color = bus.status === "Running" ? "#16A34A" : bus.status === "Offline" ? "#98A2B3" : "#EA580C"; return <Marker key={bus.id} id={`bus-${bus.id}`} lngLat={bus.coordinate}><Pressable onPress={() => focusBus(bus)} style={map.markerWrap}><View style={[map.busMarker, { backgroundColor: active ? "#172554" : color }]}><Ionicons name="bus" size={14} color="#FFFFFF" /></View><View style={[map.busLabel, active && map.markerLabelActive]}><Text style={[map.busText, active && map.markerTextActive]}>{bus.name}</Text></View></Pressable></Marker>; })}
      </Map>
      <View style={map.controls}><Pressable accessibilityLabel="Zoom in" onPress={() => setZoom((value) => Math.min(18, value + 1))} style={map.control}><Ionicons name="add" size={18} color="#172033" /></Pressable><Pressable accessibilityLabel="Zoom out" onPress={() => setZoom((value) => Math.max(9, value - 1))} style={map.control}><Ionicons name="remove" size={18} color="#172033" /></Pressable><View style={map.divider} /><Pressable accessibilityLabel="Fit all schools and buses" onPress={fitAll} style={map.control}><Ionicons name="locate-outline" size={17} color="#2563EB" /></Pressable></View>
      <View style={map.zoomPill}><Text style={map.zoomText}>{zoom.toFixed(1)}x</Text></View>
      <View style={map.legend}><View style={map.legendItem}><View style={[map.legendDot, { backgroundColor: "#7C3AED" }]} /><Text style={map.legendText}>Schools</Text></View><View style={map.legendItem}><View style={[map.legendDot, { backgroundColor: "#16A34A" }]} /><Text style={map.legendText}>Running bus</Text></View><View style={map.legendItem}><View style={[map.legendDot, { backgroundColor: "#EA580C" }]} /><Text style={map.legendText}>Stopped</Text></View></View>
    </View>
    {selectedSchool ? <SchoolOverview school={selectedSchool} buses={liveBuses} selectedBus={selectedBus} onClear={fitAll} /> : <View style={map.mapHint}><Ionicons name="hand-left-outline" size={17} color="#2563EB" /><Text style={map.hintText}>Tap a school marker for parents, children, subscriptions, buses and driver details.</Text></View>}
  </View>;
}

function SchoolOverview({ school, buses, selectedBus, onClear }: { school: SchoolNode; buses: BusNode[]; selectedBus?: BusNode; onClear: () => void }) {
  const schoolBuses = buses.filter((bus) => bus.schoolId === school.id);
  const drivers = Array.from(new Set(schoolBuses.map((bus) => bus.driver)));
  return <View style={map.overview}><View style={map.overviewHead}><View style={map.overviewIcon}><Ionicons name="business" size={18} color="#2563EB" /></View><View style={{ flex: 1, marginLeft: 9 }}><Text style={map.overviewTitle}>{school.name}</Text><Text style={map.overviewSubtitle}>{school.city}  ·  {school.id}</Text></View><Pressable accessibilityLabel="Clear school selection" onPress={onClear} style={map.clear}><Ionicons name="close" size={15} color="#667085" /></Pressable></View><View style={map.statGrid}><Stat icon="school-outline" label="Children" value={school.students} color="#16A34A" /><Stat icon="people-outline" label="Parents" value={school.parents} color="#7C3AED" /><Stat icon="card-outline" label="Subscribed" value={school.subscribed} color="#DB2777" /><Stat icon="bus-outline" label="Buses" value={school.buses} color="#0891B2" /><Stat icon="person-outline" label="Drivers" value={school.drivers} color="#EA580C" /></View><Text style={map.sectionLabel}>Assigned drivers</Text><View style={map.driverChips}>{drivers.map((driver) => <View key={driver} style={map.driverChip}><View style={map.driverAvatar}><Ionicons name="person" size={12} color="#2563EB" /></View><Text numberOfLines={1} style={map.driverText}>{driver}</Text></View>)}</View><Text style={map.sectionLabel}>Bus roster</Text><View style={map.roster}>{schoolBuses.map((bus) => <View key={bus.id} style={map.rosterRow}><View style={[map.rosterIcon, { backgroundColor: bus.status === "Running" ? "#ECFDF3" : bus.status === "Offline" ? "#F2F4F7" : "#FFF7ED" }]}><Ionicons name="bus" size={14} color={bus.status === "Running" ? "#16A34A" : bus.status === "Offline" ? "#98A2B3" : "#EA580C"} /></View><View style={{ flex: 1, marginLeft: 8 }}><Text style={map.rosterName}>{bus.name}</Text><Text style={map.rosterMeta}>{bus.driver}  ·  {bus.speed} km/h</Text></View><Text style={[map.rosterStatus, { color: bus.status === "Running" ? "#16A34A" : bus.status === "Offline" ? "#98A2B3" : "#EA580C" }]}>{bus.status}</Text></View>)}</View><View style={map.overviewFooter}><Text style={map.footerLabel}>{selectedBus ? `${selectedBus.name} focused  ·  ${selectedBus.driver}  ·  ${selectedBus.speed} km/h` : `${schoolBuses.length} buses visible on this school map`}</Text><Text style={map.footerHint}>Tap a bus marker to focus its live route.</Text></View></View>;
}

function Stat({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string }) { return <View style={map.stat}><View style={[map.statIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon} size={15} color={color} /></View><Text style={map.statValue}>{value.toLocaleString()}</Text><Text style={map.statLabel}>{label}</Text></View>; }

const map = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 20, padding: 13, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  title: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 15 }, subtitle: { color: "#667085", fontFamily: "Inter-Regular", fontSize: 9.5, marginTop: 3 },
  live: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#ECFDF3", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 }, liveDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#16A34A" }, liveText: { color: "#16A34A", fontFamily: "Inter-Bold", fontSize: 8.5 },
  mapFrame: { height: 310, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#D5E1DD", position: "relative" }, mapView: { flex: 1 },
  markerWrap: { alignItems: "center" }, schoolMarker: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#FFD60A", borderWidth: 3, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6 }, schoolMarkerActive: { backgroundColor: "#172554", transform: [{ scale: 1.12 }] }, busMarker: { width: 31, height: 31, borderRadius: 11, borderWidth: 2, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 5 }, markerLabel: { maxWidth: 145, marginTop: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, backgroundColor: "#FFFFFFEE", borderWidth: 1, borderColor: "#E4E7EC" }, markerLabelActive: { backgroundColor: "#172554", borderColor: "#172554" }, markerText: { color: "#172033", fontFamily: "Inter-Bold", fontSize: 8.5 }, markerTextActive: { color: "#FFFFFF" }, busLabel: { maxWidth: 75, marginTop: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, backgroundColor: "#FFFFFFEE" }, busText: { color: "#344054", fontFamily: "Inter-SemiBold", fontSize: 8 },
  controls: { position: "absolute", right: 10, top: 12, backgroundColor: "#FFFFFFEE", borderRadius: 11, padding: 4, gap: 4, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 }, control: { width: 31, height: 31, borderRadius: 8, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, divider: { height: 1, backgroundColor: "#E4E7EC", marginHorizontal: 4 }, zoomPill: { position: "absolute", top: 12, left: 10, borderRadius: 99, backgroundColor: "#172554E8", paddingHorizontal: 8, paddingVertical: 5 }, zoomText: { color: "#FFFFFF", fontFamily: "Inter-Bold", fontSize: 9 },
  legend: { position: "absolute", bottom: 10, left: 10, borderRadius: 10, backgroundColor: "#FFFFFFEE", paddingHorizontal: 8, paddingVertical: 6, flexDirection: "row", gap: 8 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 4 }, legendDot: { width: 6, height: 6, borderRadius: 99 }, legendText: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 8 },
  mapHint: { minHeight: 45, borderRadius: 12, backgroundColor: "#EEF2FF", paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 9 }, hintText: { flex: 1, color: "#344054", fontFamily: "Inter-SemiBold", fontSize: 10 },
  overview: { borderWidth: 1, borderColor: "#C7D2FE", borderRadius: 16, backgroundColor: "#FAFCFF", padding: 11, marginTop: 9 }, overviewHead: { flexDirection: "row", alignItems: "center" }, overviewIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" }, overviewTitle: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 13 }, overviewSubtitle: { color: "#667085", fontFamily: "Inter-Regular", fontSize: 9.5, marginTop: 2 }, clear: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" }, statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 11 }, stat: { width: "31%", minHeight: 67, borderRadius: 11, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", padding: 7 }, statIcon: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" }, statValue: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 13, marginTop: 4 }, statLabel: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 8.5, marginTop: 1 }, sectionLabel: { color: "#344054", fontFamily: "Inter-Bold", fontSize: 10, marginTop: 12, marginBottom: 6 }, driverChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, driverChip: { flexDirection: "row", alignItems: "center", gap: 5, maxWidth: "100%", borderRadius: 99, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D9E2FF", paddingHorizontal: 7, paddingVertical: 5 }, driverAvatar: { width: 20, height: 20, borderRadius: 7, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" }, driverText: { color: "#344054", fontFamily: "Inter-SemiBold", fontSize: 9 }, roster: { borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 12, backgroundColor: "#FFFFFF", overflow: "hidden" }, rosterRow: { minHeight: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#F0F2F5" }, rosterIcon: { width: 29, height: 29, borderRadius: 9, alignItems: "center", justifyContent: "center" }, rosterName: { color: "#101828", fontFamily: "Inter-SemiBold", fontSize: 10.5 }, rosterMeta: { color: "#667085", fontFamily: "Inter-Regular", fontSize: 9, marginTop: 2 }, rosterStatus: { fontFamily: "Inter-Bold", fontSize: 8.5 }, overviewFooter: { borderTopWidth: 1, borderTopColor: "#E4E7EC", marginTop: 10, paddingTop: 9 }, footerLabel: { color: "#344054", fontFamily: "Inter-SemiBold", fontSize: 10 }, footerHint: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 9, marginTop: 3 },
});
