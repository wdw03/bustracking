import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminPageFrame, COLORS, FONT, MetricCard, StatusBadge, styles } from "./pagekit";
import { metrics } from "./mockDataDashboard";
import { schools, orders, payments } from "./mockData";
import SuperAdminFleetMap from "./superadminmap";

export default function SuperAdminDashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const pendingSchools = schools.filter((item) => item.status === "pending");
  const keyMetrics = metrics.slice(0, 6);

  return (
    <AdminPageFrame
      eyebrow="SUPER ADMIN / CONTROL CENTRE"
      title="Dashboard"
      subtitle="Live overview of schools, orders, fleet and payments."
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
      {/* ── 1. Hero Header Banner ── */}
      <View style={dash.hero}>
        <View style={dash.heroCopy}>
          <View style={dash.liveLabel}>
            <View style={dash.liveDot} />
            <Text style={dash.liveText}>SYSTEM ONLINE · ALL SERVICES HEALTHY</Text>
          </View>
          <Text style={dash.heroTitle}>Good morning, Super Admin</Text>
          <Text style={dash.heroSubtitle}>
            Review new subscription orders, pending school approvals, and live fleet GPS.
          </Text>
        </View>
        <View style={dash.heroOrb}>
          <Ionicons name="shield-checkmark" size={28} color="#FFD60A" />
        </View>
      </View>

      {/* ── 2. Live Health Pulse Strip ── */}
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

      {/* ── 3. Quick Action Hub (Enclosed Control Box) ── */}
      <View style={dash.hubBox}>
        <View style={dash.hubHeader}>
          <View style={dash.hubHeaderIcon}>
            <Ionicons name="flash" size={15} color={COLORS.yellow} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={dash.hubTitle}>Quick Actions</Text>
            <Text style={dash.hubSubtitle}>One-tap shortcuts to manage platform</Text>
          </View>
        </View>

        <View style={dash.quickGrid}>
          <QuickActionBtn
            icon="git-pull-request"
            iconColor="#EA580C"
            iconBg="#FFF1E6"
            title="School Requests"
            badge={`${pendingSchools.length} Pending`}
            desc="Review & approve schools"
            onPress={() => onNavigate?.("requests")}
          />
          <QuickActionBtn
            icon="navigate"
            iconColor="#16A34A"
            iconBg="#E6F7ED"
            title="Live Fleet Map"
            badge="2 Live"
            desc="Track running buses"
            onPress={() => onNavigate?.("tracking")}
          />
          <QuickActionBtn
            icon="wallet"
            iconColor="#2563EB"
            iconBg="#EEF2FF"
            title="Payments & Payouts"
            badge="₹41K Queue"
            desc="Process transactions"
            onPress={() => onNavigate?.("payments")}
          />
          <QuickActionBtn
            icon="people"
            iconColor="#7C3AED"
            iconBg="#F5E6FF"
            title="Parent Directory"
            badge="2,176 Total"
            desc="Browse & filter schools"
            onPress={() => onNavigate?.("parents")}
          />
        </View>
      </View>

      {/* ── 4. Recent Subscription Orders (NEW ORDERS SECTION) ── */}
      <View style={dash.ordersBox}>
        <View style={dash.ordersHead}>
          <View style={dash.ordersHeadIcon}>
            <Ionicons name="cart" size={17} color={COLORS.green} />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={dash.ordersTitle}>Recent Subscription Orders</Text>
            <Text style={dash.ordersSubtitle}>Parent subscription payments across all schools</Text>
          </View>
          <Pressable onPress={() => onNavigate?.("subscriptions")} style={dash.viewAllBtn}>
            <Text style={dash.viewAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.blue} />
          </Pressable>
        </View>

        {orders.slice(0, 4).map((order, idx) => (
          <Pressable
            key={order.id}
            onPress={() => onNavigate?.("subscriptions")}
            style={({ pressed }) => [
              dash.orderRow,
              idx > 0 && dash.orderRowBorder,
              pressed && { backgroundColor: "#F8FAFC" },
            ]}
          >
            {/* Left order avatar badge */}
            <View
              style={[
                dash.orderAvatar,
                {
                  backgroundColor:
                    order.status === "paid"
                      ? "#ECFDF3"
                      : order.status === "pending"
                      ? "#FFF7E6"
                      : "#FFF1F2",
                },
              ]}
            >
              <Ionicons
                name={
                  order.status === "paid"
                    ? "checkmark-circle"
                    : order.status === "pending"
                    ? "time"
                    : "alert-circle"
                }
                size={17}
                color={
                  order.status === "paid"
                    ? COLORS.green
                    : order.status === "pending"
                    ? COLORS.orange
                    : COLORS.red
                }
              />
            </View>

            {/* Middle details */}
            <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text style={dash.orderIdText}>{order.id}</Text>
                <Text style={dash.orderParentText} numberOfLines={1}>
                  · {order.parentName}
                </Text>
              </View>
              <Text style={dash.orderStudentText} numberOfLines={1}>
                {order.studentName} · {order.schoolName}
              </Text>
              <Text style={dash.orderDateText} numberOfLines={1}>
                {order.date} · {order.paymentMode}
              </Text>
            </View>

            {/* Right amount and status */}
            <View style={dash.orderRight}>
              <Text style={dash.orderAmountText}>{order.amount}</Text>
              <View
                style={[
                  dash.orderStatusBadge,
                  {
                    backgroundColor:
                      order.status === "paid"
                        ? "#ECFDF3"
                        : order.status === "pending"
                        ? "#FFF7E6"
                        : "#FFF1F2",
                  },
                ]}
              >
                <Text
                  style={[
                    dash.orderStatusText,
                    {
                      color:
                        order.status === "paid"
                          ? COLORS.green
                          : order.status === "pending"
                          ? COLORS.orange
                          : COLORS.red,
                    },
                  ]}
                >
                  {order.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* ── 5. Platform Snapshot (Metrics Grid) ── */}
      <View style={dash.sectionHeaderRow}>
        <Text style={dash.sectionTitle}>Platform Snapshot</Text>
        <Text style={dash.sectionSub}>Live metrics · Tap any card to navigate</Text>
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

      {/* ── 6. Financials & Plans Grid ── */}
      <View style={dash.sectionHeaderRow}>
        <Text style={dash.sectionTitle}>Financials & Plans</Text>
        <Text style={dash.sectionSub}>Revenue and active parent subscriptions</Text>
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
          note="Settled & processing"
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

      {/* ── 7. Needs Your Attention (Pending Approvals) ── */}
      <View style={dash.sectionHeader}>
        <View>
          <Text style={dash.sectionTitle}>Needs Your Attention</Text>
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

      {/* ── 8. Live Fleet Map ── */}
      <SuperAdminFleetMap />
    </AdminPageFrame>
  );
}

function QuickActionBtn({
  icon,
  iconColor,
  iconBg,
  title,
  badge,
  desc,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  badge: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [dash.quickBtnCard, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={dash.quickBtnTop}>
        <View style={[dash.quickBtnIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={17} color={iconColor} />
        </View>
        <View style={dash.quickBadgeWrap}>
          <Text style={dash.quickBadgeText}>{badge}</Text>
        </View>
      </View>
      <Text style={dash.quickBtnTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={dash.quickBtnDesc} numberOfLines={1}>
        {desc}
      </Text>
      <View style={dash.quickBtnBottom}>
        <Text style={dash.quickBtnGo}>Open section</Text>
        <Ionicons name="arrow-forward" size={11} color={COLORS.navy} />
      </View>
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

  // Control Hub Box
  hubBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 18,
    padding: 13,
    marginBottom: 12,
    shadowColor: "#172554",
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  hubHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 11 },
  hubHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#172554",
    alignItems: "center",
    justifyContent: "center",
  },
  hubTitle: { color: "#101828", fontFamily: FONT.display, fontSize: 14 },
  hubSubtitle: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 1 },

  // Quick Action Grid inside Hub
  quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  quickBtnCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 98,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 14,
    padding: 10,
  },
  quickBtnTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  quickBtnIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  quickBadgeWrap: { backgroundColor: "#EEF2FF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  quickBadgeText: { color: COLORS.blue, fontFamily: FONT.bold, fontSize: 8.5 },
  quickBtnTitle: { color: "#101828", fontFamily: FONT.bold, fontSize: 12 },
  quickBtnDesc: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9, marginTop: 2 },
  quickBtnBottom: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 7 },
  quickBtnGo: { color: COLORS.navy, fontFamily: FONT.bold, fontSize: 9 },

  // Orders Section Box
  ordersBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: "#172554",
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  ordersHead: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
    paddingBottom: 8,
  },
  ordersHeadIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ECFDF3",
    alignItems: "center",
    justifyContent: "center",
  },
  ordersTitle: { color: "#101828", fontFamily: FONT.display, fontSize: 13.5 },
  ordersSubtitle: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 1 },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewAllText: { color: COLORS.blue, fontFamily: FONT.bold, fontSize: 10 },
  orderRow: { minHeight: 64, paddingVertical: 9, flexDirection: "row", alignItems: "center" },
  orderRowBorder: { borderTopWidth: 1, borderTopColor: "#F0F2F5" },
  orderAvatar: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  orderIdText: { color: COLORS.navy, fontFamily: FONT.bold, fontSize: 11 },
  orderParentText: { color: COLORS.ink, fontFamily: FONT.semibold, fontSize: 11.5, flex: 1 },
  orderStudentText: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 10, marginTop: 2 },
  orderDateText: { color: COLORS.faint, fontFamily: FONT.regular, fontSize: 9, marginTop: 2 },
  orderRight: { alignItems: "flex-end", gap: 4, marginLeft: 8 },
  orderAmountText: { color: COLORS.ink, fontFamily: FONT.display, fontSize: 13 },
  orderStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  orderStatusText: { fontFamily: FONT.bold, fontSize: 8 },

  // Platform Section headers
  sectionHeaderRow: { marginTop: 4, marginBottom: 8 },
  sectionTitle: { color: "#101828", fontFamily: FONT.display, fontSize: 14.5 },
  sectionSub: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 1 },

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
});
