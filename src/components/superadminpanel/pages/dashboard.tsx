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

      {/* ── Quick actions (settings-style rows) ── */}
      <View style={dash.quickHeader}><Text style={dash.quickTitle}>Quick actions</Text><Text style={dash.quickHint}>Jump into admin tasks</Text></View>
      <View style={dash.quickColumn}>
        <QuickAction icon="git-pull-request" iconBg="#FFF1E6" iconColor="#EA580C" label="Review requests" hint="Pending school approvals" onPress={() => onNavigate?.("requests")} />
        <QuickAction icon="navigate" iconBg="#E6F7ED" iconColor="#16A34A" label="Live map" hint="Track all buses in real-time" onPress={() => onNavigate?.("tracking")} />
        <QuickAction icon="wallet" iconBg="#EEF2FF" iconColor="#2563EB" label="Payments" hint="Process payments & withdrawals" onPress={() => onNavigate?.("payments")} />
        <QuickAction icon="people" iconBg="#F5E6FF" iconColor="#7C3AED" label="All parents" hint="Browse & manage all parents" onPress={() => onNavigate?.("parents")} />
      </View>

      {/* ── Health rail ── */}
      <View style={dash.healthRail}>
        <HealthItem icon="business" label="Approvals" value={String(pendingSchools.length)} tone="#EA580C" onPress={() => onNavigate?.("requests")} />
        <HealthItem icon="navigate" label="Moving now" value={String(metrics[5].value)} tone="#16A34A" onPress={() => onNavigate?.("tracking")} />
        <HealthItem icon="wallet" label="Pay queue" value={String(metrics[9].value)} tone="#2563EB" onPress={() => onNavigate?.("payments")} />
      </View>

      {/* ── Platform snapshot ── */}
      <Text style={styles.sectionTitle}>Platform snapshot</Text>
      <View style={styles.metricGrid}>{keyMetrics.map((metric) => <MetricCard key={metric.label} metric={metric} onPress={() => { const routeByMetric: Record<string, string> = { "Total schools": "schools", "Total parents": "parents", "Total students": "students", "Total drivers": "drivers", "Total buses": "buses", "Running buses": "tracking" }; const route = routeByMetric[metric.label]; if (route) onNavigate?.(route); }} />)}</View>

      {/* ── Summary tiles ── */}
      <View style={dash.summaryGrid}>
        <SummaryTile icon="person-add" label="Subscribed parents" value={String(metrics[6].value)} tone="#DB2777" note="Parents with an active plan" onPress={() => onNavigate?.("subscriptions")} />
        <SummaryTile icon="card" label="Active subscriptions" value={String(metrics[7].value)} tone="#DB2777" note="Plans currently running" onPress={() => onNavigate?.("subscriptions")} />
        <SummaryTile icon="cash" label="Revenue this cycle" value={String(metrics[8].value)} tone="#0F766E" note="Settled and processing" onPress={() => onNavigate?.("payments")} />
        <SummaryTile icon="time" label="Pending requests" value={String(metrics[9].value)} tone="#EA580C" note="Need your review" onPress={() => onNavigate?.("requests")} />
      </View>

      {/* ── Needs attention ── */}
      <View style={dash.sectionHeader}>
        <View><Text style={styles.sectionTitle}>Needs your attention</Text><Text style={dash.sectionHint}>Requests waiting in the queue</Text></View>
        <Pressable onPress={() => onNavigate?.("requests")} style={dash.linkButton}><Text style={dash.linkText}>View all</Text><Ionicons name="chevron-forward" size={14} color="#2563EB" /></Pressable>
      </View>
      {pendingSchools.length > 0 ? pendingSchools.map((school) => (
        <Pressable key={school.id} onPress={() => onNavigate?.("requests")} style={({ pressed }) => [styles.card, pressed && dash.pressedCard]}>
          <View style={styles.cardTop}>
            <View style={[styles.recordIcon, { backgroundColor: "#FFF7D6" }]}><Ionicons name="business" size={19} color="#B57900" /></View>
            <View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.cardTitle}>{school.title}</Text><Text style={styles.cardSubtitle}>{school.subtitle}</Text></View>
            <StatusBadge status={school.status} />
          </View>
          <Text style={styles.field}>Registration request  ·  {school.fields?.[0] ?? "Documents submitted"}</Text>
        </Pressable>
      )) : <View style={styles.empty}><Ionicons name="checkmark-circle" size={30} color="#16A34A" /><Text style={styles.emptyText}>All school requests are clear.</Text></View>}

      {/* ── Recent payments ── */}
      <View style={dash.sectionHeader}>
        <View><Text style={styles.sectionTitle}>Recent payments</Text><Text style={dash.sectionHint}>Latest subscription and withdrawal activity</Text></View>
        <Pressable onPress={() => onNavigate?.("payments")} style={dash.linkButton}><Text style={dash.linkText}>View all</Text><Ionicons name="chevron-forward" size={14} color="#2563EB" /></Pressable>
      </View>
      <View style={dash.paymentCard}>
        <View style={dash.paymentHead}><View style={dash.paymentHeadIcon}><Ionicons name="wallet" size={18} color="#2563EB" /></View><View style={{ flex: 1, marginLeft: 9 }}><Text style={styles.cardTitle}>Payment activity</Text><Text style={styles.cardSubtitle}>Subscriptions and withdrawals</Text></View><View style={dash.countPill}><Text style={dash.countText}>{Math.min(payments.length, 4)} latest</Text></View></View>
        {payments.slice(0, 4).map((payment, index) => (
          <Pressable key={payment.id} onPress={() => onNavigate?.("payments")} style={({ pressed }) => [dash.paymentRow, index > 0 && dash.paymentBorder, pressed && dash.pressedRow]}>
            <View style={[dash.paymentIcon, { backgroundColor: payment.status === "completed" ? "#ECFDF3" : payment.status === "pending" ? "#FFF7E6" : "#EEF2FF" }]}><Ionicons name={payment.status === "completed" ? "checkmark-circle" : payment.status === "pending" ? "time" : "sync"} size={18} color={payment.status === "completed" ? "#16A34A" : payment.status === "pending" ? "#EA580C" : "#2563EB"} /></View>
            <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}><Text style={styles.cardTitle} numberOfLines={1}>{payment.title}</Text><Text style={styles.cardSubtitle} numberOfLines={1}>{payment.subtitle}</Text></View>
            <View style={dash.paymentRight}><StatusBadge status={payment.status} /><View style={dash.rowArrow}><Ionicons name="chevron-forward" size={14} color="#667085" /></View></View>
          </Pressable>
        ))}
      </View>

      <SuperAdminFleetMap />
    </AdminPageFrame>
  );
}

