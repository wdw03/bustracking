import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminPageFrame, COLORS, FONT, MetricCard, StatusBadge, styles } from "./pagekit";
import { metrics } from "./mockDataDashboard";
import { schools, payments } from "./mockData";
import SuperAdminFleetMap from "./superadminmap";

export default function SuperAdminDashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const pendingSchools = schools.filter((item) => item.status === "pending");
  const keyMetrics = metrics.slice(0, 6);

  return (
    <AdminPageFrame
      eyebrow="SUPER ADMIN / CONTROL CENTRE"
      title="Dashboard"
      subtitle="Live overview of schools, students, fleet and payments."
      onMetricPress={(metric) => {
        const routeByMetric: Record<string, string> = {
          "Total schools": "schools",
          "Total parents": "parents",
          "Total students": "students",
          "Total drivers": "drivers",
          "Total buses": "buses",
          "Running buses": "tracking",
        };
        const route = routeByMetric[metric.label];
        if (route) onNavigate?.(route);
      }}
    >
      {/* ── Hero Banner ── */}
      <View style={dash.hero}>
        <View style={dash.heroCopy}>
          <View style={dash.liveLabel}>
            <View style={dash.liveDot} />
            <Text style={dash.liveText}>SYSTEM OPERATIONAL</Text>
          </View>
          <Text style={dash.heroTitle}>Good morning, Super Admin</Text>
          <Text style={dash.heroSubtitle}>
            Review requests, monitor active fleet GPS, and verify payment settlements.
          </Text>
        </View>
        <View style={dash.heroOrb}>
          <Ionicons name="shield-checkmark" size={28} color="#FFD60A" />
        </View>
      </View>

      {/* ── Health Rail (3 Quick Status Pills) ── */}
      <View style={dash.healthRail}>
        <HealthItem
          icon="business"
          label="Approvals"
          value={String(pendingSchools.length)}
          tone={COLORS.orange}
          onPress={() => onNavigate?.("requests")}
        />
        <HealthItem
          icon="navigate"
          label="Moving now"
          value={String(metrics[5].value)}
          tone={COLORS.green}
          onPress={() => onNavigate?.("tracking")}
        />
        <HealthItem
          icon="wallet"
          label="Pay queue"
          value={String(metrics[9].value)}
          tone={COLORS.blue}
          onPress={() => onNavigate?.("payments")}
        />
      </View>

      {/* ── Quick Actions (2x2 Grid) ── */}
      <View style={dash.sectionHeaderRow}>
        <Text style={dash.sectionTitle}>Quick actions</Text>
        <Text style={dash.sectionSub}>Jump directly to management</Text>
      </View>
      <View style={dash.quickGrid}>
        <QuickActionCard
          icon="git-pull-request"
          iconColor="#EA580C"
          iconBg="#FFF1E6"
          title="Review Requests"
          subtitle={`${pendingSchools.length} pending approval`}
          onPress={() => onNavigate?.("requests")}
        />
        <QuickActionCard
          icon="navigate"
          iconColor="#16A34A"
          iconBg="#E6F7ED"
          title="Live Fleet Map"
          subtitle="Track buses in real-time"
          onPress={() => onNavigate?.("tracking")}
        />
        <QuickActionCard
          icon="wallet"
          iconColor="#2563EB"
          iconBg="#EEF2FF"
          title="Payments & Payouts"
          subtitle="Process subscription fees"
          onPress={() => onNavigate?.("payments")}
        />
        <QuickActionCard
          icon="people"
          iconColor="#7C3AED"
          iconBg="#F5E6FF"
          title="Parent Directory"
          subtitle="Browse & filter by school"
          onPress={() => onNavigate?.("parents")}
        />
      </View>

      {/* ── Platform Snapshot (Metrics 2-Column Grid) ── */}
      <View style={dash.sectionHeaderRow}>
        <Text style={dash.sectionTitle}>Platform snapshot</Text>
        <Text style={dash.sectionSub}>Tap any card to view list</Text>
      </View>
      <View style={styles.metricGrid}>
        {keyMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            metric={metric}
            onPress={() => {
              const routeByMetric: Record<string, string> = {
                "Total schools": "schools",
                "Total parents": "parents",
                "Total students": "students",
                "Total drivers": "drivers",
                "Total buses": "buses",
                "Running buses": "tracking",
              };
              const route = routeByMetric[metric.label];
              if (route) onNavigate?.(route);
            }}
          />
        ))}
      </View>

      {/* ── Financial & Subscription Overview ── */}
      <View style={dash.sectionHeaderRow}>
        <Text style={dash.sectionTitle}>Financials & Plans</Text>
        <Text style={dash.sectionSub}>Revenue and active accounts</Text>
      </View>
      <View style={dash.summaryGrid}>
        <SummaryTile
          icon="person-add"
          label="Subscribed parents"
          value={String(metrics[6].value)}
          tone="#DB2777"
          note="Parents with active plan"
          onPress={() => onNavigate?.("subscriptions")}
        />
        <SummaryTile
          icon="card"
          label="Active subscriptions"
          value={String(metrics[7].value)}
          tone="#DB2777"
          note="Plans running now"
          onPress={() => onNavigate?.("subscriptions")}
        />
        <SummaryTile
          icon="cash"
          label="Revenue this cycle"
          value={String(metrics[8].value)}
          tone="#0F766E"
          note="Settled and processing"
          onPress={() => onNavigate?.("payments")}
        />
        <SummaryTile
          icon="time"
          label="Pending requests"
          value={String(metrics[9].value)}
          tone="#EA580C"
          note="Need your review"
          onPress={() => onNavigate?.("requests")}
        />
      </View>

      {/* ── Needs Attention (Pending Requests) ── */}
      <View style={dash.sectionHeader}>
        <View>
          <Text style={dash.sectionTitle}>Needs your attention</Text>
          <Text style={dash.sectionHint}>Registration requests waiting in queue</Text>
        </View>
        <Pressable onPress={() => onNavigate?.("requests")} style={dash.linkButton}>
          <Text style={dash.linkText}>View all</Text>
          <Ionicons name="chevron-forward" size={13} color="#2563EB" />
        </Pressable>
      </View>

      {pendingSchools.length > 0 ? (
        pendingSchools.map((school) => (
          <Pressable
            key={school.id}
            onPress={() => onNavigate?.("requests")}
            style={({ pressed }) => [dash.attentionCard, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.cardTop}>
              <View style={[styles.recordIcon, { backgroundColor: "#FFF7D6" }]}>
                <Ionicons name="business" size={18} color="#B57900" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cardTitle}>{school.title}</Text>
                <Text style={styles.cardSubtitle}>{school.subtitle}</Text>
              </View>
              <StatusBadge status={school.status} />
            </View>
            <Text style={styles.field}>
              Registration request · {school.fields?.[0] ?? "Documents submitted"}
            </Text>
          </Pressable>
        ))
      ) : (
        <View style={styles.empty}>
          <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
          <Text style={styles.emptyText}>All school requests are clear.</Text>
        </View>
      )}

      {/* ── Recent Payments Activity ── */}
      <View style={dash.sectionHeader}>
        <View>
          <Text style={dash.sectionTitle}>Recent payments</Text>
          <Text style={dash.sectionHint}>Latest subscription and withdrawal activity</Text>
        </View>
        <Pressable onPress={() => onNavigate?.("payments")} style={dash.linkButton}>
          <Text style={dash.linkText}>View all</Text>
          <Ionicons name="chevron-forward" size={13} color="#2563EB" />
        </Pressable>
      </View>

      <View style={dash.paymentCard}>
        <View style={dash.paymentHead}>
          <View style={dash.paymentHeadIcon}>
            <Ionicons name="wallet" size={17} color="#2563EB" />
          </View>
          <View style={{ flex: 1, marginLeft: 9 }}>
            <Text style={styles.cardTitle}>Payment Activity</Text>
            <Text style={styles.cardSubtitle}>Subscriptions & withdrawals</Text>
          </View>
          <View style={dash.countPill}>
            <Text style={dash.countText}>{Math.min(payments.length, 4)} latest</Text>
          </View>
        </View>

        {payments.slice(0, 4).map((payment, index) => (
          <Pressable
            key={payment.id}
            onPress={() => onNavigate?.("payments")}
            style={({ pressed }) => [
              dash.paymentRow,
              index > 0 && dash.paymentBorder,
              pressed && { backgroundColor: "#FAFCFF" },
            ]}
          >
            <View
              style={[
                dash.paymentIcon,
                {
                  backgroundColor:
                    payment.status === "completed"
                      ? "#ECFDF3"
                      : payment.status === "pending"
                      ? "#FFF7E6"
                      : "#EEF2FF",
                },
              ]}
            >
              <Ionicons
                name={
                  payment.status === "completed"
                    ? "checkmark-circle"
                    : payment.status === "pending"
                    ? "time"
                    : "sync"
                }
                size={17}
                color={
                  payment.status === "completed"
                    ? "#16A34A"
                    : payment.status === "pending"
                    ? "#EA580C"
                    : "#2563EB"
                }
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {payment.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {payment.subtitle}
              </Text>
            </View>
            <View style={dash.paymentRight}>
              <StatusBadge status={payment.status} />
              <View style={dash.rowArrow}>
                <Ionicons name="chevron-forward" size={13} color="#667085" />
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* ── Live Fleet Map ── */}
      <SuperAdminFleetMap />
    </AdminPageFrame>
  );
}

function QuickActionCard({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [dash.quickCard, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={dash.quickCardTop}>
        <View style={[dash.quickCardIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={dash.quickArrowBtn}>
          <Ionicons name="arrow-forward" size={12} color="#172554" />
        </View>
      </View>
      <Text style={dash.quickCardTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={dash.quickCardSub} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
  note,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: string;
  note: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [dash.summaryTile, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={dash.summaryTileTop}>
        <View style={[dash.summaryIcon, { backgroundColor: `${tone}18` }]}>
          <Ionicons name={icon} size={16} color={tone} />
        </View>
        <View style={dash.summaryArrow}>
          <Ionicons name="chevron-forward" size={12} color="#98A2B3" />
        </View>
      </View>
      <Text style={dash.summaryValue}>{value}</Text>
      <Text style={dash.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={dash.summaryNote} numberOfLines={1}>
        {note}
      </Text>
    </Pressable>
  );
}

function HealthItem({
  icon,
  label,
  value,
  tone,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [dash.healthItem, pressed && { opacity: 0.85 }]}>
      <View style={[dash.healthIcon, { backgroundColor: `${tone}16` }]}>
        <Ionicons name={icon} size={15} color={tone} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={dash.healthLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={dash.healthValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

const dash = StyleSheet.create({
  // Hero
  hero: {
    borderRadius: 20,
    backgroundColor: "#172554",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  heroCopy: { flex: 1 },
  liveLabel: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  liveDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#55E38B" },
  liveText: { color: "#B6F6CC", fontFamily: FONT.bold, fontSize: 8, letterSpacing: 0.7 },
  heroTitle: { color: "#FFFFFF", fontFamily: FONT.display, fontSize: 18, marginTop: 10 },
  heroSubtitle: {
    color: "#C7D2FE",
    fontFamily: FONT.regular,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 4,
  },
  heroOrb: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  // Health rail
  healthRail: { flexDirection: "row", gap: 7, marginBottom: 12 },
  healthItem: {
    flex: 1,
    minHeight: 56,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#172554",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  healthIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  healthLabel: { color: "#667085", fontFamily: FONT.semibold, fontSize: 8.5 },
  healthValue: { color: "#101828", fontFamily: FONT.display, fontSize: 15, marginTop: 1 },

  // Section headers
  sectionHeaderRow: { marginTop: 4, marginBottom: 8 },
  sectionTitle: { color: "#101828", fontFamily: FONT.display, fontSize: 14.5 },
  sectionSub: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 1 },

  // Quick Action 2x2 Grid
  quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginBottom: 12 },
  quickCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 90,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 15,
    padding: 11,
    shadowColor: "#172554",
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  quickCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  quickCardIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  quickArrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 99,
    backgroundColor: "#FFD60A",
    alignItems: "center",
    justifyContent: "center",
  },
  quickCardTitle: { color: "#101828", fontFamily: FONT.bold, fontSize: 12 },
  quickCardSub: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 2 },

  // Summary Tiles (2x2 Grid)
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginBottom: 12 },
  summaryTile: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 94,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    backgroundColor: "#FFFFFF",
    padding: 11,
    shadowColor: "#172554",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  summaryTileTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  summaryIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  summaryArrow: { width: 20, height: 20, borderRadius: 6, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
  summaryValue: { color: "#101828", fontFamily: FONT.display, fontSize: 17 },
  summaryLabel: { color: "#667085", fontFamily: FONT.semibold, fontSize: 10, marginTop: 2 },
  summaryNote: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 8.5, marginTop: 1 },

  // Attention Cards
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6, marginBottom: 6 },
  sectionHint: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 1 },
  linkButton: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#D9E2FF",
  },
  linkText: { color: "#2563EB", fontFamily: FONT.bold, fontSize: 10 },
  attentionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 15,
    padding: 12,
    marginBottom: 9,
    shadowColor: "#172554",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  // Payment Card
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: "#172554",
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  paymentHead: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  paymentHeadIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  countPill: { borderRadius: 99, backgroundColor: "#F2F4F7", paddingHorizontal: 7, paddingVertical: 4 },
  countText: { color: "#667085", fontFamily: FONT.bold, fontSize: 8.5 },
  paymentRow: { minHeight: 60, paddingVertical: 8, flexDirection: "row", alignItems: "center" },
  paymentRight: { flexDirection: "row", alignItems: "center", gap: 5, marginLeft: 6 },
  rowArrow: { width: 22, height: 22, borderRadius: 7, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center", marginLeft: 2 },
  paymentBorder: { borderTopWidth: 1, borderTopColor: "#F0F2F5" },
  paymentIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
