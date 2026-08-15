import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DashboardPage from "./dashboard";
import SchoolManagementPage from "./schoolmanagement";
import SchoolRequestsPage from "./schoolrequests";
import ParentsPage from "./parents";
import StudentsPage from "./students";
import DriversPage from "./drivers";
import BusesPage from "./buses";
import LiveTrackingPage from "./livetracking";
import RoutesPage from "./routes";
import SubscriptionsPage from "./subscriptions";
import PaymentRequestsPage from "./paymentrequests";
import WithdrawalRequestsPage from "./withdrawalrequests";
import RefundRequestsPage from "./refundrequests";
import NotificationsPage from "./notifications";
import ReportsPage from "./reports";
import AdminSecurityPage from "./adminsecurity";
import AuditLogsPage from "./auditlogs";
import SuperAdminSettingsPage from "./settings";
import { styles } from "./pagekit";

type Page = "dashboard" | "schools" | "requests" | "parents" | "students" | "drivers" | "buses" | "tracking" | "routes" | "subscriptions" | "payments" | "withdrawals" | "refunds" | "notifications" | "reports" | "security" | "audit" | "settings";
type NavItem = { key: Page; label: string; icon: keyof typeof Ionicons.glyphMap };

const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "grid-outline" },
  { key: "schools", label: "Schools", icon: "business-outline" },
  { key: "requests", label: "Requests", icon: "git-pull-request-outline" },
  { key: "parents", label: "Parents", icon: "people-outline" },
  { key: "students", label: "Students", icon: "school-outline" },
  { key: "drivers", label: "Drivers", icon: "person-outline" },
  { key: "buses", label: "Buses", icon: "bus-outline" },
  { key: "tracking", label: "Live map", icon: "navigate-outline" },
  { key: "routes", label: "Routes", icon: "git-branch-outline" },
  { key: "subscriptions", label: "Subscriptions", icon: "card-outline" },
  { key: "payments", label: "Payments", icon: "wallet-outline" },
  { key: "withdrawals", label: "Withdrawals", icon: "arrow-up-circle-outline" },
  { key: "refunds", label: "Refunds", icon: "return-down-back-outline" },
  { key: "notifications", label: "Alerts", icon: "notifications-outline" },
  { key: "reports", label: "Reports", icon: "bar-chart-outline" },
  { key: "security", label: "Security", icon: "shield-checkmark-outline" },
  { key: "audit", label: "Audit", icon: "list-outline" },
  { key: "settings", label: "Settings", icon: "settings-outline" },
];

// The most-used routes stay visible. Everything else remains one tap away in the drawer.
const TOP_NAV: Page[] = ["dashboard", "schools", "requests", "buses", "tracking", "routes", "payments", "settings"];

