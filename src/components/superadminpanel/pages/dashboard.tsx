import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminPageFrame, COLORS, FONT, StatusBadge, styles } from "./pagekit";
import { metrics } from "./mockDataDashboard";
import { schools, orders, OrderRecord } from "./mockData";
import SuperAdminFleetMap from "./superadminmap";

export default function SuperAdminDashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const pendingSchools = schools.filter((item) => item.status === "pending");
  const keyMetrics = metrics.slice(0, 6);

  // Collapsible section states
  const [quickOpen, setQuickOpen] = useState(true);
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [snapshotOpen, setSnapshotOpen] = useState(true);
  const [financialsOpen, setFinancialsOpen] = useState(true);
  const [attentionOpen, setAttentionOpen] = useState(true);

  // Selected Order modal state
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

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

      {/* ── 3. Quick Action Hub (Collapsible Control Box) ── */}
      <View style={dash.sectionCard}>
        <Pressable
          onPress={() => setQuickOpen(!quickOpen)}
          style={dash.sectionCardHeader}
        >
          <View style={[dash.sectionCardIcon, { backgroundColor: "#FFF8DB" }]}>
            <Ionicons name="flash" size={16} color={COLORS.gold} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={dash.sectionCardTitle}>Quick Actions</Text>
            <Text style={dash.sectionCardSubtitle}>One-tap shortcuts to manage platform</Text>
          </View>
          <View style={dash.sectionBadge}>
            <Text style={dash.sectionBadgeText}>4 SHORTCUTS</Text>
          </View>
          <View style={dash.chevronBtn}>
            <Ionicons name={quickOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.navy} />
          </View>
        </Pressable>

        {quickOpen ? (
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
        ) : null}
      </View>

      {/* ── 4. Recent Subscription Orders (Collapsible & Scrollable) ── */}
      <View style={dash.sectionCard}>
        <Pressable
          onPress={() => setOrdersOpen(!ordersOpen)}
          style={dash.sectionCardHeader}
        >
          <View style={[dash.sectionCardIcon, { backgroundColor: "#ECFDF3" }]}>
            <Ionicons name="cart" size={16} color={COLORS.green} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={dash.sectionCardTitle}>Recent Subscription Orders</Text>
            <Text style={dash.sectionCardSubtitle}>{orders.length} parent payments recorded</Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onNavigate?.("subscriptions");
            }}
            style={dash.viewAllBtn}
          >
            <Text style={dash.viewAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.blue} />
          </Pressable>
          <View style={dash.chevronBtn}>
            <Ionicons name={ordersOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.navy} />
          </View>
        </Pressable>

        {ordersOpen ? (
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 290 }}
          >
            {orders.map((order, idx) => (
              <Pressable
                key={order.id}
                onPress={() => setSelectedOrder(order)}
                style={({ pressed }) => [
                  dash.orderRow,
                  idx > 0 && dash.orderRowBorder,
                  pressed && { backgroundColor: "#F8FAFC" },
                ]}
              >
                {/* Left avatar icon */}
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

                {/* Right amount & status badge */}
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
                  <Ionicons name="chevron-forward" size={11} color={COLORS.faint} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* ── 5. Platform Snapshot (Collapsible Metrics Box) ── */}
      <View style={dash.sectionCard}>
        <Pressable
          onPress={() => setSnapshotOpen(!snapshotOpen)}
          style={dash.sectionCardHeader}
        >
          <View style={[dash.sectionCardIcon, { backgroundColor: "#EEF2FF" }]}>
            <Ionicons name="stats-chart" size={16} color={COLORS.blue} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={dash.sectionCardTitle}>Platform Snapshot</Text>
            <Text style={dash.sectionCardSubtitle}>Tap any metric card to open records</Text>
          </View>
          <View style={dash.sectionBadge}>
            <Text style={dash.sectionBadgeText}>6 METRICS</Text>
          </View>
          <View style={dash.chevronBtn}>
            <Ionicons name={snapshotOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.navy} />
          </View>
        </Pressable>

        {snapshotOpen ? (
          <View style={dash.innerMetricGrid}>
            {keyMetrics.map((metric) => {
              const color = metric.color ?? COLORS.blue;
              return (
                <Pressable
                  key={metric.label}
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
                  style={({ pressed }) => [dash.innerMetricCard, pressed && { transform: [{ scale: 0.98 }] }]}
                >
                  <View style={dash.innerMetricHeader}>
                    <View style={[dash.innerMetricIcon, { backgroundColor: `${color}15` }]}>
                      <Ionicons name={metric.icon} size={17} color={color} />
                    </View>
                    <View style={dash.innerMetricArrow}>
                      <Ionicons name="chevron-forward" size={12} color={COLORS.navy} />
                    </View>
                  </View>
                  <Text style={dash.innerMetricLabel}>{metric.label}</Text>
                  <Text style={dash.innerMetricValue}>{metric.value}</Text>
                  {metric.note ? (
                    <View style={dash.innerMetricNoteBadge}>
                      <Text style={dash.innerMetricNoteText}>{metric.note}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* ── 6. Financials & Plans (Collapsible Box) ── */}
      <View style={dash.sectionCard}>
        <Pressable
          onPress={() => setFinancialsOpen(!financialsOpen)}
          style={dash.sectionCardHeader}
        >
          <View style={[dash.sectionCardIcon, { backgroundColor: "#FDF2F8" }]}>
            <Ionicons name="card" size={16} color="#DB2777" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={dash.sectionCardTitle}>Financials & Plans</Text>
            <Text style={dash.sectionCardSubtitle}>Revenue & subscription metrics</Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onNavigate?.("payments");
            }}
            style={dash.viewAllBtn}
          >
            <Text style={dash.viewAllText}>Details</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.blue} />
          </Pressable>
          <View style={dash.chevronBtn}>
            <Ionicons name={financialsOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.navy} />
          </View>
        </Pressable>

        {financialsOpen ? (
          <View style={dash.innerSummaryGrid}>
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
        ) : null}
      </View>

      {/* ── 7. Needs Your Attention (Collapsible Box) ── */}
      <View style={dash.sectionCard}>
        <Pressable
          onPress={() => setAttentionOpen(!attentionOpen)}
          style={dash.sectionCardHeader}
        >
          <View style={[dash.sectionCardIcon, { backgroundColor: "#FFF7ED" }]}>
            <Ionicons name="alert-circle" size={16} color={COLORS.orange} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={dash.sectionCardTitle}>Needs Your Attention</Text>
            <Text style={dash.sectionCardSubtitle}>Registration requests awaiting review</Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onNavigate?.("requests");
            }}
            style={dash.viewAllBtn}
          >
            <Text style={dash.viewAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.blue} />
          </Pressable>
          <View style={dash.chevronBtn}>
            <Ionicons name={attentionOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.navy} />
          </View>
        </Pressable>

        {attentionOpen ? (
          pendingSchools.length > 0 ? (
            pendingSchools.map((school) => (
              <Pressable
                key={school.id}
                onPress={() => onNavigate?.("requests")}
                style={({ pressed }) => [dash.innerAttentionCard, pressed && { opacity: 0.9 }]}
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
          )
        ) : null}
      </View>

      {/* ── 8. Live Fleet Map ── */}
      <SuperAdminFleetMap />

      {/* ── Order Detail Modal ── */}
      <Modal
        visible={Boolean(selectedOrder)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>ORDER RECEIPT</Text>
                <Text style={styles.sheetTitle}>{selectedOrder?.id}</Text>
              </View>
              <Pressable onPress={() => setSelectedOrder(null)}>
                <Ionicons name="close-circle" size={24} color={COLORS.faint} />
              </Pressable>
            </View>

            {selectedOrder ? (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
                <View style={dash.orderModalAmountBox}>
                  <Text style={dash.orderModalAmountLabel}>TOTAL AMOUNT</Text>
                  <Text style={dash.orderModalAmount}>{selectedOrder.amount}</Text>
                  <StatusBadge status={selectedOrder.status} />
                </View>

                <View style={dash.orderModalDetailRow}>
                  <Text style={dash.orderModalLabel}>Parent Name</Text>
                  <Text style={dash.orderModalVal}>{selectedOrder.parentName}</Text>
                </View>

                <View style={dash.orderModalDetailRow}>
                  <Text style={dash.orderModalLabel}>Student / Child</Text>
                  <Text style={dash.orderModalVal}>{selectedOrder.studentName}</Text>
                </View>

                <View style={dash.orderModalDetailRow}>
                  <Text style={dash.orderModalLabel}>School</Text>
                  <Text style={dash.orderModalVal}>{selectedOrder.schoolName}</Text>
                </View>

                <View style={dash.orderModalDetailRow}>
                  <Text style={dash.orderModalLabel}>Plan Name</Text>
                  <Text style={dash.orderModalVal}>{selectedOrder.planName}</Text>
                </View>

                <View style={dash.orderModalDetailRow}>
                  <Text style={dash.orderModalLabel}>Payment Mode</Text>
                  <Text style={dash.orderModalVal}>{selectedOrder.paymentMode}</Text>
                </View>

                <View style={dash.orderModalDetailRow}>
                  <Text style={dash.orderModalLabel}>Date & Time</Text>
                  <Text style={dash.orderModalVal}>{selectedOrder.date}</Text>
                </View>
              </ScrollView>
            ) : null}

            <Pressable
              onPress={() => {
                setSelectedOrder(null);
                onNavigate?.("subscriptions");
              }}
              style={styles.primarySheetAction}
            >
              <Ionicons name="card-outline" size={16} color={COLORS.ink} />
              <Text style={styles.actionText}>Manage Subscriptions</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
      style={({ pressed }) => [dash.innerSummaryTile, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={dash.innerSummaryTop}>
        <View style={[dash.innerSummaryIcon, { backgroundColor: `${tone}18` }]}>
          <Ionicons name={icon} size={16} color={tone} />
        </View>
        <View style={dash.innerSummaryArrow}>
          <Ionicons name="chevron-forward" size={12} color={COLORS.navy} />
        </View>
      </View>
      <Text style={dash.innerSummaryValue}>{value}</Text>
      <Text style={dash.innerSummaryLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={dash.innerSummaryNote} numberOfLines={1}>
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

  // Universal Section Card Container (Bordered Outer Box)
  sectionCard: {
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
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  sectionCardIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCardTitle: { color: "#101828", fontFamily: FONT.display, fontSize: 13.5 },
  sectionCardSubtitle: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 1 },
  sectionBadge: { backgroundColor: "#F2F4F7", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  sectionBadgeText: { color: "#667085", fontFamily: FONT.bold, fontSize: 8.5, letterSpacing: 0.5 },
  chevronBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
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

  // Quick Action Grid inside Box
  quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  quickBtnCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 96,
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

  // Orders Rows inside Box
  orderRow: { minHeight: 62, paddingVertical: 8, flexDirection: "row", alignItems: "center" },
  orderRowBorder: { borderTopWidth: 1, borderTopColor: "#F0F2F5" },
  orderAvatar: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  orderIdText: { color: COLORS.navy, fontFamily: FONT.bold, fontSize: 11 },
  orderParentText: { color: COLORS.ink, fontFamily: FONT.semibold, fontSize: 11.5, flex: 1 },
  orderStudentText: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 10, marginTop: 2 },
  orderDateText: { color: COLORS.faint, fontFamily: FONT.regular, fontSize: 9, marginTop: 2 },
  orderRight: { alignItems: "flex-end", gap: 3, marginLeft: 8 },
  orderAmountText: { color: COLORS.ink, fontFamily: FONT.display, fontSize: 13 },
  orderStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  orderStatusText: { fontFamily: FONT.bold, fontSize: 8 },

  // Inner Platform Metrics Grid
  innerMetricGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  innerMetricCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 100,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 14,
    padding: 10,
  },
  innerMetricHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 },
  innerMetricIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  innerMetricArrow: { width: 20, height: 20, borderRadius: 6, backgroundColor: "#FFF8DB", alignItems: "center", justifyContent: "center" },
  innerMetricLabel: { color: COLORS.muted, fontFamily: FONT.semibold, fontSize: 9.5 },
  innerMetricValue: { color: COLORS.ink, fontFamily: FONT.display, fontSize: 19, marginTop: 2 },
  innerMetricNoteBadge: { alignSelf: "flex-start", marginTop: 3, backgroundColor: "#E4E7EC", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 },
  innerMetricNoteText: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 8 },

  // Inner Summary Grid (Financials)
  innerSummaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  innerSummaryTile: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    backgroundColor: "#F8FAFC",
    padding: 10,
  },
  innerSummaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 },
  innerSummaryIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  innerSummaryArrow: { width: 20, height: 20, borderRadius: 6, backgroundColor: "#FFF8DB", alignItems: "center", justifyContent: "center" },
  innerSummaryValue: { color: "#101828", fontFamily: FONT.display, fontSize: 16 },
  innerSummaryLabel: { color: "#667085", fontFamily: FONT.semibold, fontSize: 9.5, marginTop: 2 },
  innerSummaryNote: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 8.5, marginTop: 1 },

  // Attention inside Box
  innerAttentionCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 14,
    padding: 11,
    marginTop: 4,
  },

  // Order Modal Styles
  orderModalAmountBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  orderModalAmountLabel: { color: COLORS.muted, fontFamily: FONT.bold, fontSize: 9, letterSpacing: 0.8 },
  orderModalAmount: { color: COLORS.ink, fontFamily: FONT.display, fontSize: 24, marginVertical: 4 },
  orderModalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  orderModalLabel: { color: COLORS.muted, fontFamily: FONT.semibold, fontSize: 11 },
  orderModalVal: { color: COLORS.ink, fontFamily: FONT.bold, fontSize: 11.5, textAlign: "right", flex: 1, marginLeft: 10 },
});
