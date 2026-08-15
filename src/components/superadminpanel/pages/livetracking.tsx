import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Map, Camera, Marker } from "@maplibre/maplibre-react-native";
import { AdminPageFrame, SchoolFilterBar, StatusBadge, styles, COLORS } from "./pagekit";
import { buses, SCHOOL_NAMES } from "./mockData";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const BUS_COORDINATES: Array<[number, number]> = [
  [77.378, 28.636], [77.348, 28.616], [77.386, 28.612], [77.339, 28.639], [77.365, 28.628], [77.354, 28.6205],
];

export default function LiveTrackingPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const [zoom, setZoom] = useState(11.8);
  const [cameraKey, setCameraKey] = useState(0);

  const filteredBuses = useMemo(() => {
    return buses.filter((bus) => {
      if (schoolFilter === "All Schools") return true;
      return (
        bus.subtitle.toLowerCase().includes(schoolFilter.toLowerCase()) ||
        bus.title.toLowerCase().includes(schoolFilter.toLowerCase())
      );
    });
  }, [schoolFilter]);

  // Counts by school for chip badges
  const recordsCountBySchool = useMemo(() => {
    const map: Record<string, number> = { "All Schools": buses.length };
    SCHOOL_NAMES.forEach((s) => {
      map[s] = buses.filter(
        (r) =>
          r.subtitle.toLowerCase().includes(s.toLowerCase()) ||
          r.title.toLowerCase().includes(s.toLowerCase())
      ).length;
    });
    return map;
  }, []);

  const selected = filteredBuses.find((bus) => bus.id === selectedId) ?? (selectedId ? buses.find((b) => b.id === selectedId) : null);
  const selectedIndex = buses.findIndex((bus) => bus.id === selectedId);
  const center = selectedIndex >= 0 ? BUS_COORDINATES[selectedIndex % BUS_COORDINATES.length] : [77.365, 28.626] as [number, number];

  const focusBus = (id: string | null) => {
    setSelectedId(id);
    setZoom(id ? 14.6 : 11.8);
    setCameraKey((value) => value + 1);
  };

  return (
    <AdminPageFrame
      eyebrow="LIVE GPS / FLEET OVERVIEW"
      title="Live tracking"
      subtitle="Select a school and bus to inspect live driver, route, speed and rider count."
    >
      {/* ── School Filter Bar ── */}
      <SchoolFilterBar
        schools={SCHOOL_NAMES}
        selected={schoolFilter}
        onSelect={setSchoolFilter}
        recordsCountBySchool={recordsCountBySchool}
      />

      <View style={mapStyles.mapPreview}>
        <View style={mapStyles.mapTop}>
          <View>
            <Text style={styles.mapTitle}>Fleet Live GPS</Text>
            <Text style={mapStyles.mapSub}>
              {schoolFilter === "All Schools" ? "Showing all fleet" : schoolFilter} · {filteredBuses.length} buses
            </Text>
          </View>
          <View style={mapStyles.livePill}>
            <View style={mapStyles.liveDot} />
            <Text style={mapStyles.liveText}>LIVE</Text>
          </View>
        </View>

        <Map
          style={mapStyles.mapView}
          mapStyle={MAP_STYLE}
          logo={false}
          attribution={false}
          dragPan
          touchZoom
          doubleTapZoom
          doubleTapHoldZoom
          onRegionDidChange={(event) => {
            if (event.nativeEvent.userInteraction) setZoom(event.nativeEvent.zoom);
          }}
        >
          <Camera key={cameraKey} center={center} zoom={zoom} duration={320} />
          {filteredBuses.map((bus, index) => {
            const active = bus.id === selectedId;
            const originalIndex = buses.findIndex((b) => b.id === bus.id);
            const coordinate = BUS_COORDINATES[originalIndex >= 0 ? originalIndex % BUS_COORDINATES.length : 0];
            return (
              <Marker key={bus.id} id={`fleet-${bus.id}`} lngLat={coordinate}>
                <Pressable onPress={() => focusBus(active ? null : bus.id)} style={mapStyles.markerWrap}>
                  <View
                    style={[
                      styles.pinCircle,
                      {
                        backgroundColor: active
                          ? "#172554"
                          : bus.status === "running"
                          ? "#16A34A"
                          : bus.status === "offline"
                          ? "#98A2B3"
                          : "#EA580C",
                        transform: [{ scale: active ? 1.15 : 1 }],
                      },
                    ]}
                  >
                    <Ionicons name="bus" size={16} color="#FFFFFF" />
                  </View>
                  <Text numberOfLines={1} style={[styles.pinText, active && mapStyles.activePinText]}>
                    {bus.title.split(" · ")[0]}
                  </Text>
                </Pressable>
              </Marker>
            );
          })}
        </Map>

        <View style={mapStyles.mapControls}>
          <Pressable accessibilityLabel="Zoom in" onPress={() => setZoom((value) => Math.min(18, value + 1))} style={mapStyles.mapControl}>
            <Ionicons name="add" size={18} color="#172033" />
          </Pressable>
          <Pressable accessibilityLabel="Zoom out" onPress={() => setZoom((value) => Math.max(9, value - 1))} style={mapStyles.mapControl}>
            <Ionicons name="remove" size={18} color="#172033" />
          </Pressable>
          <View style={mapStyles.mapDivider} />
          <Pressable accessibilityLabel="Fit all buses" onPress={() => focusBus(null)} style={mapStyles.mapControl}>
            <Ionicons name="locate-outline" size={17} color="#2563EB" />
          </Pressable>
        </View>

        <View style={mapStyles.mapLegend}>
          <Text style={mapStyles.legendText}>● Running   ● Stopped   ● Offline</Text>
          <Text style={mapStyles.zoomText}>{zoom.toFixed(1)}x</Text>
        </View>
      </View>

      {selected ? (
        <View style={mapStyles.selectedCard}>
          <View style={styles.cardTop}>
            <View style={[styles.recordIcon, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="bus" size={19} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardTitle}>{selected.title}</Text>
              <Text style={styles.cardSubtitle}>{selected.subtitle}</Text>
            </View>
            <StatusBadge status={selected.status} />
          </View>
          {selected.fields?.map((field) => (
            <Text key={field} style={styles.field}>
              {field}
            </Text>
          ))}
          <Pressable onPress={() => focusBus(null)} style={mapStyles.closeSelection}>
            <Text style={mapStyles.closeSelectionText}>Clear selection</Text>
          </Pressable>
        </View>
      ) : (
        <View style={mapStyles.tip}>
          <Ionicons name="hand-left-outline" size={17} color="#2563EB" />
          <Text style={mapStyles.tipText}>Tap any bus marker on the map to view live details.</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Connected Fleet ({filteredBuses.length})
      </Text>
      {filteredBuses.map((bus) => (
        <Pressable
          key={bus.id}
          onPress={() => focusBus(bus.id)}
          style={[styles.card, selectedId === bus.id && mapStyles.selectedRow]}
        >
          <View style={styles.cardTop}>
            <View style={styles.recordIcon}>
              <Ionicons name="bus-outline" size={19} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardTitle}>{bus.title}</Text>
              <Text style={styles.cardSubtitle}>{bus.subtitle}</Text>
            </View>
            <StatusBadge status={bus.status} />
            <Ionicons name="chevron-forward" size={15} color="#98A2B3" style={{ marginLeft: 6 }} />
          </View>
          {bus.fields?.map((field) => (
            <Text key={field} style={styles.field}>
              {field}
            </Text>
          ))}
        </Pressable>
      ))}
    </AdminPageFrame>
  );
}

const mapStyles = StyleSheet.create({
  mapPreview: {
    height: 300,
    borderRadius: 18,
    backgroundColor: "#DCE8E5",
    borderWidth: 1,
    borderColor: "#C8D8D4",
    overflow: "hidden",
    position: "relative",
    marginBottom: 10,
  },
  mapView: { flex: 1 },
  mapTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 12 },
  mapSub: { color: "#667085", fontFamily: "Inter-Regular", fontSize: 9.5, marginTop: 3 },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF3",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#16A34A" },
  liveText: { color: "#16A34A", fontFamily: "Inter-Bold", fontSize: 9 },
  markerWrap: { alignItems: "center" },
  mapControls: {
    position: "absolute",
    right: 10,
    top: 58,
    backgroundColor: "#FFFFFFEE",
    borderRadius: 11,
    padding: 4,
    gap: 4,
    elevation: 5,
  },
  mapControl: { width: 31, height: 31, borderRadius: 8, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  mapDivider: { height: 1, backgroundColor: "#E4E7EC", marginHorizontal: 4 },
  activePinText: { backgroundColor: "#172554", color: "#FFFFFF" },
  selectedCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 17,
    padding: 13,
    marginBottom: 8,
  },
  closeSelection: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: "#EEF2FF",
  },
  closeSelectionText: { color: "#2563EB", fontFamily: "Inter-Bold", fontSize: 10 },
  tip: {
    minHeight: 42,
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tipText: { color: "#344054", fontFamily: "Inter-SemiBold", fontSize: 10.5 },
  mapLegend: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFFEE",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  legendText: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 8.5 },
  zoomText: {
    color: "#FFFFFF",
    backgroundColor: "#172554E8",
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontFamily: "Inter-Bold",
    fontSize: 8.5,
  },
  selectedRow: { borderColor: "#93C5FD", backgroundColor: "#FAFCFF" },
});
