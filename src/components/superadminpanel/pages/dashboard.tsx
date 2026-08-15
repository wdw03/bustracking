import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminPageFrame, MetricCard, StatusBadge, styles } from "./pagekit";
import { metrics } from "./mockDataDashboard";
import { schools, payments } from "./mockData";
import SuperAdminFleetMap from "./superadminmap";

export default function SuperAdminDashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const pendingSchools = schools.filter((item) => item.status === "pending");
  const keyMetrics = metrics.slice(0, 6);

  return (
    <AdminPageFrame eyebrow="SUPER ADMIN  /  CONTROL CENTRE" title="Dashboard" subtitle="A live overview of schools, people, fleet and payments." onMetricPress={(metric) => {
      const routeByMetric: Record<string, string> = { "Total schools": "schools", "Total parents": "parents", "Total students": "students", "Total drivers": "drivers", "Total buses": "buses", "Running buses": "tracking" };
      const route = routeByMetric[metric.label];
      if (route) onNavigate?.(route);
    }}>
      <View style={dash.hero}>
        <View style={dash.heroCopy}>
          <View style={dash.liveLabel}><View style={dash.liveDot} /><Text style={dash.liveText}>SYSTEM HEALTHY</Text></View>
          <Text style={dash.heroTitle}>Good morning, Super Admin</Text>
          <Text style={dash.heroSubtitle}>Everything important is one click away. Review requests and keep the fleet moving.</Text>
        </View>
        <View style={dash.heroOrb}><Ionicons name="shield-checkmark" size={31} color="#FFD60A" /></View>
      </View>

      <View style={dash.quickHeader}><Text style={dash.quickTitle}>Quick actions</Text><Text style={dash.quickHint}>Jump into admin tasks</Text></View>
      <View style={dash.quickRow}>
        <QuickAction icon="git-pull-request-outline" label="Review requests" onPress={() => onNavigate?.("requests")} />
        <QuickAction icon="navigate-outline" label="Live map" onPress={() => onNavigate?.("tracking")} />
        <QuickAction icon="wallet-outline" label="Payments" onPress={() => onNavigate?.("payments")} />
      </View>

      <View style={dash.healthRail}>
        <HealthItem icon="business-outline" label="Approvals" value={String(pendingSchools.length)} tone="#EA580C" onPress={() => onNavigate?.("requests")} />
        <HealthItem icon="navigate-outline" label="Moving now" value={String(metrics[5].value)} tone="#16A34A" onPress={() => onNavigate?.("tracking")} />
        <HealthItem icon="wallet-outline" label="Payment queue" value={String(metrics[9].value)} tone="#2563EB" onPress={() => onNavigate?.("payments")} />
      </View>

      <Text style={styles.sectionTitle}>Platform snapshot</Text>
      <View style={styles.metricGrid}>{keyMetrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</View>

      <View style={dash.summaryGrid}>
        <SummaryTile icon="person-add-outline" label="Subscribed parents" value={String(metrics[6].value)} tone="#DB2777" note="Parents with an active plan" />
        <SummaryTile icon="card-outline" label="Active subscriptions" value={String(metrics[7].value)} tone="#DB2777" note="Plans currently running" />
        <SummaryTile icon="cash-outline" label="Revenue this cycle" value={String(metrics[8].value)} tone="#0F766E" note="Settled and processing" />
        <SummaryTile icon="time-outline" label="Pending requests" value={String(metrics[9].value)} tone="#EA580C" note="Need your review" />
      </View>

      <View style={dash.sectionHeader}>
        <View><Text style={styles.sectionTitle}>Needs your attention</Text><Text style={dash.sectionHint}>Requests waiting in the queue</Text></View>
        <Pressable onPress={() => onNavigate?.("requests")} style={dash.linkButton}><Text style={dash.linkText}>View all</Text><Ionicons name="chevron-forward-circle-outline" size={17} color="#2563EB" /></Pressable>
      </View>
      {pendingSchools.length > 0 ? pendingSchools.map((school) => (
        <Pressable key={school.id} onPress={() => onNavigate?.("requests")} style={({ pressed }) => [styles.card, pressed && dash.pressedCard]}>
          <View style={styles.cardTop}>
            <View style={[styles.recordIcon, { backgroundColor: "#FFF7D6" }]}><Ionicons name="business-outline" size={19} color="#B57900" /></View>
            <View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.cardTitle}>{school.title}</Text><Text style={styles.cardSubtitle}>{school.subtitle}</Text></View>
            <StatusBadge status={school.status} />
          </View>
          <Text style={styles.field}>Registration request  ·  {school.fields?.[0] ?? "Documents submitted"}</Text>
        </Pressable>
      )) : <View style={styles.empty}><Ionicons name="checkmark-circle-outline" size={30} color="#16A34A" /><Text style={styles.emptyText}>All school requests are clear.</Text></View>}

      <View style={dash.sectionHeader}>
        <View><Text style={styles.sectionTitle}>Recent payments</Text><Text style={dash.sectionHint}>Latest subscription and withdrawal activity</Text></View>
        <Pressable onPress={() => onNavigate?.("payments")} style={dash.linkButton}><Text style={dash.linkText}>View all</Text><Ionicons name="chevron-forward-circle-outline" size={17} color="#2563EB" /></Pressable>
      </View>
      <View style={dash.paymentCard}>
        <View style={dash.paymentHead}><View style={dash.paymentHeadIcon}><Ionicons name="wallet-outline" size={18} color="#2563EB" /></View><View style={{ flex: 1, marginLeft: 9 }}><Text style={styles.cardTitle}>Payment activity</Text><Text style={styles.cardSubtitle}>Subscriptions and withdrawals</Text></View><View style={dash.countPill}><Text style={dash.countText}>3 latest</Text></View></View>
        {payments.slice(0, 3).map((payment, index) => (
          <Pressable key={payment.id} onPress={() => onNavigate?.("payments")} style={({ pressed }) => [dash.paymentRow, index > 0 && dash.paymentBorder, pressed && dash.pressedRow]}>
            <View style={[dash.paymentIcon, { backgroundColor: payment.status === "completed" ? "#ECFDF3" : "#EEF2FF" }]}><Ionicons name={payment.status === "completed" ? "checkmark-circle-outline" : "wallet-outline"} size={18} color={payment.status === "completed" ? "#16A34A" : "#2563EB"} /></View>
            <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}><Text style={styles.cardTitle} numberOfLines={1}>{payment.title}</Text><Text style={styles.cardSubtitle} numberOfLines={1}>{payment.subtitle}</Text></View>
            <View style={dash.paymentRight}><StatusBadge status={payment.status} /><View style={dash.rowArrow}><Ionicons name="chevron-forward" size={14} color="#667085" /></View></View>
          </Pressable>
        ))}
      </View>

      <SuperAdminFleetMap />
    </AdminPageFrame>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [dash.quickAction, pressed && dash.pressedButton]}>
    <View style={dash.quickIcon}><Ionicons name={icon} size={16} color="#172554" /></View>
    <Text style={dash.quickText} numberOfLines={2}>{label}</Text>
    <View style={dash.buttonArrow}><Ionicons name="arrow-forward" size={14} color="#172554" /></View>
  </Pressable>;
}