function QuickAction({ icon, iconBg, iconColor, label, hint, onPress }: { icon: keyof typeof Ionicons.glyphMap; iconBg: string; iconColor: string; label: string; hint: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [dash.quickAction, pressed && dash.pressedButton]}>
    <View style={[dash.quickIcon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={18} color={iconColor} /></View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={dash.quickText} numberOfLines={1}>{label}</Text>
      <Text style={dash.quickSubtext} numberOfLines={1}>{hint}</Text>
    </View>
    <View style={dash.buttonArrow}><Ionicons name="chevron-forward" size={15} color="#172554" /></View>
  </Pressable>;
}

function SummaryTile({ icon, label, value, tone, note, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tone: string; note: string; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [dash.summaryTile, pressed && { opacity: 0.85 }]}><View style={[dash.summaryIcon, { backgroundColor: `${tone}18` }]}><Ionicons name={icon} size={17} color={tone} /></View><Text style={dash.summaryLabel}>{label}</Text><Text style={dash.summaryValue}>{value}</Text><Text style={dash.summaryNote}>{note}</Text><View style={dash.summaryArrow}><Ionicons name="chevron-forward" size={13} color="#98A2B3" /></View></Pressable>;
}

function HealthItem({ icon, label, value, tone, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tone: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [dash.healthItem, pressed && dash.pressedRow]}>
    <View style={[dash.healthIcon, { backgroundColor: `${tone}16` }]}><Ionicons name={icon} size={15} color={tone} /></View>
    <View style={{ flex: 1 }}><Text style={dash.healthLabel}>{label}</Text><Text style={dash.healthValue}>{value}</Text></View>
    <View style={dash.healthArrow}><Ionicons name="chevron-forward" size={13} color="#98A2B3" /></View>
  </Pressable>;
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
  quickHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, marginTop: 4 },
  quickTitle: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 14 },
  quickHint: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 9.5 },
  quickColumn: { gap: 8, marginBottom: 10 },
  quickAction: { minHeight: 58, borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 16, paddingHorizontal: 13, paddingVertical: 11, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#172554", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  quickIcon: { width: 40, height: 40, flexShrink: 0, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickText: { color: "#101828", fontFamily: "Inter-Bold", fontSize: 13 },
  quickSubtext: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 10, marginTop: 1 },
  buttonArrow: { width: 30, height: 30, flexShrink: 0, borderRadius: 99, backgroundColor: "#FFD60A", alignItems: "center", justifyContent: "center", shadowColor: "#B57900", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  pressedButton: { backgroundColor: "#FFFDF1", borderColor: "#D5B400", transform: [{ scale: 0.985 }] },
  healthRail: { flexDirection: "row", gap: 8, marginTop: 2, marginBottom: 9 },
  healthItem: { flex: 1, minHeight: 64, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", padding: 9, flexDirection: "row", alignItems: "center", gap: 7 },
  healthIcon: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  healthLabel: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 8.5 },
  healthValue: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 16, marginTop: 2 },
  healthArrow: { width: 22, height: 22, borderRadius: 7, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 5 },
  summaryTile: { width: "48%", minHeight: 87, borderRadius: 16, borderWidth: 1, borderColor: "#E4E7EC", backgroundColor: "#FFFFFF", padding: 12, paddingLeft: 50, position: "relative", shadowColor: "#172554", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  summaryIcon: { position: "absolute", left: 12, top: 13, width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  summaryLabel: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 10.5 },
  summaryValue: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 18, marginTop: 3 },
  summaryNote: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 9, marginTop: 2 },
  summaryArrow: { position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: 7, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 7 },
  sectionHint: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 10, marginTop: -4, marginBottom: 8 },
  linkButton: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, borderRadius: 9, backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#D9E2FF", marginBottom: 8 },
  linkText: { color: "#2563EB", fontFamily: "Inter-Bold", fontSize: 10.5 },
  paymentCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 17, paddingHorizontal: 13, shadowColor: "#172554", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  paymentHead: { minHeight: 58, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F0F2F5" },
  paymentHeadIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  countPill: { borderRadius: 99, backgroundColor: "#F2F4F7", paddingHorizontal: 8, paddingVertical: 5 },
  countText: { color: "#667085", fontFamily: "Inter-Bold", fontSize: 9 },
  paymentRow: { minHeight: 65, paddingVertical: 8, flexDirection: "row", alignItems: "center" },
  pressedRow: { backgroundColor: "#FAFCFF" },
  paymentRight: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 7 },
  rowArrow: { width: 25, height: 25, borderRadius: 8, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center", marginLeft: 4 },
  paymentBorder: { borderTopWidth: 1, borderTopColor: "#F0F2F5" },
  paymentIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  pressedCard: { backgroundColor: "#FAFCFF", borderColor: "#93C5FD" },
});
