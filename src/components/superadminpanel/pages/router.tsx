import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
import { SuperAdminProvider } from "./store";

type Page =
  | "dashboard"
  | "schools"
  | "requests"
  | "parents"
  | "students"
  | "drivers"
  | "buses"
  | "tracking"
  | "routes"
  | "subscriptions"
  | "payments"
  | "withdrawals"
  | "refunds"
  | "notifications"
  | "reports"
  | "security"
  | "audit"
  | "settings";

type NavCategory = "All" | "Overview" | "Users" | "Fleet" | "Finance" | "System";

type NavItem = {
  key: Page;
  label: string;
  category: "Overview" | "Users" | "Fleet" | "Finance" | "System";
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
};

const NAV: NavItem[] = [
  // Overview
  { key: "dashboard", label: "Dashboard", category: "Overview", icon: "grid-outline" },
  { key: "reports", label: "Reports & Analytics", category: "Overview", icon: "bar-chart-outline" },
  { key: "audit", label: "Audit Logs", category: "Overview", icon: "list-outline" },

  // Schools & Users
  { key: "schools", label: "Schools", category: "Users", icon: "business-outline", badge: "4" },
  { key: "requests", label: "School Requests", category: "Users", icon: "git-pull-request-outline", badge: "1" },
  { key: "parents", label: "Parents", category: "Users", icon: "people-outline", badge: "12" },
  { key: "students", label: "Students", category: "Users", icon: "school-outline", badge: "5" },
  { key: "drivers", label: "Drivers", category: "Users", icon: "person-outline", badge: "8" },

  // Fleet & GPS
  { key: "buses", label: "Buses", category: "Fleet", icon: "bus-outline", badge: "6" },
  { key: "tracking", label: "Live GPS Map", category: "Fleet", icon: "navigate-outline", badge: "LIVE" },
  { key: "routes", label: "Routes & Stops", category: "Fleet", icon: "git-branch-outline", badge: "8" },

  // Finance
  { key: "subscriptions", label: "Subscriptions", category: "Finance", icon: "card-outline", badge: "4" },
  { key: "payments", label: "Payments", category: "Finance", icon: "wallet-outline", badge: "7" },
  { key: "withdrawals", label: "Withdrawals", category: "Finance", icon: "arrow-up-circle-outline", badge: "2" },
  { key: "refunds", label: "Refunds", category: "Finance", icon: "return-down-back-outline", badge: "1" },

  // System
  { key: "notifications", label: "Broadcast Alerts", category: "System", icon: "notifications-outline", badge: "3" },
  { key: "security", label: "Admin Security", category: "System", icon: "shield-checkmark-outline" },
  { key: "settings", label: "Settings & System", category: "System", icon: "settings-outline" },
];

