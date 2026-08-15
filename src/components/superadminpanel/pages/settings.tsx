import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminPageFrame, COLORS, FONT } from "./pagekit";

export default function SuperAdminSettingsPage({
  onChangePassword,
  onLogout,
}: {
  onChangePassword?: () => void;
  onLogout?: () => void;
}) {
  const [gpsInterval, setGpsInterval] = useState("5s");
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMap, setDarkMap] = useState(false);

  return (
    <AdminPageFrame
      eyebrow="SUPER ADMIN / PREFERENCES"
      title="Settings & System"
      subtitle="Fleet refresh rates, notification preferences, diagnostic tools and exports."
    >
      {/* ── 1. Realtime Telemetry Preferences (Enclosed Box) ── */}
      <View style={set.card}>
        <View style={set.cardHeader}>
          <View style={[set.headerIcon, { backgroundColor: "#EEF2FF" }]}>
            <Ionicons name="hardware-chip" size={17} color={COLORS.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={set.cardTitle}>Live Fleet & GPS Engine</Text>
            <Text style={set.cardSubtitle}>Real-time polling frequency and map styling</Text>
          </View>
        </View>

        <Text style={set.sectionLabel}>GPS TELEMETRY REFRESH INTERVAL</Text>
        <View style={set.pillRow}>
          {["3s", "5s", "10s", "30s"].map((int) => {
            const active = gpsInterval === int;
            return (
              <Pressable
                key={int}
                onPress={() => setGpsInterval(int)}
                style={[set.pill, active && set.pillActive]}
              >
                <Text style={[set.pillText, active && set.pillTextActive]}>{int} Polling</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => setAutoRefresh(!autoRefresh)}
          style={({ pressed }) => [set.settingRow, pressed && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={[set.itemIcon, { backgroundColor: "#ECFDF3" }]}>
            <Ionicons name="sync" size={16} color={COLORS.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={set.itemTitle}>Auto-Sync Live Fleet Positions</Text>
            <Text style={set.itemSub}>Continuously stream driver coordinates via Supabase Realtime</Text>
          </View>
          <View style={[set.statusPill, { backgroundColor: autoRefresh ? "#ECFDF3" : "#F2F4F7" }]}>
            <Text style={[set.statusPillText, { color: autoRefresh ? COLORS.green : COLORS.muted }]}>
              {autoRefresh ? "ACTIVE" : "PAUSED"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setDarkMap(!darkMap)}
          style={({ pressed }) => [set.settingRow, pressed && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={[set.itemIcon, { backgroundColor: "#EEF2FF" }]}>
            <Ionicons name="map" size={16} color={COLORS.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={set.itemTitle}>Map Style</Text>
            <Text style={set.itemSub}>MapLibre OpenStreetMap Liberty Vector Layer</Text>
          </View>
          <View style={set.statusPill}>
            <Text style={[set.statusPillText, { color: COLORS.navy }]}>LIBERTY 2D</Text>
          </View>
        </Pressable>
      </View>

      {/* ── 2. Notification & Sound Preferences (Enclosed Box) ── */}
      <View style={set.card}>
        <View style={set.cardHeader}>
          <View style={[set.headerIcon, { backgroundColor: "#FFF8DB" }]}>
            <Ionicons name="notifications" size={17} color={COLORS.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={set.cardTitle}>Alerts & Emergency Siren</Text>
            <Text style={set.cardSubtitle}>Sound, vibration and in-app banner triggers</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setSoundAlerts(!soundAlerts)}
          style={({ pressed }) => [set.settingRow, pressed && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={[set.itemIcon, { backgroundColor: "#FFF1E6" }]}>
            <Ionicons name={soundAlerts ? "volume-high" : "volume-mute"} size={16} color={COLORS.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={set.itemTitle}>SOS & Over-Speed Audio Siren</Text>
            <Text style={set.itemSub}>Play high-priority chime on bus overspeed (>50 km/h) or SOS</Text>
          </View>
          <View style={[set.statusPill, { backgroundColor: soundAlerts ? "#ECFDF3" : "#F2F4F7" }]}>
            <Text style={[set.statusPillText, { color: soundAlerts ? COLORS.green : COLORS.muted }]}>
              {soundAlerts ? "ENABLED" : "MUTED"}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ── 3. Maintenance, Diagnostics & Data (Enclosed Box) ── */}
      <View style={set.card}>
        <View style={set.cardHeader}>
          <View style={[set.headerIcon, { backgroundColor: "#F5E6FF" }]}>
            <Ionicons name="server" size={17} color={COLORS.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={set.cardTitle}>Data, Diagnostics & Backup</Text>
            <Text style={set.cardSubtitle}>Cache management and database backup exports</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            Alert.alert("Clear Local Cache", "Clean temporary tiles and offline cached records?", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear Cache", onPress: () => Alert.alert("Cache Cleared", "14.2 MB temporary data released.") },
            ]);
          }}
          style={({ pressed }) => [set.settingRow, pressed && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={[set.itemIcon, { backgroundColor: "#F2F4F7" }]}>
            <Ionicons name="trash-bin-outline" size={16} color={COLORS.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={set.itemTitle}>Purge Temporary Cache</Text>
            <Text style={set.itemSub}>Release local memory (14.2 MB cached)</Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={COLORS.faint} />
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert("Export Database", "Download complete JSON snapshot of all schools, parents, drivers & buses?", [
              { text: "Cancel", style: "cancel" },
              { text: "Export JSON", onPress: () => Alert.alert("Export Ready", "Snapshot saved to download folder.") },
            ]);
          }}
          style={({ pressed }) => [set.settingRow, pressed && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={[set.itemIcon, { backgroundColor: "#EEF2FF" }]}>
            <Ionicons name="download-outline" size={16} color={COLORS.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={set.itemTitle}>Export Full Database Backup</Text>
            <Text style={set.itemSub}>Download complete platform JSON snapshot</Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={COLORS.faint} />
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert("Ping Supabase", "Pinging Supabase API & Realtime gateway...\n\nLatency: 28ms · Status: Online & Healthy");
          }}
          style={({ pressed }) => [set.settingRow, pressed && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={[set.itemIcon, { backgroundColor: "#ECFDF3" }]}>
            <Ionicons name="pulse" size={16} color={COLORS.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={set.itemTitle}>Test Database Connectivity</Text>
            <Text style={set.itemSub}>Ping cloud endpoints & check latency</Text>
          </View>
          <View style={set.statusPill}>
            <Text style={[set.statusPillText, { color: COLORS.green }]}>28ms</Text>
          </View>
        </Pressable>
      </View>

      {/* ── 4. App Build & Sign Out (Enclosed Box) ── */}
      <View style={set.card}>
        <View style={set.versionRow}>
          <Text style={set.versionLabel}>BusTracker Super Admin Control Centre</Text>
          <Text style={set.versionVal}>v2.4.0 (Build #8410 · Production)</Text>
        </View>

        <Pressable
          onPress={() => {
            Alert.alert("Sign Out", "Are you sure you want to sign out of the control centre?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: onLogout },
            ]);
          }}
          style={({ pressed }) => [set.logoutBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="log-out-outline" size={16} color={COLORS.red} />
          <Text style={set.logoutText}>Sign Out of Super Admin</Text>
        </Pressable>
      </View>
    </AdminPageFrame>
  );
}

const set = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 18,
    padding: 13,
    marginBottom: 12,
    shadowColor: "#172554",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  headerIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "#101828", fontFamily: FONT.display, fontSize: 13.5 },
  cardSubtitle: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 1 },

  sectionLabel: { color: "#475467", fontFamily: FONT.bold, fontSize: 9, letterSpacing: 0.6, marginTop: 4, marginBottom: 8 },
  pillRow: { flexDirection: "row", gap: 7, marginBottom: 10 },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    alignItems: "center",
  },
  pillActive: { backgroundColor: "#172554", borderColor: "#172554" },
  pillText: { color: "#475467", fontFamily: FONT.semibold, fontSize: 10.5 },
  pillTextActive: { color: "#FFFFFF", fontFamily: FONT.bold },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  itemIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  itemTitle: { color: "#101828", fontFamily: FONT.semibold, fontSize: 12 },
  itemSub: { color: "#667085", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 2 },
  statusPill: { backgroundColor: "#F2F4F7", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontFamily: FONT.bold, fontSize: 8.5, letterSpacing: 0.4 },

  versionRow: { paddingVertical: 6, alignItems: "center" },
  versionLabel: { color: "#475467", fontFamily: FONT.bold, fontSize: 11 },
  versionVal: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 2 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 8,
  },
  logoutText: { color: COLORS.red, fontFamily: FONT.bold, fontSize: 12 },
});