function SummaryTile({ icon, label, value, tone, note }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tone: string; note: string }) {
  return <View style={dash.summaryTile}><View style={[dash.summaryIcon, { backgroundColor: `${tone}18` }]}><Ionicons name={icon} size={17} color={tone} /></View><Text style={dash.summaryLabel}>{label}</Text><Text style={dash.summaryValue}>{value}</Text><Text style={dash.summaryNote}>{note}</Text></View>;
}

function HealthItem({ icon, label, value, tone, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tone: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [dash.healthItem, pressed && dash.pressedRow]}>
    <View style={[dash.healthIcon, { backgroundColor: `${tone}16` }]}><Ionicons name={icon} size={15} color={tone} /></View>
    <View style={{ flex: 1 }}><Text style={dash.healthLabel}>{label}</Text><Text style={dash.healthValue}>{value}</Text></View>
    <Ionicons name="chevron-forward" size={14} color="#98A2B3" />
  </Pressable>;
}

function Pulse({ color, label, value }: { color: string; label: string; value: string }) {
  return <View style={dash.pulseItem}><View style={[dash.pulseDot, { backgroundColor: color }]} /><Text style={dash.pulseLabel}>{label}</Text><Text style={dash.pulseValue}>{value}</Text></View>;
}

const dash = StyleSheet.create({
  hero: { borderRadius: 21, backgroundColor: "#172554", padding: 17, minHeight: 147, flexDirection: "row", alignItems: "center", marginBottom: 11, overflow: "hidden" },
  heroCopy: { flex: 1 },
  liveLabel: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF14", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99 },
  liveDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#55E38B" },
  liveText: { color: "#B6F6CC", fontFamily: "Inter-Bold", fontSize: 8, letterSpacing: 0.7 },
  heroTitle: { color: "#FFFFFF", fontFamily: "Sora-Bold", fontSize: 19, marginTop: 13 },
  heroSubtitle: { color: "#C7D2FE", fontFamily: "Inter-Regular", fontSize: 10.5, lineHeight: 16, marginTop: 5, maxWidth: 285 },
  heroOrb: { width: 67, height: 67, borderRadius: 24, backgroundColor: "#FFFFFF14", alignItems: "center", justifyContent: "center", marginLeft: 10 },
  quickHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 },
  quickTitle: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 14 },
  quickHint: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 9.5 },
  quickRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  quickAction: { flex: 1, minHeight: 62, borderWidth: 1, borderColor: "#DDE3EC", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 8, shadowColor: "#172554", shadowOpacity: 0.035, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  quickIcon: { width: 32, height: 32, flexShrink: 0, borderRadius: 10, backgroundColor: "#FFF8DB", alignItems: "center", justifyContent: "center" },
  quickText: { flex: 1, minWidth: 0, color: "#172033", fontFamily: "Inter-SemiBold", fontSize: 10, lineHeight: 13 },
  buttonArrow: { width: 27, height: 27, flexShrink: 0, borderRadius: 99, backgroundColor: "#FFD60A", alignItems: "center", justifyContent: "center" },
  pressedButton: { backgroundColor: "#FFFDF1", borderColor: "#D5B400", transform: [{ scale: 0.985 }] },
  healthRail: { flexDirection: "row", gap: 8, marginTop: 6, marginBottom: 9 },
  healthItem: { flex: 1, minHeight: 64, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", padding: 9, flexDirection: "row", alignItems: "center", gap: 7 },
  healthIcon: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  healthLabel: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 8.5 },
  healthValue: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 16, marginTop: 2 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 5 },
  summaryTile: { width: "48%", minHeight: 87, borderRadius: 16, borderWidth: 1, borderColor: "#E4E7EC", backgroundColor: "#FFFFFF", padding: 12, paddingLeft: 50, position: "relative" },
  summaryIcon: { position: "absolute", left: 12, top: 13, width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  summaryLabel: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 10.5 },
  summaryValue: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 18, marginTop: 3 },
  summaryNote: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 9, marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 7 },
  sectionHint: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 10, marginTop: -4, marginBottom: 8 },
  linkButton: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, borderRadius: 9, backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#D9E2FF", marginBottom: 8 },
  linkText: { color: "#2563EB", fontFamily: "Inter-Bold", fontSize: 10.5 },
  paymentCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 17, paddingHorizontal: 13 },
  paymentHead: { minHeight: 58, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F0F2F5" },
  paymentHeadIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  countPill: { borderRadius: 99, backgroundColor: "#F2F4F7", paddingHorizontal: 8, paddingVertical: 5 },
  countText: { color: "#667085", fontFamily: "Inter-Bold", fontSize: 9 },
  paymentRow: { minHeight: 65, paddingVertical: 8, flexDirection: "row", alignItems: "center" },
  pressedRow: { backgroundColor: "#FAFCFF" },
  paymentRight: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 7 },
  rowArrow: { width: 25, height: 25, borderRadius: 8, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center", marginLeft: 7 },
  paymentBorder: { borderTopWidth: 1, borderTopColor: "#F0F2F5" },
  paymentIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  fleetCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 17, padding: 14, marginTop: 10 },
  fleetHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fleetAction: { minHeight: 31, borderRadius: 9, paddingHorizontal: 9, backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#D9E2FF", flexDirection: "row", alignItems: "center", gap: 4 },
  fleetActionText: { color: "#2563EB", fontFamily: "Inter-Bold", fontSize: 9.5 },
  pressedCard: { backgroundColor: "#FAFCFF", borderColor: "#93C5FD" },
  pulseRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  pulseItem: { flex: 1, minWidth: "43%", backgroundColor: "#F8FAFC", borderRadius: 11, padding: 9, flexDirection: "row", alignItems: "center", gap: 6 },
  pulseDot: { width: 7, height: 7, borderRadius: 99 },
  pulseLabel: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 9.5, flex: 1 },
  pulseValue: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 14 },
});