function SuperAdminPagesRouterInner({ onLogout }: { onLogout?: () => void }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<Page>("dashboard");
  const [drawer, setDrawer] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<NavCategory>("All");

  const current = NAV.find((item) => item.key === page) ?? NAV[0];

  const navigate = (next: string) => {
    const found = NAV.find((item) => item.key === next);
    if (found) setPage(found.key);
    setDrawer(false);
  };

  // Filtered routes for the drawer
  const filteredNav = useMemo(() => {
    return NAV.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchSearch =
        !navSearch ||
        `${item.label} ${item.category} ${item.key}`.toLowerCase().includes(navSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, navSearch]);

  const body =
    page === "dashboard" ? (
      <DashboardPage onNavigate={navigate} />
    ) : page === "schools" ? (
      <SchoolManagementPage />
    ) : page === "requests" ? (
      <SchoolRequestsPage onNavigate={navigate} />
    ) : page === "parents" ? (
      <ParentsPage onNavigate={navigate} />
    ) : page === "students" ? (
      <StudentsPage />
    ) : page === "drivers" ? (
      <DriversPage onNavigate={navigate} />
    ) : page === "buses" ? (
      <BusesPage />
    ) : page === "tracking" ? (
      <LiveTrackingPage />
    ) : page === "routes" ? (
      <RoutesPage onNavigate={navigate} />
    ) : page === "subscriptions" ? (
      <SubscriptionsPage />
    ) : page === "payments" ? (
      <PaymentRequestsPage onNavigate={navigate} />
    ) : page === "withdrawals" ? (
      <WithdrawalRequestsPage />
    ) : page === "refunds" ? (
      <RefundRequestsPage />
    ) : page === "notifications" ? (
      <NotificationsPage />
    ) : page === "reports" ? (
      <ReportsPage />
    ) : page === "security" ? (
      <AdminSecurityPage onLogout={onLogout} />
    ) : page === "audit" ? (
      <AuditLogsPage onNavigate={navigate} />
    ) : (
      <SuperAdminSettingsPage onLogout={onLogout} />
    );

  return (
    <View style={ui.page}>
      {/* ── Top Yellow App Bar ── */}
      <View style={[ui.header, { paddingTop: insets.top + 8 }]}>
        <View style={ui.brandGroup}>
          <View style={ui.brandIcon}>
            <Ionicons name="shield-checkmark" size={19} color="#172554" />
          </View>
          <View style={ui.routeTitle}>
            <Text style={ui.brandName}>
              Track<Text style={{ color: "#765900" }}>IQ</Text>
            </Text>
            <Text style={ui.brandCaption}>
              SUPER ADMIN / {current.label.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={ui.headerRight}>
          <Pressable accessibilityLabel="Open alerts" onPress={() => navigate("notifications")} style={ui.iconButton}>
            <Ionicons name="notifications-outline" size={18} color="#172033" />
            <View style={ui.alertBadge}>
              <Text style={ui.alertBadgeText}>3</Text>
            </View>
          </Pressable>
          <Pressable accessibilityLabel="Open navigation" onPress={() => setDrawer(true)} style={ui.menuButton}>
            <Ionicons name="grid" size={18} color="#172033" />
          </Pressable>
        </View>
      </View>

      {/* ── Horizontal Scrollable Route Bar with Live Badges ── */}
      <View style={ui.routeBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.routeScroll}>
          {NAV.map((item) => {
            const active = page === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => navigate(item.key)}
                style={[ui.routeTab, active && ui.routeTabActive]}
              >
                <Ionicons name={item.icon} size={15} color={active ? "#172033" : "#667085"} />
                <Text style={[ui.routeLabel, active && ui.routeLabelActive]}>{item.label}</Text>
                {item.badge ? (
                  <View
                    style={[
                      ui.tabBadge,
                      active ? { backgroundColor: "#172554" } : { backgroundColor: "#E4E7EC" },
                    ]}
                  >
                    <Text
                      style={[
                        ui.tabBadgeText,
                        active ? { color: "#FFD60A" } : { color: "#475467" },
                      ]}
                    >
                      {item.badge}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Page Scroll Container ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 30) }}
      >
        {body}
      </ScrollView>

      {/* ── Navigation Drawer Modal with Search & Category Filters ── */}
      <Modal visible={drawer} transparent animationType="fade" onRequestClose={() => setDrawer(false)}>
        <View style={ui.overlay}>
          <View style={ui.drawer}>
            <View style={ui.drawerHeader}>
              <View>
                <Text style={styles.title}>Super Admin Hub</Text>
                <Text style={ui.drawerSub}>Filter & navigate 18 platform modules</Text>
              </View>
              <Pressable accessibilityLabel="Close navigation" onPress={() => setDrawer(false)} style={ui.closeButton}>
                <Ionicons name="close" size={20} color="#344054" />
              </Pressable>
            </View>

            {/* 🔍 Search Input */}
            <View style={ui.drawerSearch}>
              <Ionicons name="search" size={15} color="#98A2B3" />
              <TextInput
                value={navSearch}
                onChangeText={setNavSearch}
                placeholder="Search modules (e.g. buses, routes, parents)..."
                placeholderTextColor="#98A2B3"
                style={ui.drawerSearchInput}
              />
              {navSearch ? (
                <Pressable onPress={() => setNavSearch("")}>
                  <Ionicons name="close-circle" size={15} color="#98A2B3" />
                </Pressable>
              ) : null}
            </View>

            {/* 🏷️ Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.catScroll}>
              {(["All", "Overview", "Users", "Fleet", "Finance", "System"] as NavCategory[]).map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[ui.catPill, active && ui.catPillActive]}
                  >
                    <Text style={[ui.catPillText, active && ui.catPillTextActive]}>{cat}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 📋 Modules List */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {filteredNav.map((item) => {
                const active = page === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => navigate(item.key)}
                    style={[ui.drawerItem, active && ui.drawerItemActive]}
                  >
                    <View style={[ui.drawerIconWrap, active && { backgroundColor: "#172554" }]}>
                      <Ionicons name={item.icon} size={17} color={active ? "#FFD60A" : "#2563EB"} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[ui.drawerLabel, active && ui.drawerLabelActive]}>{item.label}</Text>
                      <Text style={ui.drawerCategoryText}>{item.category}</Text>
                    </View>
                    {item.badge ? (
                      <View style={[ui.drawerBadge, active && { backgroundColor: "#FFD60A" }]}>
                        <Text style={[ui.drawerBadgeText, active && { color: "#172554" }]}>{item.badge}</Text>
                      </View>
                    ) : null}
                    <Ionicons name="chevron-forward" size={14} color={active ? "#B57900" : "#D0D5DD"} />
                  </Pressable>
                );
              })}

              {filteredNav.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 12 }}>
                    No matching modules found
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* 🚪 Sign Out */}
            <Pressable onPress={onLogout} style={ui.logoutButton}>
              <Ionicons name="log-out-outline" size={17} color="#DC2626" />
              <Text style={ui.logoutText}>Sign Out of Super Admin</Text>
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
  header: {
    minHeight: 82,
    width: "100%" as const,
    flexShrink: 0,
    backgroundColor: "#FFD500",
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    shadowColor: "#8B7300",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 10,
  },
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

  routeBar: { backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E4E7EC" },
  routeScroll: { gap: 7, paddingHorizontal: 12, paddingVertical: 10 },
  routeTab: {
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  routeTabActive: { backgroundColor: "#FFD60A", borderColor: "#FFD60A" },
  routeLabel: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 10.5 },
  routeLabelActive: { color: "#172033", fontFamily: "Inter-Bold" },
  tabBadge: { paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 5 },
  tabBadgeText: { fontFamily: "Inter-Bold", fontSize: 8 },

  overlay: { flex: 1, flexDirection: "row" as const, backgroundColor: "rgba(15,23,42,0.48)" },
  drawer: {
    width: "88%" as const,
    maxWidth: 370,
    minHeight: "100%" as const,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  drawerHeader: { flexDirection: "row" as const, alignItems: "flex-start" as const, justifyContent: "space-between" as const, marginBottom: 12 },
  drawerSub: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 10.5, marginTop: 2 },
  closeButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#F2F4F7", alignItems: "center" as const, justifyContent: "center" as const },

  drawerSearch: {
    height: 40,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 11,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  drawerSearchInput: { flex: 1, color: "#101828", fontFamily: "Inter-Regular", fontSize: 11.5 },

  catScroll: { gap: 6, paddingBottom: 10 },
  catPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: "#F2F4F7" },
  catPillActive: { backgroundColor: "#172554" },
  catPillText: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 9.5 },
  catPillTextActive: { color: "#FFFFFF", fontFamily: "Inter-Bold" },

  drawerItem: {
    minHeight: 46,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingHorizontal: 8,
    borderRadius: 11,
    marginBottom: 2,
  },
  drawerItemActive: { backgroundColor: "#FFF8DB" },
  drawerIconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: "#EEF2FF", alignItems: "center" as const, justifyContent: "center" as const },
  drawerLabel: { color: "#101828", fontFamily: "Inter-SemiBold", fontSize: 12 },
  drawerLabelActive: { color: "#765900", fontFamily: "Inter-Bold" },
  drawerCategoryText: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 9, marginTop: 1 },
  drawerBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: "#F2F4F7" },
  drawerBadgeText: { color: "#667085", fontFamily: "Inter-Bold", fontSize: 8.5 },

  logoutButton: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF1F2",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 7,
  },
  logoutText: { color: "#DC2626", fontFamily: "Inter-Bold", fontSize: 12 },
};

export default function SuperAdminPagesRouter({ onLogout }: { onLogout?: () => void }) {
  return (
    <SuperAdminProvider>
      <SuperAdminPagesRouterInner onLogout={onLogout} />
    </SuperAdminProvider>
  );
}