export default function SuperAdminPagesRouter({ onLogout }: { onLogout?: () => void }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<Page>("dashboard");
  const [drawer, setDrawer] = useState(false);
  const current = NAV.find((item) => item.key === page) ?? NAV[0];

  const navigate = (next: string) => {
    const found = NAV.find((item) => item.key === next);
    if (found) setPage(found.key);
    setDrawer(false);
  };

  const body = page === "dashboard" ? <DashboardPage onNavigate={navigate} />
    : page === "schools" ? <SchoolManagementPage />
      : page === "requests" ? <SchoolRequestsPage />
        : page === "parents" ? <ParentsPage onNavigate={navigate} />
          : page === "students" ? <StudentsPage />
            : page === "drivers" ? <DriversPage onNavigate={navigate} />
              : page === "buses" ? <BusesPage />
                : page === "tracking" ? <LiveTrackingPage />
                  : page === "routes" ? <RoutesPage />
                    : page === "subscriptions" ? <SubscriptionsPage />
                      : page === "payments" ? <PaymentRequestsPage onNavigate={navigate} />
                        : page === "withdrawals" ? <WithdrawalRequestsPage />
                          : page === "refunds" ? <RefundRequestsPage />
                            : page === "notifications" ? <NotificationsPage />
                              : page === "reports" ? <ReportsPage />
                                : page === "security" ? <AdminSecurityPage onLogout={onLogout} />
                                  : page === "audit" ? <AuditLogsPage />
                                    : <SuperAdminSettingsPage onLogout={onLogout} />;

  return (
    <View style={ui.page}>
      <View style={[ui.header, { paddingTop: insets.top + 8 }]}>
        <View style={ui.brandGroup}>
          <View style={ui.brandIcon}><Ionicons name="shield-checkmark" size={19} color="#172554" /></View>
          <View style={ui.routeTitle}>
            <Text style={ui.brandName}>Track<Text style={{ color: "#765900" }}>IQ</Text></Text>
            <Text style={ui.brandCaption}>SUPER ADMIN  /  {current.label.toUpperCase()}</Text>
          </View>
        </View>
        <View style={ui.headerRight}>
          <Pressable accessibilityLabel="Open alerts" onPress={() => navigate("notifications")} style={ui.iconButton}>
            <Ionicons name="notifications-outline" size={18} color="#172033" />
            <View style={ui.alertBadge}><Text style={ui.alertBadgeText}>3</Text></View>
          </Pressable>
          <Pressable accessibilityLabel="Open navigation" onPress={() => setDrawer(true)} style={ui.menuButton}>
            <Ionicons name="menu" size={20} color="#172033" />
          </Pressable>
        </View>
      </View>

      <View style={ui.routeBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.routeScroll}>
          {NAV.filter((item) => TOP_NAV.includes(item.key)).map((item) => {
            const active = page === item.key;
            return (
              <Pressable key={item.key} onPress={() => navigate(item.key)} style={[ui.routeTab, active && ui.routeTabActive]}>
                <Ionicons name={item.icon} size={15} color={active ? "#172033" : "#667085"} />
                <Text style={[ui.routeLabel, active && ui.routeLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 30) }}>
        {body}
      </ScrollView>

      <Modal visible={drawer} transparent animationType="fade" onRequestClose={() => setDrawer(false)}>
        <View style={ui.overlay}>
          <View style={ui.drawer}>
            <View style={ui.drawerHeader}>
              <View>
                <Text style={styles.title}>Control centre</Text>
                <Text style={ui.drawerSub}>Navigate your operations</Text>
              </View>
              <Pressable accessibilityLabel="Close navigation" onPress={() => setDrawer(false)} style={ui.closeButton}>
                <Ionicons name="close" size={20} color="#344054" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              {NAV.map((item) => {
                const active = page === item.key;
                return (
                  <Pressable key={item.key} onPress={() => navigate(item.key)} style={[ui.drawerItem, active && ui.drawerItemActive]}>
                    <Ionicons name={item.icon} size={18} color={active ? "#B57900" : "#667085"} />
                    <Text style={[ui.drawerLabel, active && ui.drawerLabelActive]}>{item.label}</Text>
                    {active ? <Ionicons name="chevron-forward" size={15} color="#B57900" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={onLogout} style={ui.logoutButton}>
              <Ionicons name="log-out-outline" size={17} color="#DC2626" />
              <Text style={ui.logoutText}>Logout</Text>
            </Pressable>
          </View>
          <Pressable style={{ flex: 1 }} onPress={() => setDrawer(false)} />
        </View>
      </Modal>
    </View>
  );
}

const ui = {
  page: { flex: 1, backgroundColor: "#F8F9FB" },
  header: { minHeight: 82, width: "100%" as const, flexShrink: 0, backgroundColor: "#FFD500", paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, gap: 12, borderBottomLeftRadius: 26, borderBottomRightRadius: 26, shadowColor: "#8B7300", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8, zIndex: 10 },
  brandGroup: { flex: 1, minWidth: 0, flexDirection: "row" as const, alignItems: "center" as const, gap: 9 },
  brandIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: "#FFF4A8", alignItems: "center" as const, justifyContent: "center" as const },
  brandName: { color: "#111827", fontFamily: "Sora-Bold", fontSize: 18 },
  brandCaption: { color: "#5F4A00", fontFamily: "Inter-Bold", fontSize: 8, letterSpacing: 0.7, marginTop: 3 },
  routeTitle: { flex: 1, minWidth: 0, paddingHorizontal: 2 },
  headerRight: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  menuButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.55)", alignItems: "center" as const, justifyContent: "center" as const },
  iconButton: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", alignItems: "center" as const, justifyContent: "center" as const, position: "relative" as const },
  alertBadge: { position: "absolute" as const, right: -2, top: -3, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: "#DC2626", alignItems: "center" as const, justifyContent: "center" as const, borderWidth: 2, borderColor: "#FFFFFF" },
  alertBadgeText: { color: "#FFFFFF", fontFamily: "Inter-Bold", fontSize: 7, textAlign: "center" as const },
  profileButton: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#172554", alignItems: "center" as const, justifyContent: "center" as const },
  profileText: { color: "#FFD60A", fontFamily: "Inter-Bold", fontSize: 10 },
  routeBar: { backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E4E7EC" },
  routeScroll: { gap: 7, paddingHorizontal: 12, paddingVertical: 10 },
  routeTab: { minHeight: 36, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8, flexDirection: "row" as const, alignItems: "center" as const, gap: 5, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#EEF2F6" },
  routeTabActive: { backgroundColor: "#FFD60A", borderColor: "#FFD60A" },
  routeLabel: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 10.5 },
  routeLabelActive: { color: "#172033", fontFamily: "Inter-Bold" },
  overlay: { flex: 1, flexDirection: "row" as const, backgroundColor: "rgba(15,23,42,0.48)" },
  drawer: { width: "86%" as const, maxWidth: 360, minHeight: "100%" as const, backgroundColor: "#FFFFFF", paddingHorizontal: 18, paddingTop: 52, paddingBottom: 20 },
  drawerHeader: { flexDirection: "row" as const, alignItems: "flex-start" as const, justifyContent: "space-between" as const, marginBottom: 14 },
  drawerSub: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 11, marginTop: 3 },
  closeButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#F2F4F7", alignItems: "center" as const, justifyContent: "center" as const },
  drawerItem: { minHeight: 44, flexDirection: "row" as const, alignItems: "center" as const, gap: 10, paddingHorizontal: 10, borderRadius: 11 },
  drawerItemActive: { backgroundColor: "#FFF8DB" },
  drawerLabel: { flex: 1, color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 12 },
  drawerLabelActive: { color: "#B57900", fontFamily: "Inter-Bold" },
  logoutButton: { marginTop: 14, minHeight: 45, borderRadius: 13, borderWidth: 1, borderColor: "#FECACA", flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 7 },
  logoutText: { color: "#DC2626", fontFamily: "Inter-Bold", fontSize: 12 },
};
