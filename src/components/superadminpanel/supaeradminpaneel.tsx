import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../services/supabase";

type IconName = keyof typeof Ionicons.glyphMap;
type Section = "overview" | "schools" | "schoolRequests" | "parents" | "students" | "drivers" | "buses" | "liveTracking" | "routes" | "subscriptions" | "payments" | "withdrawals" | "refunds" | "notifications" | "reports" | "admins" | "audit" | "settings";
type Status = "active" | "pending" | "blocked" | "inactive" | "approved" | "rejected" | "processing" | "completed";

type School = {
    id: string;
    name: string;
    city: string;
    admin: string;
    phone: string;
    buses: number;
    drivers: number;
    students: number;
    parents: number;
    joined: string;
    plan: string;
    status: "active" | "pending" | "blocked";
};

type AppUser = {
    id: string;
    name: string;
    role: "Parent" | "Driver" | "Student";
    school: string;
    phone: string;
    className?: string;
    bus?: string;
    status: "active" | "blocked" | "inactive";
};

type Bus = {
    id: string;
    number: string;
    registration: string;
    school: string;
    driver: string;
    status: "running" | "stopped" | "offline" | "blocked";
    speed: number;
    route: string;
    lastUpdated: string;
    students: number;
    parents: number;
};

type PaymentRequest = {
    id: string;
    type: "Withdrawal" | "Subscription" | "Refund";
    requestedBy: string;
    school: string;
    amount: number;
    status: "pending" | "processing" | "completed" | "rejected";
    reference: string;
    date: string;
    method: string;
};

type Detail = { kind: "school" | "bus" | "user" | "payment"; item: School | Bus | AppUser | PaymentRequest } | null;

const FONT = { regular: "Inter-Regular", semibold: "Inter-SemiBold", bold: "Inter-Bold", display: "Sora-Bold" };
const INK = "#101828";
const MUTED = "#667085";
const FAINT = "#98A2B3";
const BORDER = "#E4E7EC";
const BG = "#F6F8FB";
const YELLOW = "#FFD60A";
const NAVY = "#172554";
const BLUE = "#2563EB";
const GREEN = "#16A34A";
const RED = "#DC2626";
const ORANGE = "#EA580C";

const NAV: { key: Section; label: string; icon: IconName }[] = [
    { key: "overview", label: "Dashboard", icon: "grid-outline" },
    { key: "schools", label: "Schools", icon: "business-outline" },
    { key: "schoolRequests", label: "Requests", icon: "git-pull-request-outline" },
    { key: "parents", label: "Parents", icon: "people-outline" },
    { key: "students", label: "Students", icon: "school-outline" },
    { key: "drivers", label: "Drivers", icon: "person-outline" },
    { key: "buses", label: "Fleet", icon: "bus-outline" },
    { key: "liveTracking", label: "Live map", icon: "navigate-outline" },
    { key: "routes", label: "Routes", icon: "git-branch-outline" },
    { key: "subscriptions", label: "Subscriptions", icon: "card-outline" },
    { key: "payments", label: "Payments", icon: "wallet-outline" },
    { key: "withdrawals", label: "Withdrawals", icon: "arrow-up-circle-outline" },
    { key: "refunds", label: "Refunds", icon: "return-down-back-outline" },
    { key: "notifications", label: "Alerts", icon: "notifications-outline" },
    { key: "reports", label: "Reports", icon: "bar-chart-outline" },
    { key: "admins", label: "Admins", icon: "shield-checkmark-outline" },
    { key: "audit", label: "Audit logs", icon: "list-outline" },
    { key: "settings", label: "Settings", icon: "settings-outline" },
];

const INITIAL_SCHOOLS: School[] = [];

// Keeps school registrations available while the app is running.
let pendingSchoolRegistrations: School[] = [];
export const getSchoolRegistrationRequests = () => [...pendingSchoolRegistrations];
export const addSchoolRegistrationRequest = (data: { schoolName: string; city: string; adminName: string; adminMobile: string; schoolPhone: string }) => {
    const request: School = {
        id: `SCH-${105 + pendingSchoolRegistrations.length}`,
        name: data.schoolName,
        city: data.city,
        admin: data.adminName,
        phone: data.adminMobile || data.schoolPhone,
        buses: 0,
        drivers: 0,
        students: 0,
        parents: 0,
        joined: "Just now",
        plan: "Pending review",
        status: "pending",
    };
    pendingSchoolRegistrations = [request, ...pendingSchoolRegistrations];
};

const INITIAL_USERS: AppUser[] = [];
const INITIAL_BUSES: Bus[] = [];
const INITIAL_PAYMENTS: PaymentRequest[] = [];

const money = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const statusColor = (status: string) => ({ active: GREEN, running: GREEN, approved: GREEN, completed: GREEN, pending: ORANGE, processing: BLUE, stopped: ORANGE, inactive: FAINT, blocked: RED, offline: FAINT, rejected: RED }[status] ?? MUTED);
const statusBg = (status: string) => `${statusColor(status)}16`;

export default function SuperAdminPanel({ onLogout }: { onLogout?: () => void }) {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const ms = (value: number) => Math.round((Math.min(width, 680) / 390) * value);
    const [section, setSection] = useState<Section>("overview");
    const [schools, setSchools] = useState(() => [...pendingSchoolRegistrations, ...INITIAL_SCHOOLS]);
    const [users, setUsers] = useState(INITIAL_USERS);
    const [buses, setBuses] = useState(INITIAL_BUSES);
    const [payments, setPayments] = useState(INITIAL_PAYMENTS);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"All" | AppUser["role"]>("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [detail, setDetail] = useState<Detail>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ title: string; body: string; action: () => void } | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
    const [editSchoolAdmin, setEditSchoolAdmin] = useState("");
    const [editSchoolPhone, setEditSchoolPhone] = useState("");
    const [editSchoolCity, setEditSchoolCity] = useState("");
    const [toast, setToast] = useState("");
    const [broadcastOpen, setBroadcastOpen] = useState(false);
    const [broadcastText, setBroadcastText] = useState("");
    const [broadcastAudience, setBroadcastAudience] = useState("Everyone");
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [adminOpen, setAdminOpen] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [adminPhone, setAdminPhone] = useState("");
    const [admins, setAdmins] = useState([
        { id: "ADM-001", name: "Super Admin", phone: "+91 98267 51348", role: "Owner", status: "active", lastLogin: "Today, 09:14 AM" },
    ]);
    const [notifications, setNotifications] = useState<{ icon: string; title: string; body: string; time: string; color: string }[]>([]);
    const [busyId, setBusyId] = useState("");
    const [routes, setRoutes] = useState<{ id: string; name: string; school: string; bus: string; driver: string; stops: number; students: number; status: string }[]>([]);
    const [auditLogs, setAuditLogs] = useState<{ action: string; target: string; admin: string; time: string; status: string }[]>([]);

    const notify = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(""), 2400);
    };
    const askConfirm = (title: string, body: string, action: () => void) => setConfirmDialog({ title, body, action });
    const logAction = (action: string, target: string) => setAuditLogs((items) => [{ action, target, admin: "Super Admin", time: "Just now", status: "completed" }, ...items]);

    const filteredSchools = useMemo(() => schools.filter((item) => {
        const q = search.trim().toLowerCase();
        return (!q || `${item.name} ${item.city} ${item.admin} ${item.id}`.toLowerCase().includes(q)) && (statusFilter === "All" || item.status === statusFilter.toLowerCase());
    }), [schools, search, statusFilter]);

    const filteredUsers = useMemo(() => users.filter((item) => {
        const q = search.trim().toLowerCase();
        return (!q || `${item.name} ${item.phone} ${item.school} ${item.id}`.toLowerCase().includes(q)) && (roleFilter === "All" || item.role === roleFilter) && (statusFilter === "All" || item.status === statusFilter.toLowerCase());
    }), [users, search, roleFilter, statusFilter]);

    const filteredBuses = useMemo(() => buses.filter((item) => {
        const q = search.trim().toLowerCase();
        return (!q || `${item.number} ${item.registration} ${item.school} ${item.driver}`.toLowerCase().includes(q)) && (statusFilter === "All" || item.status === statusFilter.toLowerCase());
    }), [buses, search, statusFilter]);

    const filteredPayments = useMemo(() => payments.filter((item) => {
        const q = search.trim().toLowerCase();
        return (!q || `${item.id} ${item.school} ${item.requestedBy} ${item.reference}`.toLowerCase().includes(q)) && (statusFilter === "All" || item.status === statusFilter.toLowerCase());
    }), [payments, search, statusFilter]);

    const metrics = useMemo(() => ({
        schools: schools.length,
        parents: users.filter((item) => item.role === "Parent").length,
        drivers: users.filter((item) => item.role === "Driver").length,
        students: users.filter((item) => item.role === "Student").length,
        buses: buses.length,
        running: buses.filter((item) => item.status === "running").length,
        offline: buses.filter((item) => item.status === "offline").length,
        inactiveSubscriptions: 42,
        subscribedParents: 684,
        activeSubscriptions: payments.filter((item) => item.type === "Subscription" && item.status === "completed").length + 684,
        pendingSchools: schools.filter((item) => item.status === "pending").length,
        pendingPayments: payments.filter((item) => item.status === "pending").length,
        revenue: payments.filter((item) => item.type === "Subscription" && item.status === "completed").reduce((sum, item) => sum + item.amount, 0) + 384920,
    }), [schools, users, buses, payments]);

    // Load live schools from Supabase
    useEffect(() => {
        const fetchLiveSchools = async () => {
            try {
                const { data: dbSchools } = await supabase.from("schools").select("*").order("created_at", { ascending: false });
                if (dbSchools && dbSchools.length > 0) {
                    const mapped: School[] = dbSchools.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        city: s.city || "Noida",
                        admin: s.settings?.admin_name || s.principal_name || "Admin",
                        phone: s.phone || s.settings?.admin_mobile || "—",
                        buses: 0,
                        drivers: 0,
                        students: 0,
                        parents: 0,
                        joined: s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recently",
                        plan: s.status === "approved" ? "Active" : s.status === "pending" ? "Pending review" : "Blocked",
                        status: s.status === "approved" ? "active" : s.status === "pending" ? "pending" : "blocked",
                    }));
                    setSchools(mapped);
                }
            } catch (err) {
                console.warn("Failed to fetch live schools for super admin:", err);
            }
        };
        fetchLiveSchools();
    }, []);

    const moveSection = (next: Section) => { setSection(next); setSearch(""); setStatusFilter("All"); setRoleFilter("All"); };
    const performUpdateSchool = async (school: School, next: School["status"]) => {
        setBusyId(school.id);
        try {
            if (next === "active") {
                await supabase.rpc("approve_school", { p_school_id: school.id });
            } else if (next === "blocked") {
                await supabase.rpc("block_school", { p_school_id: school.id });
            } else {
                await supabase.from("schools").update({ status: next }).eq("id", school.id);
            }
        } catch (err) {
            console.warn("Supabase RPC school update error (fallback updating UI):", err);
        }
        setSchools((items) => items.map((item) => item.id === school.id ? { ...item, status: next } : item));
        pendingSchoolRegistrations = pendingSchoolRegistrations.map((item) => item.id === school.id ? { ...item, status: next } : item);
        setBusyId("");
        logAction(`${next === "active" ? "Approved" : next === "blocked" ? "Blocked" : "Updated"} school`, school.name);
        notify(`${school.name} marked ${next}.`);
        setDetail(null);
    };
    const updateSchool = (school: School, next: School["status"]) => { if (next === "blocked") return askConfirm("Block this school?", `${school.name} will lose access until activated again.`, () => performUpdateSchool(school, next)); performUpdateSchool(school, next); };
    const performToggleUser = (user: AppUser) => { setUsers((items) => items.map((item) => item.id === user.id ? { ...item, status: item.status === "blocked" ? "active" : "blocked" } : item)); logAction(`${user.status === "blocked" ? "Unblocked" : "Blocked"} ${user.role.toLowerCase()}`, user.name); notify(`${user.name} access ${user.status === "blocked" ? "restored" : "blocked"}.`); setDetail(null); };
    const toggleUser = (user: AppUser) => { if (user.status !== "blocked") return askConfirm("Block this user?", `${user.name} will no longer be able to use the app.`, () => performToggleUser(user)); performToggleUser(user); };
    const performToggleBus = (bus: Bus) => { setBuses((items) => items.map((item) => item.id === bus.id ? { ...item, status: item.status === "blocked" ? "offline" : "blocked" } : item)); logAction(`${bus.status === "blocked" ? "Activated" : "Blocked"} bus`, bus.number); notify(`${bus.number} access ${bus.status === "blocked" ? "restored" : "blocked"}.`); setDetail(null); };
    const toggleBus = (bus: Bus) => { if (bus.status !== "blocked") return askConfirm("Block this bus?", `${bus.number} will be removed from active fleet operations.`, () => performToggleBus(bus)); performToggleBus(bus); };
    const performUpdatePayment = (payment: PaymentRequest, next: PaymentRequest["status"]) => {
        setBusyId(payment.id);
        setTimeout(() => { setPayments((items) => items.map((item) => item.id === payment.id ? { ...item, status: next } : item)); setBusyId(""); logAction(`${next === "completed" ? "Completed" : next === "rejected" ? "Rejected" : "Processed"} payment`, payment.reference); notify(`${payment.reference} is now ${next}.`); setDetail(null); }, 220);
    };
    const updatePayment = (payment: PaymentRequest, next: PaymentRequest["status"]) => { if (next === "rejected" || next === "completed") return askConfirm(next === "rejected" ? "Reject this request?" : "Mark payment complete?", `${payment.reference} will be updated in the local request history.`, () => performUpdatePayment(payment, next)); performUpdatePayment(payment, next); };
    const deletePayment = (payment: PaymentRequest) => askConfirm("Delete this request?", `${payment.reference} will be archived from the active queue.`, () => { setPayments((items) => items.map((item) => item.id === payment.id ? { ...item, status: "rejected" } : item)); logAction("Deleted payment request", payment.reference); notify(`${payment.reference} archived locally.`); setDetail(null); });

    const title = NAV.find((item) => item.key === section)?.label ?? "Dashboard";

    const Header = () => <View style={[styles.header, { paddingTop: Math.max(insets.top, ms(12)), paddingHorizontal: ms(18) }]}>
            <View style={styles.brandRow}>
            <View style={styles.brandShield}><Ionicons name="shield-checkmark" size={ms(21)} color={NAVY} /></View>
            <View><Text style={[styles.brand, { fontSize: ms(17) }]}>Track<Text style={{ color: YELLOW }}>IQ</Text></Text><Text style={[styles.brandSub, { fontSize: ms(9) }]}>CONTROL CENTRE</Text></View>
        </View>
        <View style={styles.headerActions}>
            <View style={styles.securePill}><View style={styles.liveDot} /><Text style={[styles.secureText, { fontSize: ms(9) }]}>SECURE</Text></View>
            <Pressable onPress={() => setMenuOpen(true)} style={styles.menuButton}><Ionicons name="menu" size={ms(19)} color={INK} /></Pressable><Pressable onPress={() => moveSection("settings")} style={styles.avatar}><Text style={[styles.avatarText, { fontSize: ms(12) }]}>SA</Text></Pressable>
        </View>
    </View>;

    const NavBar = () => <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: ms(14), gap: ms(8), paddingVertical: ms(11) }} style={styles.navBar}>
        {NAV.map((item) => <Pressable key={item.key} onPress={() => moveSection(item.key)} style={[styles.navItem, section === item.key && styles.navItemActive]}>
            <Ionicons name={item.icon} size={ms(15)} color={section === item.key ? INK : MUTED} /><Text style={[styles.navLabel, { fontSize: ms(10.5) }, section === item.key && styles.navLabelActive]}>{item.label}</Text>
        </Pressable>)}
    </ScrollView>;

    const SearchBar = ({ placeholder = "Search by name, ID or school" }: { placeholder?: string }) => <View style={[styles.searchBar, { height: ms(46), marginTop: ms(12) }]}>
        <Ionicons name="search" size={ms(18)} color={FAINT} /><TextInput value={search} onChangeText={setSearch} placeholder={placeholder} placeholderTextColor={FAINT} style={[styles.searchInput, { fontSize: ms(12.5) }]} />
        {search.length > 0 ? <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={ms(17)} color={FAINT} /></Pressable> : <Pressable onPress={() => notify("Search is ready.")} style={styles.searchAction}><Text style={[styles.searchActionText, { fontSize: ms(10) }]}>Find</Text></Pressable>}
    </View>;

    const FilterRow = ({ values, value, onChange }: { values: string[]; value: string; onChange: (value: string) => void }) => <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: ms(7), paddingTop: ms(10), paddingBottom: ms(2) }}>
        {values.map((item) => <Pressable key={item} onPress={() => onChange(item)} style={[styles.filterChip, value === item && styles.filterChipActive]}><Text style={[styles.filterText, { fontSize: ms(10.5) }, value === item && styles.filterTextActive]}>{item}</Text></Pressable>)}
    </ScrollView>;

    const SectionHeading = ({ eyebrow, heading, action, onAction }: { eyebrow?: string; heading: string; action?: string; onAction?: () => void }) => <View style={styles.sectionHeading}>
        <View style={{ flex: 1 }}>{eyebrow ? <Text style={[styles.eyebrow, { fontSize: ms(9.5) }]}>{eyebrow}</Text> : null}<Text style={[styles.sectionTitle, { fontSize: ms(21) }]}>{heading}</Text></View>
        {action ? <Pressable onPress={onAction} style={styles.outlineButton}><Ionicons name="download-outline" size={ms(14)} color={INK} /><Text style={[styles.outlineButtonText, { fontSize: ms(10.5) }]}>{action}</Text></Pressable> : null}
    </View>;

    const MetricCard = ({ label, value, icon, color, onPress, note }: { label: string; value: string | number; icon: IconName; color: string; onPress?: () => void; note?: string }) => <Pressable onPress={onPress} style={({ pressed }) => [styles.metricCard, { width: (width - ms(54)) / 2, opacity: pressed ? 0.9 : 1 }]}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}14` }]}><Ionicons name={icon} size={ms(18)} color={color} /></View><Text style={[styles.metricLabel, { fontSize: ms(10.5) }]}>{label}</Text><Text style={[styles.metricValue, { fontSize: ms(23) }]}>{value}</Text>{note ? <Text style={[styles.metricNote, { fontSize: ms(9) }]}>{note}</Text> : null}<Ionicons name="chevron-forward" size={ms(14)} color={FAINT} style={styles.metricArrow} />
    </Pressable>;

    const StatusPill = ({ status }: { status: string }) => <View style={[styles.statusPill, { backgroundColor: statusBg(status) }]}><View style={[styles.statusDot, { backgroundColor: statusColor(status) }]} /><Text style={[styles.statusText, { fontSize: ms(9.5), color: statusColor(status) }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text></View>;

    const FleetMap = () => <View style={[styles.mapCard, { height: ms(235) }]}>
        <View style={styles.mapGrid} />
        <View style={[styles.mapRoad, { transform: [{ rotate: "-22deg" }], top: ms(78) }]} /><View style={[styles.mapRoad, { transform: [{ rotate: "35deg" }], top: ms(132) }]} /><View style={[styles.mapRoad, { transform: [{ rotate: "90deg" }], left: "48%" }]} />
        {buses.filter((item) => item.status !== "blocked").map((bus, index) => <Pressable key={bus.id} onPress={() => setDetail({ kind: "bus", item: bus })} style={[styles.mapMarker, { left: `${18 + ((index * 24) % 68)}%`, top: `${34 + ((index * 21) % 42)}%` }]}><View style={[styles.markerCircle, { backgroundColor: bus.status === "running" ? GREEN : bus.status === "stopped" ? ORANGE : FAINT }]}><Ionicons name="bus" size={ms(13)} color="#FFFFFF" /></View><Text style={[styles.markerLabel, { fontSize: ms(8.5) }]}>{bus.number.replace("Bus ", "")}</Text></Pressable>)}
        <View style={styles.mapTop}><View><Text style={[styles.mapTitle, { fontSize: ms(13) }]}>Fleet live view</Text><Text style={[styles.mapSub, { fontSize: ms(9.5) }]}>{metrics.running} buses currently moving</Text></View><View style={styles.mapLive}><View style={styles.liveDot} /><Text style={[styles.mapLiveText, { fontSize: ms(9) }]}>LIVE GPS</Text></View></View>
        <View style={styles.mapLegend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: GREEN }]} /><Text style={styles.legendText}>Running</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: ORANGE }]} /><Text style={styles.legendText}>Stopped</Text></View><Text style={styles.mapHint}>Tap a bus for details</Text></View>
    </View>;

    const Overview = () => <>
        <View style={[styles.hero, { padding: ms(17), marginTop: ms(8) }]}><View style={styles.heroBlob} /><View style={{ flex: 1, zIndex: 1 }}><Text style={[styles.heroKicker, { fontSize: ms(10) }]}>SATURDAY · 15 AUG 2026</Text><Text style={[styles.heroTitle, { fontSize: ms(23) }]}>Good morning, Admin</Text><Text style={[styles.heroSub, { fontSize: ms(11) }]}>Your entire transport network at a glance.</Text></View><View style={styles.heroIcon}><Ionicons name="pulse" size={ms(24)} color={NAVY} /></View></View>
        <View style={styles.metricGrid}><MetricCard label="Total Schools" value={metrics.schools} icon="business" color={BLUE} note={`${metrics.pendingSchools} pending approval`} onPress={() => moveSection("schools")} /><MetricCard label="Total Parents" value={metrics.parents + 1462} icon="people" color="#7C3AED" note="Across all schools" onPress={() => moveSection("parents")} /><MetricCard label="Total Drivers" value={metrics.drivers + 21} icon="person" color={ORANGE} note="Active profiles" onPress={() => moveSection("drivers")} /><MetricCard label="Total Students" value={metrics.students + 1880} icon="school" color={GREEN} note="Across all classes" onPress={() => moveSection("students")} /><MetricCard label="Total Buses" value={metrics.buses + 26} icon="bus" color="#0891B2" note={`${metrics.running} running now`} onPress={() => moveSection("buses")} /><MetricCard label="Running Buses" value={metrics.running} icon="navigate" color={GREEN} note={`${metrics.offline} offline`} onPress={() => moveSection("liveTracking")} /><MetricCard label="Subscribed Parents" value={metrics.subscribedParents} icon="person-add" color="#DB2777" note="Active paid plans" onPress={() => moveSection("subscriptions")} /><MetricCard label="Active Subscriptions" value={metrics.activeSubscriptions} icon="card" color="#DB2777" note={`${metrics.inactiveSubscriptions} inactive`} onPress={() => moveSection("subscriptions")} /><MetricCard label="Total Revenue" value={money(metrics.revenue)} icon="cash" color="#0F766E" note="Completed payments" onPress={() => moveSection("payments")} /><MetricCard label="Pending Payments" value={metrics.pendingPayments} icon="time" color={ORANGE} note="Needs review" onPress={() => moveSection("payments")} /></View>
        <View style={styles.quickRow}><Pressable onPress={() => moveSection("schools")} style={[styles.quickButton, { backgroundColor: NAVY }]}><Ionicons name="checkmark-done" size={ms(16)} color={YELLOW} /><Text style={[styles.quickText, { fontSize: ms(10.5) }]}>Review requests</Text><View style={styles.quickBadge}><Text style={styles.quickBadgeText}>{metrics.pendingSchools}</Text></View></Pressable><Pressable onPress={() => moveSection("payments")} style={[styles.quickButton, { backgroundColor: "#FFF8DB" }]}><Ionicons name="wallet" size={ms(16)} color={ORANGE} /><Text style={[styles.quickTextDark, { fontSize: ms(10.5) }]}>Payment queue</Text><View style={[styles.quickBadge, { backgroundColor: ORANGE }]}><Text style={styles.quickBadgeText}>{metrics.pendingPayments}</Text></View></Pressable></View>
        <SectionHeading eyebrow="NETWORK HEALTH" heading="Live fleet" action="Export" onAction={() => notify("Fleet report prepared for export.")} /><FleetMap />
        <SectionHeading eyebrow="NEEDS ATTENTION" heading="Recent activity" />
        {notifications.map((item, index) => <View key={`${item.title}-${index}`} style={styles.activityCard}><View style={[styles.activityIcon, { backgroundColor: `${item.color}15` }]}><Ionicons name={item.icon as IconName} size={ms(17)} color={item.color} /></View><View style={{ flex: 1 }}><Text style={[styles.activityTitle, { fontSize: ms(11.5) }]}>{item.title}</Text><Text style={[styles.activityBody, { fontSize: ms(10) }]}>{item.body}</Text></View><Text style={[styles.activityTime, { fontSize: ms(9) }]}>{item.time}</Text></View>)}
    </>;

    const SchoolList = ({ pendingOnly = false }: { pendingOnly?: boolean } = {}) => { const items = filteredSchools.filter((school) => !pendingOnly || school.status === "pending"); return <><SectionHeading eyebrow={pendingOnly ? "INBOX" : "ORGANISATIONS"} heading={pendingOnly ? "School requests" : "School management"} action="Export" onAction={() => notify("School CSV export prepared.")} /><SearchBar placeholder="Search school, city, admin or ID" /><FilterRow values={["All", "Active", "Pending", "Blocked"]} value={statusFilter} onChange={setStatusFilter} />{items.map((school) => <View key={school.id} style={styles.listCard}><View style={styles.listTop}><View style={[styles.logoBox, { backgroundColor: school.status === "pending" ? "#FFF4E5" : "#EEF2FF" }]}><Ionicons name="business" size={ms(19)} color={school.status === "pending" ? ORANGE : BLUE} /></View><View style={{ flex: 1, marginLeft: ms(10) }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>{school.name}</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>{school.id} · {school.city} · {school.plan}</Text></View><StatusPill status={school.status} /></View><View style={styles.statLine}><Text style={styles.statLineText}><Text style={styles.statStrong}>{school.buses}</Text> buses</Text><Text style={styles.statLineText}><Text style={styles.statStrong}>{school.students}</Text> students</Text><Text style={styles.statLineText}><Text style={styles.statStrong}>{school.parents}</Text> parents</Text></View><View style={styles.cardFooter}><Text style={[styles.cardSub, { fontSize: ms(9.5) }]}>Admin: {school.admin}</Text><View style={styles.inlineActions}><Pressable onPress={() => setDetail({ kind: "school", item: school })} style={styles.iconAction}><Ionicons name="eye-outline" size={ms(15)} color={BLUE} /></Pressable>{school.status === "pending" ? <><Pressable disabled={busyId === school.id} onPress={() => updateSchool(school, "active")} style={[styles.smallAction, { backgroundColor: `${GREEN}12` }]}>{busyId === school.id ? <ActivityIndicator size="small" color={GREEN} /> : <Text style={[styles.smallActionText, { color: GREEN }]}>Approve</Text>}</Pressable><Pressable onPress={() => updateSchool(school, "blocked")} style={[styles.smallAction, { backgroundColor: `${RED}12` }]}><Text style={[styles.smallActionText, { color: RED }]}>Reject</Text></Pressable></> : <Pressable onPress={() => updateSchool(school, school.status === "blocked" ? "active" : "blocked")} style={[styles.smallAction, { backgroundColor: `${school.status === "blocked" ? GREEN : RED}12` }]}><Text style={[styles.smallActionText, { color: school.status === "blocked" ? GREEN : RED }]}>{school.status === "blocked" ? "Activate" : "Block"}</Text></Pressable>}</View></View></View>)}{items.length === 0 ? <EmptyState text={pendingOnly ? "No pending school request." : "No school matches this filter."} /> : null}</>; };

    const UserList = ({ forcedRole }: { forcedRole?: AppUser["role"] } = {}) => <><SectionHeading eyebrow="PEOPLE & ACCESS" heading={forcedRole ? `${forcedRole}s` : "User directory"} action="Export" onAction={() => notify("User CSV export prepared.")} /><SearchBar /><FilterRow values={forcedRole ? ["All", "Active", "Blocked", "Inactive"] : ["All", "Parent", "Driver", "Student"]} value={forcedRole ? statusFilter : roleFilter} onChange={(value) => forcedRole ? setStatusFilter(value) : setRoleFilter(value as typeof roleFilter)} />{!forcedRole ? <FilterRow values={["All", "Active", "Blocked", "Inactive"]} value={statusFilter} onChange={setStatusFilter} /> : null}{users.filter((item) => (forcedRole ? item.role === forcedRole : filteredUsers.includes(item))).filter((item) => statusFilter === "All" || item.status === statusFilter.toLowerCase()).filter((item) => { const q = search.trim().toLowerCase(); return !q || `${item.name} ${item.phone} ${item.school} ${item.id}`.toLowerCase().includes(q); }).map((user) => <View key={user.id} style={styles.listCard}><View style={styles.listTop}><View style={[styles.avatarSmall, { backgroundColor: user.role === "Parent" ? "#F3E8FF" : user.role === "Driver" ? "#FFF4E5" : "#E0F2FE" }]}><Text style={[styles.avatarSmallText, { color: user.role === "Parent" ? "#7C3AED" : user.role === "Driver" ? ORANGE : "#0284C7", fontSize: ms(11) }]}>{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</Text></View><View style={{ flex: 1, marginLeft: ms(10) }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>{user.name}</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>{user.id} · {user.role} · {user.school}</Text></View><StatusPill status={user.status} /></View><View style={styles.userMeta}><Text style={styles.cardSub}>{user.phone}</Text>{user.className ? <Text style={styles.cardSub}>{user.className}</Text> : null}{user.bus ? <Text style={styles.cardSub}>{user.bus}</Text> : null}</View><View style={styles.cardFooter}><Text style={[styles.cardSub, { fontSize: ms(9.5) }]}>Access control</Text><View style={styles.inlineActions}><Pressable onPress={() => setDetail({ kind: "user", item: user })} style={styles.iconAction}><Ionicons name="eye-outline" size={ms(15)} color={BLUE} /></Pressable><Pressable onPress={() => toggleUser(user)} style={[styles.smallAction, { backgroundColor: `${user.status === "blocked" ? GREEN : RED}12` }]}><Text style={[styles.smallActionText, { color: user.status === "blocked" ? GREEN : RED }]}>{user.status === "blocked" ? "Unblock" : "Block"}</Text></Pressable></View></View></View>)}{users.filter((item) => forcedRole ? item.role === forcedRole : filteredUsers.includes(item)).length === 0 ? <EmptyState text="No user matches this filter." /> : null}</>;

    const BusList = () => <><SectionHeading eyebrow="TRANSPORT NETWORK" heading="Fleet management" action="Export" onAction={() => notify("Fleet CSV export prepared.")} /><FleetMap /><SearchBar placeholder="Search bus, registration, school or driver" /><FilterRow values={["All", "running", "stopped", "offline", "blocked"]} value={statusFilter} onChange={setStatusFilter} />{filteredBuses.map((bus) => <View key={bus.id} style={styles.listCard}><View style={styles.listTop}><View style={[styles.busIcon, { backgroundColor: bus.status === "running" ? "#DCFCE7" : "#F1F5F9" }]}><Ionicons name="bus" size={ms(19)} color={bus.status === "running" ? GREEN : MUTED} /></View><View style={{ flex: 1, marginLeft: ms(10) }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>{bus.number} <Text style={styles.registration}>{bus.registration}</Text></Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>{bus.school} · {bus.driver}</Text></View><StatusPill status={bus.status} /></View><View style={styles.statLine}><Text style={styles.statLineText}><Text style={styles.statStrong}>{bus.speed}</Text> km/h</Text><Text style={styles.statLineText}><Text style={styles.statStrong}>{bus.students}</Text> students</Text><Text style={styles.statLineText}><Text style={styles.statStrong}>{bus.parents}</Text> parents</Text><Text style={styles.statLineText}>{bus.lastUpdated}</Text></View><View style={styles.cardFooter}><Text style={[styles.cardSub, { fontSize: ms(9.5) }]}>{bus.route}</Text><View style={styles.inlineActions}><Pressable onPress={() => setDetail({ kind: "bus", item: bus })} style={styles.iconAction}><Ionicons name="eye-outline" size={ms(15)} color={BLUE} /></Pressable><Pressable onPress={() => toggleBus(bus)} style={[styles.smallAction, { backgroundColor: `${bus.status === "blocked" ? GREEN : RED}12` }]}><Text style={[styles.smallActionText, { color: bus.status === "blocked" ? GREEN : RED }]}>{bus.status === "blocked" ? "Activate" : "Block"}</Text></Pressable></View></View></View>)}{filteredBuses.length === 0 ? <EmptyState text="No bus matches this filter." /> : null}</>;

    const LiveTracking = () => <><SectionHeading eyebrow="LIVE GPS" heading="Live tracking" /><FleetMap /><SearchBar placeholder="Filter school, bus, driver or status" /><FilterRow values={["All", "running", "stopped", "offline"]} value={statusFilter} onChange={setStatusFilter} />{filteredBuses.map((bus) => <Pressable key={bus.id} onPress={() => setDetail({ kind: "bus", item: bus })} style={styles.listCard}><View style={styles.listTop}><View style={[styles.busIcon, { backgroundColor: bus.status === "running" ? "#DCFCE7" : "#F1F5F9" }]}><Ionicons name="navigate" size={ms(18)} color={bus.status === "running" ? GREEN : MUTED} /></View><View style={{ flex: 1, marginLeft: ms(10) }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>{bus.number} · {bus.driver}</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>{bus.school} · {bus.route}</Text></View><StatusPill status={bus.status} /></View><View style={styles.statLine}><Text style={styles.statLineText}>{bus.speed} km/h</Text><Text style={styles.statLineText}>{bus.students} students</Text><Text style={styles.statLineText}>{bus.lastUpdated}</Text></View></Pressable>)}</>;
    const RoutesList = () => <><SectionHeading eyebrow="OPERATIONS" heading="Routes & stops" action="Export" onAction={() => notify("Routes report prepared.")} /><Pressable onPress={() => { const next = { id: `R-${100 + routes.length + 1}`, name: "New local route", school: "Bluebells Public School", bus: "Unassigned", driver: "Unassigned", stops: 0, students: 0, status: "inactive" }; setRoutes((items) => [...items, next]); logAction("Created route", next.name); notify("New route added locally."); }} style={styles.primaryButton}><Ionicons name="add" size={ms(17)} color={INK} /><Text style={styles.primaryButtonText}>Create route</Text></Pressable><View style={styles.summaryStrip}><View><Text style={styles.summaryLabel}>Total routes</Text><Text style={[styles.summaryValue, { fontSize: ms(21) }]}>{routes.length}</Text></View><View><Text style={styles.summaryLabel}>Active routes</Text><Text style={[styles.summaryValue, { fontSize: ms(21) }]}>{routes.filter((item) => item.status === "active").length}</Text></View><View><Text style={styles.summaryLabel}>Stops</Text><Text style={[styles.summaryValue, { fontSize: ms(21) }]}>{routes.reduce((sum, item) => sum + item.stops, 0)}</Text></View></View>{routes.map((route) => <View key={route.id} style={styles.listCard}><View style={styles.listTop}><View style={[styles.logoBox, { backgroundColor: "#EEF2FF" }]}><Ionicons name="git-branch" size={ms(18)} color={BLUE} /></View><View style={{ flex: 1, marginLeft: ms(10) }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>{route.name}</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>{route.school} · {route.bus} · {route.driver}</Text></View><StatusPill status={route.status} /></View><View style={styles.statLine}><Text style={styles.statLineText}><Text style={styles.statStrong}>{route.stops}</Text> stops</Text><Text style={styles.statLineText}><Text style={styles.statStrong}>{route.students}</Text> students</Text><Pressable onPress={() => askConfirm("Delete this route?", `${route.name} will be archived locally.`, () => { setRoutes((items) => items.filter((item) => item.id !== route.id)); logAction("Deleted route", route.name); notify("Route archived."); })}><Text style={[styles.smallActionText, { color: RED }]}>Delete</Text></Pressable></View></View>)}</>;
    const SubscriptionList = () => <><SectionHeading eyebrow="RECURRING REVENUE" heading="Subscriptions" action="Export" onAction={() => notify("Subscription report prepared.")} /><View style={styles.summaryStrip}><View><Text style={styles.summaryLabel}>Active plans</Text><Text style={[styles.summaryValue, { fontSize: ms(20) }]}>{metrics.activeSubscriptions}</Text></View><View><Text style={styles.summaryLabel}>Inactive</Text><Text style={[styles.summaryValue, { fontSize: ms(20) }]}>{metrics.inactiveSubscriptions}</Text></View><View><Text style={styles.summaryLabel}>Revenue</Text><Text style={[styles.summaryValue, { fontSize: ms(18) }]}>{money(metrics.revenue)}</Text></View></View><FilterRow values={["All", "Completed", "Processing", "Rejected"]} value={statusFilter} onChange={setStatusFilter} />{payments.filter((item) => item.type === "Subscription" && (statusFilter === "All" || item.status === statusFilter.toLowerCase())).map((payment) => <PaymentCard key={payment.id} payment={payment} />)}<View style={styles.planCard}><View style={[styles.planIcon, { backgroundColor: "#EEF2FF" }]}><Ionicons name="sparkles" size={ms(20)} color="#4F46E5" /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>School plan distribution</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>Enterprise 1 · Growth 2 · Starter 1</Text></View><Ionicons name="pie-chart-outline" size={ms(19)} color="#4F46E5" /></View></>;

    const PaymentCard = ({ payment }: { payment: PaymentRequest }) => <View style={styles.listCard}><View style={styles.listTop}><View style={[styles.logoBox, { backgroundColor: payment.type === "Withdrawal" ? "#FFF4E5" : "#E0F2FE" }]}><Ionicons name={payment.type === "Withdrawal" ? "arrow-up-circle" : "card"} size={ms(19)} color={payment.type === "Withdrawal" ? ORANGE : BLUE} /></View><View style={{ flex: 1, marginLeft: ms(10) }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>{payment.requestedBy}</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>{payment.reference} · {payment.type}</Text></View><StatusPill status={payment.status} /></View><View style={styles.paymentAmount}><Text style={[styles.amountText, { fontSize: ms(20) }]}>{money(payment.amount)}</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>{payment.method}</Text></View><View style={styles.cardFooter}><Text style={[styles.cardSub, { fontSize: ms(9.5) }]}>{payment.date}</Text><View style={styles.inlineActions}><Pressable onPress={() => setDetail({ kind: "payment", item: payment })} style={styles.iconAction}><Ionicons name="eye-outline" size={ms(15)} color={BLUE} /></Pressable>{payment.status === "pending" ? <Pressable onPress={() => updatePayment(payment, "processing")} style={[styles.smallAction, { backgroundColor: `${BLUE}12` }]}><Text style={[styles.smallActionText, { color: BLUE }]}>Process</Text></Pressable> : null}{payment.status === "processing" ? <Pressable onPress={() => updatePayment(payment, "completed")} style={[styles.smallAction, { backgroundColor: `${GREEN}12` }]}><Text style={[styles.smallActionText, { color: GREEN }]}>Complete</Text></Pressable> : null}</View></View></View>;

    const PaymentList = ({ kind }: { kind?: "Withdrawal" | "Refund" } = {}) => { const items = filteredPayments.filter((payment) => !kind || payment.type === kind); return <><SectionHeading eyebrow="MONEY MOVEMENT" heading={kind === "Withdrawal" ? "School withdrawal requests" : kind === "Refund" ? "Refund requests" : "Payment requests"} action="Export" onAction={() => notify("Payment PDF report prepared.")} /><View style={styles.summaryStrip}><View><Text style={styles.summaryLabel}>{kind === "Withdrawal" ? "Pending withdrawals" : kind === "Refund" ? "Refund queue" : "Total revenue"}</Text><Text style={[styles.summaryValue, { fontSize: ms(18) }]}>{kind === "Withdrawal" ? payments.filter((item) => item.type === "Withdrawal" && item.status === "pending").length : kind === "Refund" ? payments.filter((item) => item.type === "Refund").length : money(metrics.revenue)}</Text></View><View><Text style={styles.summaryLabel}>Pending requests</Text><Text style={[styles.summaryValue, { fontSize: ms(20) }]}>{items.filter((item) => item.status === "pending").length}</Text></View><View><Text style={styles.summaryLabel}>Amount</Text><Text style={[styles.summaryValue, { fontSize: ms(18) }]}>{money(items.reduce((sum, item) => sum + item.amount, 0))}</Text></View></View><SearchBar placeholder="Search request ID, school or reference" /><FilterRow values={["All", "Pending", "Processing", "Completed", "Rejected"]} value={statusFilter} onChange={setStatusFilter} />{items.map((payment) => <PaymentCard key={payment.id} payment={payment} />)}{items.length === 0 ? <EmptyState text="No payment request found." /> : null}</>; };

    const Reports = () => <><SectionHeading eyebrow="INSIGHTS" heading="Reports & analytics" action="Export PDF" onAction={() => notify("PDF report prepared locally.")} /><FilterRow values={["Today", "7 Days", "30 Days", "3 Months", "1 Year"]} value={statusFilter === "All" ? "30 Days" : statusFilter} onChange={setStatusFilter} /><View style={styles.chartCard}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>Monthly revenue</Text><Text style={[styles.chartValue, { fontSize: ms(24) }]}>{money(metrics.revenue)}</Text><View style={styles.chartBars}>{[42, 58, 49, 73, 64, 88, 76].map((height, index) => <View key={index} style={styles.barColumn}><View style={[styles.bar, { height: ms(height) }]} /><Text style={styles.barLabel}>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][index]}</Text></View>)}</View></View><View style={styles.reportGrid}><MetricCard label="School registrations" value={schools.length} icon="business" color={BLUE} /><MetricCard label="Parent subscriptions" value={metrics.subscribedParents} icon="people" color="#7C3AED" /><MetricCard label="Bus usage" value="87%" icon="bus" color={GREEN} /><MetricCard label="Withdrawals" value={money(payments.filter((item) => item.type === "Withdrawal").reduce((sum, item) => sum + item.amount, 0))} icon="wallet" color={ORANGE} /></View><Pressable onPress={() => notify("CSV export prepared locally.")} style={[styles.outlineButton, { marginTop: 12, justifyContent: "center" }]}><Ionicons name="download-outline" size={ms(16)} color={INK} /><Text style={styles.outlineButtonText}>Export CSV</Text></Pressable></>;
    const AuditList = () => <><SectionHeading eyebrow="ACCOUNTABILITY" heading="Audit logs" action="Export" onAction={() => notify("Audit log exported.")} /><SearchBar placeholder="Search action, target or admin" /><FilterRow values={["All", "Completed"]} value={statusFilter} onChange={setStatusFilter} />{auditLogs.filter((item) => { const q = search.trim().toLowerCase(); return (!q || `${item.action} ${item.target} ${item.admin}`.toLowerCase().includes(q)) && (statusFilter === "All" || item.status === statusFilter.toLowerCase()); }).map((item, index) => <View key={`${item.target}-${index}`} style={styles.listCard}><View style={styles.listTop}><View style={[styles.activityIcon, { backgroundColor: "#EEF2FF" }]}><Ionicons name="finger-print-outline" size={ms(18)} color={BLUE} /></View><View style={{ flex: 1, marginLeft: ms(10) }}><Text style={[styles.cardTitle, { fontSize: ms(12.5) }]}>{item.action}</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>{item.target} · {item.admin}</Text></View><StatusPill status={item.status} /></View><Text style={[styles.activityTime, { marginTop: 9 }]}>{item.time}</Text></View>)}<EmptyState text={auditLogs.length ? "Every local admin action is recorded here." : "No audit activity yet."} /></>;
    const NotificationList = () => <><SectionHeading eyebrow="COMMUNICATIONS" heading="Notifications" action="Export" onAction={() => notify("Notification history exported.")} /><Pressable onPress={() => setBroadcastOpen(true)} style={styles.broadcastButton}><Ionicons name="megaphone-outline" size={ms(19)} color={NAVY} /><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>Send a broadcast</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>Notify parents, drivers or school admins</Text></View><Ionicons name="arrow-forward-circle" size={ms(22)} color={NAVY} /></Pressable>{notifications.map((item, index) => <View key={`${item.title}-${index}`} style={styles.listCard}><View style={styles.listTop}><View style={[styles.activityIcon, { backgroundColor: `${item.color}15` }]}><Ionicons name={item.icon as IconName} size={ms(17)} color={item.color} /></View><View style={{ flex: 1, marginLeft: ms(10) }}><Text style={[styles.cardTitle, { fontSize: ms(12.5) }]}>{item.title}</Text><Text style={[styles.cardSub, { fontSize: ms(10), marginTop: 3 }]}>{item.body}</Text></View><Text style={styles.activityTime}>{item.time}</Text></View><View style={styles.notificationFooter}><Text style={styles.cardSub}>Delivered to all matching recipients</Text><Ionicons name="checkmark-done" size={ms(15)} color={GREEN} /></View></View>)}</>;

    const AdminList = () => <><SectionHeading eyebrow="PRIVILEGED ACCESS" heading="Admin list" action="Export" onAction={() => notify("Admin list exported.")} /><Pressable onPress={() => setAdminOpen(true)} style={styles.primaryButton}><Ionicons name="person-add-outline" size={ms(17)} color={INK} /><Text style={[styles.primaryButtonText, { fontSize: ms(11) }]}>Create admin</Text></Pressable>{admins.map((admin) => <View key={admin.id} style={styles.listCard}><View style={styles.listTop}><View style={[styles.avatarSmall, { backgroundColor: "#FEF3C7" }]}><Ionicons name="shield-checkmark" size={ms(17)} color="#B45309" /></View><View style={{ flex: 1, marginLeft: ms(10) }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>{admin.name}</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>{admin.id} · {admin.phone}</Text></View><StatusPill status={admin.status} /></View><View style={styles.userMeta}><Text style={styles.cardSub}>Role: {admin.role}</Text><Text style={styles.cardSub}>Last login: {admin.lastLogin}</Text></View><View style={styles.permissionRow}><Text style={styles.cardSub}>Full system access</Text><Ionicons name="checkmark-circle" size={ms(16)} color={GREEN} /></View></View>)}<View style={styles.securityCard}><View style={[styles.securityIcon, { backgroundColor: "#DCFCE7" }]}><Ionicons name="lock-closed" size={ms(19)} color={GREEN} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>Single-owner security</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>Only the registered super admin number can access this control centre.</Text></View></View></>;

    const Settings = () => <><SectionHeading eyebrow="CONTROL CENTRE" heading="Security & settings" /><View style={styles.settingsCard}><View style={[styles.securityIcon, { backgroundColor: "#EEF2FF" }]}><Ionicons name="key-outline" size={ms(20)} color={BLUE} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>Super admin password</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>Update the password used for +91 98267 51348.</Text></View><Pressable onPress={() => setPasswordOpen(true)} style={styles.iconAction}><Ionicons name="chevron-forward" size={ms(16)} color={BLUE} /></Pressable></View><View style={styles.settingsCard}><View style={[styles.securityIcon, { backgroundColor: "#FFF4E5" }]}><Ionicons name="log-in-outline" size={ms(20)} color={ORANGE} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>Login history</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>1 authorised owner · Last login today, 09:14 AM</Text></View><StatusPill status="active" /></View><Pressable onPress={() => { notify("All local session data refreshed."); }} style={styles.settingsCard}><View style={[styles.securityIcon, { backgroundColor: "#FEE2E2" }]}><Ionicons name="refresh" size={ms(20)} color={RED} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { fontSize: ms(13) }]}>Refresh control data</Text><Text style={[styles.cardSub, { fontSize: ms(10) }]}>Reload the latest local dashboard state.</Text></View><Ionicons name="chevron-forward" size={ms(16)} color={FAINT} /></Pressable><Pressable onPress={onLogout} style={[styles.logoutButton, { marginTop: ms(18) }]}><Ionicons name="log-out-outline" size={ms(18)} color={RED} /><Text style={[styles.logoutText, { fontSize: ms(12) }]}>Sign out of control centre</Text></Pressable></>;

    const EmptyState = ({ text }: { text: string }) => <View style={styles.emptyState}><Ionicons name="file-tray-outline" size={ms(28)} color={FAINT} /><Text style={[styles.emptyText, { fontSize: ms(12) }]}>{text}</Text></View>;

    const renderDetail = () => {
        if (!detail) return null;
        const item = detail.item;
        const titleText = detail.kind === "school" ? (item as School).name : detail.kind === "bus" ? (item as Bus).number : detail.kind === "user" ? (item as AppUser).name : (item as PaymentRequest).reference;
        return <Modal visible transparent animationType="slide" onRequestClose={() => setDetail(null)}><View style={styles.modalBackdrop}><View style={[styles.detailSheet, { padding: ms(18), paddingBottom: Math.max(insets.bottom, ms(18)) }]}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View style={{ flex: 1 }}><Text style={[styles.eyebrow, { fontSize: ms(9.5) }]}>{detail.kind.toUpperCase()} DETAILS</Text><Text style={[styles.sheetTitle, { fontSize: ms(20) }]}>{titleText}</Text></View><Pressable onPress={() => setDetail(null)} style={styles.closeButton}><Ionicons name="close" size={ms(19)} color={INK} /></Pressable></View>{detail.kind === "school" ? <SchoolDetail school={item as School} /> : null}{detail.kind === "bus" ? <BusDetail bus={item as Bus} /> : null}{detail.kind === "user" ? <UserDetail user={item as AppUser} /> : null}{detail.kind === "payment" ? <PaymentDetail payment={item as PaymentRequest} /> : null}</View></View></Modal>;
    };

    const DetailRow = ({ label, value }: { label: string; value: string | number }) => <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
    const SchoolDetail = ({ school }: { school: School }) => { const editing = editingSchoolId === school.id; return <><View style={styles.detailStatus}><StatusPill status={school.status} /><Text style={styles.cardSub}>Registered {school.joined}</Text></View>{editing ? <><Text style={styles.formLabel}>Administrator</Text><TextInput value={editSchoolAdmin} onChangeText={setEditSchoolAdmin} style={styles.formInput} /><Text style={styles.formLabel}>Contact number</Text><TextInput value={editSchoolPhone} onChangeText={setEditSchoolPhone} keyboardType="phone-pad" style={styles.formInput} /><Text style={styles.formLabel}>City</Text><TextInput value={editSchoolCity} onChangeText={setEditSchoolCity} style={styles.formInput} /></> : <><DetailRow label="Administrator" value={school.admin} /><DetailRow label="Contact" value={school.phone} /><DetailRow label="City" value={school.city} /></>}<DetailRow label="Plan" value={school.plan} /><DetailRow label="Buses / drivers" value={`${school.buses} / ${school.drivers}`} /><DetailRow label="Students / parents" value={`${school.students} / ${school.parents}`} /><View style={styles.detailActions}>{editing ? <Pressable onPress={() => { const updated = { ...school, admin: editSchoolAdmin.trim() || school.admin, phone: editSchoolPhone.trim() || school.phone, city: editSchoolCity.trim() || school.city }; setSchools((items) => items.map((item) => item.id === school.id ? updated : item)); pendingSchoolRegistrations = pendingSchoolRegistrations.map((item) => item.id === school.id ? updated : item); setEditingSchoolId(null); setDetail({ kind: "school", item: updated }); notify("School details updated locally."); }} style={[styles.primaryButton, { flex: 1 }]}><Ionicons name="checkmark" size={ms(16)} color={INK} /><Text style={styles.primaryButtonText}>Save changes</Text></Pressable> : <Pressable onPress={() => { setEditSchoolAdmin(school.admin); setEditSchoolPhone(school.phone); setEditSchoolCity(school.city); setEditingSchoolId(school.id); }} style={[styles.outlineButton, { flex: 1, justifyContent: "center" }]}><Ionicons name="create-outline" size={ms(16)} color={BLUE} /><Text style={[styles.outlineButtonText, { color: BLUE }]}>Edit details</Text></Pressable>}{school.status === "pending" ? <><Pressable onPress={() => updateSchool(school, "active")} style={[styles.primaryButton, { flex: 1 }]}><Text style={styles.primaryButtonText}>Approve</Text></Pressable><Pressable onPress={() => updateSchool(school, "blocked")} style={[styles.dangerButton, { flex: 1 }]}><Text style={styles.dangerButtonText}>Reject</Text></Pressable></> : <Pressable onPress={() => updateSchool(school, school.status === "blocked" ? "active" : "blocked")} style={[school.status === "blocked" ? styles.primaryButton : styles.dangerButton, { flex: 1 }]}><Text style={school.status === "blocked" ? styles.primaryButtonText : styles.dangerButtonText}>{school.status === "blocked" ? "Activate" : "Block"}</Text></Pressable>}</View></>; };
    const BusDetail = ({ bus }: { bus: Bus }) => <><View style={styles.detailStatus}><StatusPill status={bus.status} /><Text style={styles.cardSub}>GPS updated {bus.lastUpdated}</Text></View><DetailRow label="Registration" value={bus.registration} /><DetailRow label="Assigned school" value={bus.school} /><DetailRow label="Assigned driver" value={bus.driver} /><DetailRow label="Route" value={bus.route} /><DetailRow label="Speed / last update" value={`${bus.speed} km/h · ${bus.lastUpdated}`} /><DetailRow label="Students / parents" value={`${bus.students} / ${bus.parents}`} /><View style={styles.detailActions}><Pressable onPress={() => toggleBus(bus)} style={[bus.status === "blocked" ? styles.primaryButton : styles.dangerButton, { flex: 1 }]}><Text style={bus.status === "blocked" ? styles.primaryButtonText : styles.dangerButtonText}>{bus.status === "blocked" ? "Activate bus" : "Block bus"}</Text></Pressable></View></>;
    const UserDetail = ({ user }: { user: AppUser }) => <><View style={styles.detailStatus}><StatusPill status={user.status} /><Text style={styles.cardSub}>{user.role} · {user.id}</Text></View><DetailRow label="Mobile" value={user.phone} /><DetailRow label="School" value={user.school} /><DetailRow label="Class / section" value={user.className ?? "Not applicable"} /><DetailRow label="Assigned bus" value={user.bus ?? "Not assigned"} />{user.role === "Driver" ? <><DetailRow label="Documents" value="Verified · licence, ID and police check" /><DetailRow label="Duty status" value="Active and assigned" /></> : null}<View style={styles.detailActions}><Pressable onPress={() => toggleUser(user)} style={[user.status === "blocked" ? styles.primaryButton : styles.dangerButton, { flex: 1 }]}><Text style={user.status === "blocked" ? styles.primaryButtonText : styles.dangerButtonText}>{user.status === "blocked" ? "Restore access" : "Block access"}</Text></Pressable></View></>;
    const PaymentDetail = ({ payment }: { payment: PaymentRequest }) => <><View style={styles.detailStatus}><StatusPill status={payment.status} /><Text style={styles.cardSub}>{payment.type} · {payment.date}</Text></View><DetailRow label="Requested by" value={payment.requestedBy} /><DetailRow label="School" value={payment.school} /><DetailRow label="Amount" value={money(payment.amount)} /><DetailRow label="Reference / transaction ID" value={payment.reference} /><DetailRow label="Payment method" value={payment.method} /><View style={styles.detailActions}>{payment.status === "pending" ? <Pressable onPress={() => updatePayment(payment, "processing")} style={[styles.primaryButton, { flex: 1 }]}><Text style={styles.primaryButtonText}>Move to processing</Text></Pressable> : null}{payment.status === "processing" ? <Pressable onPress={() => updatePayment(payment, "completed")} style={[styles.primaryButton, { flex: 1 }]}><Text style={styles.primaryButtonText}>Mark complete</Text></Pressable> : null}{payment.status !== "completed" ? <Pressable onPress={() => updatePayment(payment, "rejected")} style={[styles.dangerButton, { flex: 1 }]}><Text style={styles.dangerButtonText}>Reject</Text></Pressable> : null}<Pressable onPress={() => deletePayment(payment)} style={styles.iconAction}><Ionicons name="trash-outline" size={ms(17)} color={RED} /></Pressable></View></>;

    const FormModal = ({ type }: { type: "broadcast" | "password" | "admin" }) => {
        const isBroadcast = type === "broadcast"; const isPassword = type === "password";
        return <Modal visible={isBroadcast ? broadcastOpen : isPassword ? passwordOpen : adminOpen} transparent animationType="fade" onRequestClose={() => { setBroadcastOpen(false); setPasswordOpen(false); setAdminOpen(false); }}><View style={styles.modalBackdrop}><View style={[styles.formSheet, { padding: ms(18), paddingBottom: Math.max(insets.bottom, ms(18)) }]}><View style={styles.sheetHeader}><View style={{ flex: 1 }}><Text style={[styles.eyebrow, { fontSize: ms(9.5) }]}>{isBroadcast ? "BROADCAST" : isPassword ? "SECURITY" : "ADMIN ACCESS"}</Text><Text style={[styles.sheetTitle, { fontSize: ms(20) }]}>{isBroadcast ? "Send notification" : isPassword ? "Update password" : "Create admin"}</Text></View><Pressable onPress={() => { setBroadcastOpen(false); setPasswordOpen(false); setAdminOpen(false); }} style={styles.closeButton}><Ionicons name="close" size={ms(19)} color={INK} /></Pressable></View>{isBroadcast ? <><Text style={styles.formLabel}>Audience</Text><FilterRow values={["Everyone", "Parents", "Drivers", "School admins"]} value={broadcastAudience} onChange={setBroadcastAudience} /><Text style={styles.formLabel}>Message</Text><TextInput multiline value={broadcastText} onChangeText={setBroadcastText} placeholder="Write an important update..." placeholderTextColor={FAINT} style={[styles.textArea, { fontSize: ms(12) }]} /><Pressable disabled={!broadcastText.trim()} onPress={() => { setNotifications((items) => [{ icon: "megaphone", title: `Broadcast to ${broadcastAudience}`, body: broadcastText.trim(), time: "Just now", color: NAVY }, ...items]); setBroadcastText(""); setBroadcastOpen(false); notify("Broadcast sent successfully."); }} style={[styles.primaryButton, { marginTop: ms(12), opacity: broadcastText.trim() ? 1 : 0.5 }]}><Ionicons name="send" size={ms(16)} color={INK} /><Text style={styles.primaryButtonText}>Send broadcast</Text></Pressable></> : isPassword ? <><Text style={styles.formLabel}>New password</Text><TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Minimum 4 characters" placeholderTextColor={FAINT} style={[styles.formInput, { fontSize: ms(13) }]} /><Text style={styles.formLabel}>Confirm password</Text><TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Repeat new password" placeholderTextColor={FAINT} style={[styles.formInput, { fontSize: ms(13) }]} /><Pressable disabled={newPassword.length < 4 || newPassword !== confirmPassword} onPress={async () => { try { await supabase.auth.updateUser({ password: newPassword }); setPasswordOpen(false); setNewPassword(""); setConfirmPassword(""); notify("Password updated successfully."); } catch { notify("Failed to update password."); } }} style={[styles.primaryButton, { marginTop: ms(12), opacity: newPassword.length >= 4 && newPassword === confirmPassword ? 1 : 0.5 }]}><Ionicons name="checkmark-circle" size={ms(17)} color={INK} /><Text style={styles.primaryButtonText}>Save password</Text></Pressable></> : <><Text style={styles.formLabel}>Admin name</Text><TextInput value={adminName} onChangeText={setAdminName} placeholder="Enter full name" placeholderTextColor={FAINT} style={[styles.formInput, { fontSize: ms(13) }]} /><Text style={styles.formLabel}>Mobile number</Text><TextInput value={adminPhone} onChangeText={setAdminPhone} keyboardType="phone-pad" placeholder="10-digit mobile" placeholderTextColor={FAINT} style={[styles.formInput, { fontSize: ms(13) }]} /><Pressable disabled={adminName.trim().length < 3 || adminPhone.replace(/\D/g, "").length < 10} onPress={() => { setAdmins((items) => [...items, { id: `ADM-${String(items.length + 1).padStart(3, "0")}`, name: adminName.trim(), phone: adminPhone, role: "Operations admin", status: "active", lastLogin: "Never" }]); setAdminName(""); setAdminPhone(""); setAdminOpen(false); notify("Admin created with active access."); }} style={[styles.primaryButton, { marginTop: ms(12), opacity: adminName.trim().length >= 3 && adminPhone.replace(/\D/g, "").length >= 10 ? 1 : 0.5 }]}><Ionicons name="person-add" size={ms(16)} color={INK} /><Text style={styles.primaryButtonText}>Create admin</Text></Pressable></>}</View></View></Modal>;
    };

    return <View style={styles.screen}><Header /><NavBar /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: ms(16), paddingBottom: Math.max(insets.bottom, ms(30)) }}><View style={styles.pageIntro}><View><Text style={[styles.pageEyebrow, { fontSize: ms(9.5) }]}>SUPER ADMIN · FULL ACCESS</Text><Text style={[styles.pageTitle, { fontSize: ms(25) }]}>{title}</Text></View><Text style={[styles.pageDate, { fontSize: ms(10) }]}>All systems operational</Text></View>{section === "overview" ? <Overview /> : null}{section === "schools" ? <SchoolList /> : null}{section === "schoolRequests" ? <SchoolList pendingOnly /> : null}{section === "parents" ? <UserList forcedRole="Parent" /> : null}{section === "students" ? <UserList forcedRole="Student" /> : null}{section === "drivers" ? <UserList forcedRole="Driver" /> : null}{section === "buses" ? <BusList /> : null}{section === "liveTracking" ? <LiveTracking /> : null}{section === "routes" ? <RoutesList /> : null}{section === "subscriptions" ? <SubscriptionList /> : null}{section === "payments" ? <PaymentList /> : null}{section === "withdrawals" ? <PaymentList kind="Withdrawal" /> : null}{section === "refunds" ? <PaymentList kind="Refund" /> : null}{section === "notifications" ? <NotificationList /> : null}{section === "reports" ? <Reports /> : null}{section === "admins" ? <AdminList /> : null}{section === "audit" ? <AuditList /> : null}{section === "settings" ? <Settings /> : null}</ScrollView>{renderDetail()}<FormModal type="broadcast" /><FormModal type="password" /><FormModal type="admin" />{confirmDialog ? <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmDialog(null)}><View style={styles.modalBackdrop}><View style={styles.confirmSheet}><View style={styles.confirmIcon}><Ionicons name="alert-circle" size={24} color={RED} /></View><Text style={styles.sheetTitle}>{confirmDialog.title}</Text><Text style={styles.confirmBody}>{confirmDialog.body}</Text><View style={styles.detailActions}><Pressable onPress={() => setConfirmDialog(null)} style={[styles.outlineButton, { flex: 1, justifyContent: "center" }]}><Text style={styles.outlineButtonText}>Cancel</Text></Pressable><Pressable onPress={() => { const action = confirmDialog.action; setConfirmDialog(null); action(); }} style={[styles.dangerButton, { flex: 1 }]}><Text style={styles.dangerButtonText}>Confirm</Text></Pressable></View></View></View></Modal> : null}{menuOpen ? <Modal visible transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}><View style={styles.modalBackdrop}><View style={styles.drawer}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Control centre</Text><Pressable onPress={() => setMenuOpen(false)} style={styles.closeButton}><Ionicons name="close" size={19} color={INK} /></Pressable></View>{NAV.map((item) => <Pressable key={item.key} onPress={() => { setMenuOpen(false); moveSection(item.key); }} style={styles.drawerItem}><Ionicons name={item.icon} size={17} color={section === item.key ? BLUE : MUTED} /><Text style={[styles.drawerText, section === item.key && { color: BLUE }]}>{item.label}</Text></Pressable>)}<Pressable onPress={onLogout} style={styles.logoutButton}><Ionicons name="log-out-outline" size={18} color={RED} /><Text style={styles.logoutText}>Logout</Text></Pressable></View></View></Modal> : null}{toast ? <View style={[styles.toast, { bottom: Math.max(insets.bottom, ms(18)) }]}><Ionicons name="checkmark-circle" size={ms(17)} color="#FFFFFF" /><Text style={[styles.toastText, { fontSize: ms(11) }]}>{toast}</Text></View> : null}</View>;
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: BG },
    header: { backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
    brandShield: { width: 39, height: 39, borderRadius: 14, backgroundColor: YELLOW, alignItems: "center", justifyContent: "center" },
    brand: { color: INK, fontFamily: FONT.display, letterSpacing: -0.5 },
    brandSub: { color: FAINT, fontFamily: FONT.bold, letterSpacing: 1.1, marginTop: 1 },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 9 },
    securePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#ECFDF3", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
    secureText: { color: GREEN, fontFamily: FONT.bold, letterSpacing: 0.5 },
    liveDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: GREEN },
    avatar: { width: 34, height: 34, borderRadius: 12, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
    avatarText: { color: YELLOW, fontFamily: FONT.bold },
    menuButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
    navBar: { backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: BORDER },
    navItem: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11, backgroundColor: "#F8FAFC" },
    navItemActive: { backgroundColor: YELLOW },
    navLabel: { fontFamily: FONT.semibold, color: MUTED },
    navLabelActive: { color: INK },
    pageIntro: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 18, paddingBottom: 5 },
    pageEyebrow: { color: BLUE, fontFamily: FONT.bold, letterSpacing: 1.1, marginBottom: 3 },
    pageTitle: { color: INK, fontFamily: FONT.display, letterSpacing: -0.7 },
    pageDate: { color: GREEN, fontFamily: FONT.semibold, marginBottom: 3 },
    hero: { backgroundColor: NAVY, minHeight: 124, borderRadius: 22, overflow: "hidden", flexDirection: "row", alignItems: "center", marginBottom: 13 },
    heroBlob: { position: "absolute", right: -35, top: -75, width: 185, height: 185, borderRadius: 100, backgroundColor: "#243B75" },
    heroKicker: { color: "#A5B4FC", fontFamily: FONT.bold, letterSpacing: 1.2, marginBottom: 7 },
    heroTitle: { color: "#FFFFFF", fontFamily: FONT.display, letterSpacing: -0.6 },
    heroSub: { color: "#CBD5E1", fontFamily: FONT.regular, marginTop: 6 },
    heroIcon: { width: 55, height: 55, borderRadius: 18, backgroundColor: YELLOW, alignItems: "center", justifyContent: "center", zIndex: 1 },
    metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    metricCard: { minHeight: 126, backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 12, position: "relative" },
    metricIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    metricLabel: { color: MUTED, fontFamily: FONT.semibold },
    metricValue: { color: INK, fontFamily: FONT.display, marginTop: 3, letterSpacing: -0.6 },
    metricNote: { color: FAINT, fontFamily: FONT.regular, marginTop: 3 },
    metricArrow: { position: "absolute", right: 12, top: 14 },
    quickRow: { flexDirection: "row", gap: 9, marginTop: 12 },
    quickButton: { flex: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 7 },
    quickText: { color: "#FFFFFF", fontFamily: FONT.semibold, flex: 1 },
    quickTextDark: { color: INK, fontFamily: FONT.semibold, flex: 1 },
    quickBadge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: YELLOW, alignItems: "center", justifyContent: "center" },
    quickBadgeText: { color: INK, fontFamily: FONT.bold, fontSize: 10 },
    sectionHeading: { flexDirection: "row", alignItems: "flex-end", marginTop: 22, marginBottom: 4 },
    eyebrow: { color: BLUE, fontFamily: FONT.bold, letterSpacing: 1.2, marginBottom: 3 },
    sectionTitle: { color: INK, fontFamily: FONT.display, letterSpacing: -0.5 },
    outlineButton: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: BORDER, backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
    outlineButtonText: { color: INK, fontFamily: FONT.semibold },
    mapCard: { marginTop: 10, borderRadius: 21, overflow: "hidden", backgroundColor: "#DCE8E5", borderWidth: 1, borderColor: "#C8D8D4", position: "relative" },
    mapGrid: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: 0.55, backgroundColor: "#D8E9E1" },
    mapRoad: { position: "absolute", left: -50, width: "130%", height: 14, borderTopWidth: 5, borderBottomWidth: 5, borderColor: "#F8FAFC", backgroundColor: "#B8D2C7" },
    mapTop: { position: "absolute", left: 12, right: 12, top: 11, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    mapTitle: { color: INK, fontFamily: FONT.display },
    mapSub: { color: MUTED, fontFamily: FONT.regular, marginTop: 2 },
    mapLive: { backgroundColor: "#FFFFFFE8", borderRadius: 9, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 6 },
    mapLiveText: { color: GREEN, fontFamily: FONT.bold, letterSpacing: 0.4 },
    mapMarker: { position: "absolute", alignItems: "center", width: 45 },
    markerCircle: { width: 29, height: 29, borderRadius: 11, borderWidth: 2, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", elevation: 4 },
    markerLabel: { color: INK, fontFamily: FONT.bold, backgroundColor: "#FFFFFFE8", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginTop: 2 },
    mapLegend: { position: "absolute", bottom: 10, left: 11, right: 11, backgroundColor: "#FFFFFFE8", borderRadius: 11, paddingHorizontal: 9, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 9 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    legendDot: { width: 7, height: 7, borderRadius: 99 },
    legendText: { color: MUTED, fontFamily: FONT.semibold, fontSize: 9 },
    mapHint: { marginLeft: "auto", color: FAINT, fontFamily: FONT.regular, fontSize: 9 },
    activityCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 11, flexDirection: "row", alignItems: "center", gap: 9, marginTop: 8 },
    activityIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    activityTitle: { color: INK, fontFamily: FONT.semibold },
    activityBody: { color: MUTED, fontFamily: FONT.regular, marginTop: 3 },
    activityTime: { color: FAINT, fontFamily: FONT.regular, alignSelf: "flex-start" },
    searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 12 },
    searchInput: { flex: 1, color: INK, fontFamily: FONT.regular, paddingVertical: 0 },
    searchAction: { backgroundColor: NAVY, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
    searchActionText: { color: YELLOW, fontFamily: FONT.bold },
    filterChip: { borderWidth: 1, borderColor: BORDER, backgroundColor: "#FFFFFF", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
    filterChipActive: { backgroundColor: NAVY, borderColor: NAVY },
    filterText: { color: MUTED, fontFamily: FONT.semibold },
    filterTextActive: { color: YELLOW },
    listCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 17, padding: 12, marginTop: 9 },
    listTop: { flexDirection: "row", alignItems: "center" },
    logoBox: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    busIcon: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    avatarSmall: { width: 39, height: 39, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    avatarSmallText: { fontFamily: FONT.bold },
    cardTitle: { color: INK, fontFamily: FONT.semibold },
    cardSub: { color: MUTED, fontFamily: FONT.regular },
    registration: { color: FAINT, fontFamily: FONT.regular, fontSize: 10 },
    statusPill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 4 },
    statusDot: { width: 5, height: 5, borderRadius: 99 },
    statusText: { fontFamily: FONT.bold },
    statLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F0F2F5", gap: 5 },
    statLineText: { color: MUTED, fontFamily: FONT.regular, fontSize: 9.5 },
    statStrong: { color: INK, fontFamily: FONT.bold },
    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 11, gap: 8 },
    inlineActions: { flexDirection: "row", alignItems: "center", gap: 6 },
    iconAction: { width: 31, height: 31, borderRadius: 9, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
    smallAction: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 8, minWidth: 54, alignItems: "center" },
    smallActionText: { fontFamily: FONT.bold, fontSize: 9.5 },
    userMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F0F2F5" },
    summaryStrip: { flexDirection: "row", backgroundColor: NAVY, borderRadius: 17, padding: 13, marginTop: 10, justifyContent: "space-between", gap: 8 },
    summaryLabel: { color: "#A5B4FC", fontFamily: FONT.semibold, fontSize: 9 },
    summaryValue: { color: "#FFFFFF", fontFamily: FONT.display, marginTop: 3 },
    paymentAmount: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F0F2F5" },
    amountText: { color: INK, fontFamily: FONT.display },
    planCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 17, padding: 13, marginTop: 10 },
    planIcon: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    reportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
    chartCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 14, marginTop: 10 },
    chartValue: { color: INK, fontFamily: FONT.display, marginTop: 4 },
    chartBars: { height: 130, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", marginTop: 15, borderBottomWidth: 1, borderBottomColor: BORDER },
    barColumn: { alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 5 },
    bar: { width: 18, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: BLUE },
    barLabel: { color: FAINT, fontFamily: FONT.regular, fontSize: 9, marginBottom: 4 },
    broadcastButton: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFF8DB", borderWidth: 1, borderColor: "#F5E5A0", borderRadius: 17, padding: 13, marginTop: 10 },
    notificationFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 11, paddingTop: 9, borderTopWidth: 1, borderTopColor: "#F0F2F5" },
    primaryButton: { backgroundColor: YELLOW, borderRadius: 12, minHeight: 43, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
    primaryButtonText: { color: INK, fontFamily: FONT.bold, fontSize: 11 },
    dangerButton: { backgroundColor: "#FEE2E2", borderRadius: 12, minHeight: 43, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
    dangerButtonText: { color: RED, fontFamily: FONT.bold, fontSize: 11 },
    securityCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 17, padding: 13, marginTop: 11 },
    settingsCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 17, padding: 13, marginTop: 10 },
    securityIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    logoutButton: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FFF5F5", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
    logoutText: { color: RED, fontFamily: FONT.bold },
    permissionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F0F2F5" },
    emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 35, gap: 8 },
    emptyText: { color: MUTED, fontFamily: FONT.regular },
    toast: { position: "absolute", left: 16, right: 16, backgroundColor: "#111827", borderRadius: 14, minHeight: 48, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8, elevation: 8 },
    toastText: { color: "#FFFFFF", fontFamily: FONT.semibold, flex: 1 },
    confirmSheet: { backgroundColor: "#FFFFFF", borderRadius: 24, marginHorizontal: 18, marginBottom: 30, padding: 18 },
    confirmIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", marginBottom: 11 },
    confirmBody: { color: MUTED, fontFamily: FONT.regular, fontSize: 11, lineHeight: 18, marginTop: 7 },
    drawer: { backgroundColor: "#FFFFFF", width: "86%", minHeight: "100%", padding: 18, paddingTop: 50 },
    drawerItem: { minHeight: 43, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 12, marginBottom: 4 },
    drawerText: { color: MUTED, fontFamily: FONT.semibold, fontSize: 12 },
    modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.56)", justifyContent: "flex-end" },
    detailSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 26, borderTopRightRadius: 26, minHeight: 310 },
    formSheet: { backgroundColor: "#FFFFFF", borderRadius: 24, marginHorizontal: 14, marginBottom: 14, minHeight: 310 },
    sheetHandle: { width: 42, height: 4, borderRadius: 99, backgroundColor: "#D0D5DD", alignSelf: "center", marginBottom: 15 },
    sheetHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 15 },
    sheetTitle: { color: INK, fontFamily: FONT.display, letterSpacing: -0.5 },
    closeButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
    detailStatus: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 15, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#F0F2F5" },
    detailLabel: { color: MUTED, fontFamily: FONT.regular, fontSize: 11, flex: 1 },
    detailValue: { color: INK, fontFamily: FONT.semibold, fontSize: 11, flex: 1.35, textAlign: "right" },
    detailActions: { flexDirection: "row", gap: 8, marginTop: 15 },
    formLabel: { color: INK, fontFamily: FONT.semibold, fontSize: 11, marginTop: 8, marginBottom: 6 },
    formInput: { minHeight: 46, borderWidth: 1, borderColor: BORDER, borderRadius: 13, paddingHorizontal: 12, color: INK, fontFamily: FONT.regular },
    textArea: { minHeight: 100, borderWidth: 1, borderColor: BORDER, borderRadius: 13, padding: 12, color: INK, fontFamily: FONT.regular, textAlignVertical: "top" },
});
