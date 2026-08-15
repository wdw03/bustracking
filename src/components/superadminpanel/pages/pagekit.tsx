import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type IconName = keyof typeof Ionicons.glyphMap;
export type AdminRecord = {
    id: string;
    title: string;
    subtitle: string;
    status: string;
    fields?: string[];
    icon?: IconName;
    school?: string;
    phone?: string;
    email?: string;
    address?: string;
    details?: Array<{ label: string; value: string; icon?: IconName }>;
};
export type Metric = { label: string; value: string | number; icon: IconName; color?: string; note?: string };

export const COLORS = {
    ink: "#101828",
    muted: "#667085",
    faint: "#98A2B3",
    border: "#E4E7EC",
    blue: "#2563EB",
    navy: "#172554",
    yellow: "#FFD60A",
    gold: "#B57900",
    green: "#16A34A",
    red: "#DC2626",
    orange: "#EA580C",
    purple: "#7C3AED",
    cyan: "#0891B2",
    bg: "#F6F8FB",
    card: "#FFFFFF",
};

export const FONT = {
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
    display: "Sora-Bold",
};

export const statusColor = (status: string) => ({
    active: COLORS.green,
    running: COLORS.green,
    approved: COLORS.green,
    completed: COLORS.green,
    pending: COLORS.orange,
    processing: COLORS.blue,
    stopped: COLORS.orange,
    inactive: COLORS.faint,
    blocked: COLORS.red,
    offline: COLORS.faint,
    rejected: COLORS.red,
    expired: COLORS.red,
    failed: COLORS.red,
}[status.toLowerCase()] ?? COLORS.muted);

export function StatusBadge({ status }: { status: string }) {
    const color = statusColor(status);
    return (
        <View style={[styles.status, { backgroundColor: `${color}16` }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
        </View>
    );
}

export function SkeletonBlock({ width = "100%", height = 14, radius = 8 }: { width?: number | `${number}%`; height?: number; radius?: number }) {
    const opacity = useRef(new Animated.Value(0.45)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.9, duration: 650, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);
    return <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: "#E7ECF3", opacity }} />;
}

function PageSkeleton() {
    return (
        <View style={skeletonStyles.wrap}>
            {[0, 1, 2].map((item) => (
                <View key={item} style={skeletonStyles.card}>
                    <View style={skeletonStyles.row}>
                        <SkeletonBlock width={40} height={40} radius={13} />
                        <View style={skeletonStyles.copy}>
                            <SkeletonBlock width="68%" height={12} />
                            <SkeletonBlock width="45%" height={9} />
                        </View>
                        <SkeletonBlock width={58} height={20} radius={99} />
                    </View>
                    <SkeletonBlock width="88%" height={9} />
                    <SkeletonBlock width="54%" height={9} />
                </View>
            ))}
        </View>
    );
}

export function MetricCard({ metric, onPress }: { metric: Metric; onPress?: () => void }) {
    const color = metric.color ?? COLORS.blue;
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole={onPress ? "button" : undefined}
            style={({ pressed }) => [styles.metric, pressed && { transform: [{ scale: 0.98 }] }]}
        >
            <View style={styles.metricHeader}>
                <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={metric.icon} size={18} color={color} />
                </View>
                {onPress ? (
                    <View style={styles.metricArrowWrap}>
                        <Ionicons name="chevron-forward" size={13} color={COLORS.faint} />
                    </View>
                ) : null}
            </View>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            {metric.note ? (
                <View style={styles.metricNoteBadge}>
                    <Text style={styles.metricNoteText}>{metric.note}</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

export function AdminPageFrame({
    eyebrow = "SUPER ADMIN",
    title,
    subtitle,
    metrics = [],
    onMetricPress,
    search,
    onSearch,
    searchPlaceholder = "Search records...",
    filters = [],
    activeFilter = "All",
    onFilter,
    children,
    actionLabel,
    onAction,
}: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    metrics?: Metric[];
    onMetricPress?: (metric: Metric) => void;
    search?: string;
    onSearch?: (value: string) => void;
    searchPlaceholder?: string;
    filters?: string[];
    activeFilter?: string;
    onFilter?: (value: string) => void;
    children: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}) {
    const [frameLoading, setFrameLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setFrameLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.page}>
            <View style={styles.heading}>
                <View style={styles.headingCopy}>
                    <View style={styles.headingEyebrow}>
                        <View style={styles.headingMark} />
                        <Text style={styles.eyebrow}>{eyebrow}</Text>
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                {actionLabel ? (
                    <Pressable onPress={onAction} style={({ pressed }) => [styles.action, pressed && { opacity: 0.75 }]}>
                        <Ionicons name="add" size={16} color={COLORS.ink} />
                        <Text style={styles.actionText}>{actionLabel}</Text>
                    </Pressable>
                ) : null}
            </View>

            {metrics.length > 0 ? (
                <View style={styles.metricGrid}>
                    {metrics.map((metric) => (
                        <MetricCard key={metric.label} metric={metric} onPress={onMetricPress ? () => onMetricPress(metric) : undefined} />
                    ))}
                </View>
            ) : null}

            {onSearch ? (
                <View style={styles.search}>
                    <Ionicons name="search" size={17} color={COLORS.faint} />
                    <TextInput
                        value={search}
                        onChangeText={onSearch}
                        placeholder={searchPlaceholder}
                        placeholderTextColor={COLORS.faint}
                        style={styles.searchInput}
                    />
                    {search ? (
                        <Pressable onPress={() => onSearch("")}>
                            <Ionicons name="close-circle" size={17} color={COLORS.faint} />
                        </Pressable>
                    ) : null}
                </View>
            ) : null}

            {filters.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                    {filters.map((filter) => {
                        const active = filter === activeFilter;
                        return (
                            <Pressable
                                key={filter}
                                onPress={() => onFilter?.(filter)}
                                style={[styles.filter, active && styles.filterActive]}
                            >
                                <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            ) : null}

            <View style={styles.content}>{frameLoading ? <PageSkeleton /> : children}</View>
        </View>
    );
}

export function SchoolFilterBar({
    schools,
    selected,
    onSelect,
    recordsCountBySchool = {},
}: {
    schools: string[];
    selected: string;
    onSelect: (s: string) => void;
    recordsCountBySchool?: Record<string, number>;
}) {
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState("");
    const allOptions = ["All Schools", ...schools];

    const filteredOptions = allOptions.filter((s) =>
        s.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.schoolFilterContainer}>
            {/* Header Selector Button */}
            <Pressable
                onPress={() => {
                    setSearch("");
                    setModalVisible(true);
                }}
                style={({ pressed }) => [styles.schoolSelectButton, pressed && { opacity: 0.85 }]}
            >
                <View style={styles.schoolIconWrap}>
                    <Ionicons name="business" size={15} color={COLORS.blue} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.schoolSelectLabel}>FILTER BY SCHOOL</Text>
                    <Text style={styles.schoolSelectValue} numberOfLines={1}>
                        {selected}
                    </Text>
                </View>
                <View style={styles.schoolDropdownBadge}>
                    <Ionicons name="chevron-down" size={14} color={COLORS.navy} />
                </View>
            </Pressable>

            {/* Horizontal School Chips for 1-Tap Switching */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schoolChipsScroll}>
                {allOptions.map((school) => {
                    const active = school === selected;
                    const count = recordsCountBySchool[school];
                    return (
                        <Pressable
                            key={school}
                            onPress={() => onSelect(school)}
                            style={[styles.schoolChip, active && styles.schoolChipActive]}
                        >
                            <Ionicons
                                name={school === "All Schools" ? "grid-outline" : "school-outline"}
                                size={13}
                                color={active ? COLORS.yellow : COLORS.muted}
                            />
                            <Text style={[styles.schoolChipText, active && styles.schoolChipTextActive]} numberOfLines={1}>
                                {school === "All Schools" ? "All Schools" : school.replace(" Public School", "").replace(" Academy", "").replace(" International", "")}
                            </Text>
                            {count !== undefined ? (
                                <View style={[styles.chipCountBadge, active && styles.chipCountBadgeActive]}>
                                    <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{count}</Text>
                                </View>
                            ) : null}
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Full School Selection Modal with Search */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.sheetBackdrop}>
                    <View style={styles.sheet}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.sheetHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.eyebrow}>FILTER RECORDS</Text>
                                <Text style={styles.sheetTitle}>Select School</Text>
                            </View>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={24} color={COLORS.faint} />
                            </Pressable>
                        </View>

                        {/* Modal Search Input */}
                        <View style={[styles.search, { marginBottom: 10, minHeight: 40 }]}>
                            <Ionicons name="search" size={15} color={COLORS.faint} />
                            <TextInput
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Search school name..."
                                placeholderTextColor={COLORS.faint}
                                style={[styles.searchInput, { fontSize: 11.5 }]}
                            />
                            {search ? (
                                <Pressable onPress={() => setSearch("")}>
                                    <Ionicons name="close-circle" size={15} color={COLORS.faint} />
                                </Pressable>
                            ) : null}
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
                            {filteredOptions.map((school, i) => {
                                const active = school === selected;
                                const count = recordsCountBySchool[school];
                                return (
                                    <Pressable
                                        key={school}
                                        onPress={() => {
                                            onSelect(school);
                                            setModalVisible(false);
                                        }}
                                        style={({ pressed }) => [
                                            styles.schoolModalRow,
                                            active && styles.schoolModalRowActive,
                                            i > 0 && { borderTopWidth: 1, borderTopColor: "#F0F2F5" },
                                            pressed && { backgroundColor: "#F8FAFC" },
                                        ]}
                                    >
                                        <View style={[styles.schoolModalIcon, active && { backgroundColor: COLORS.navy }]}>
                                            <Ionicons
                                                name={school === "All Schools" ? "apps" : "business"}
                                                size={17}
                                                color={active ? COLORS.yellow : COLORS.blue}
                                            />
                                        </View>
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text style={[styles.schoolModalName, active && { color: COLORS.navy, fontFamily: FONT.bold }]} numberOfLines={1}>
                                                {school}
                                            </Text>
                                            <Text style={styles.schoolModalSub}>
                                                {school === "All Schools" ? "Show records from all affiliated schools" : "Affiliated School Network"}
                                            </Text>
                                        </View>
                                        {count !== undefined ? (
                                            <View style={[styles.countPill, active && { backgroundColor: COLORS.navy }]}>
                                                <Text style={[styles.countText, active && { color: "#FFFFFF" }]}>{count}</Text>
                                            </View>
                                        ) : null}
                                        <Ionicons
                                            name={active ? "radio-button-on" : "radio-button-off"}
                                            size={20}
                                            color={active ? COLORS.blue : COLORS.faint}
                                        />
                                    </Pressable>
                                );
                            })}
                            {filteredOptions.length === 0 ? (
                                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                                    <Text style={{ color: COLORS.muted, fontFamily: FONT.regular, fontSize: 11 }}>No matching schools</Text>
                                </View>
                            ) : null}
                        </ScrollView>

                        {selected !== "All Schools" ? (
                            <Pressable
                                onPress={() => {
                                    onSelect("All Schools");
                                    setModalVisible(false);
                                }}
                                style={styles.clearSchoolBtn}
                            >
                                <Ionicons name="refresh" size={15} color={COLORS.red} />
                                <Text style={styles.clearSchoolText}>Reset to All Schools</Text>
                            </Pressable>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export function RecordCard({
    record,
    onView,
    onEdit,
    onToggle,
    onDelete,
    busy,
    toggleLabel,
    actionLabel = "View Profile",
}: {
    record: AdminRecord;
    onView?: () => void;
    onEdit?: () => void;
    onToggle?: () => void;
    onDelete?: () => void;
    busy?: boolean;
    toggleLabel?: string;
    actionLabel?: string;
}) {
    return (
        <Pressable
            onPress={onView}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}
        >
            <View style={styles.cardTop}>
                <View style={styles.recordIcon}>
                    <Ionicons name={record.icon ?? "document-text-outline"} size={19} color={COLORS.blue} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cardTitle}>{record.title}</Text>
                    <Text style={styles.cardSubtitle}>
                        {record.id} · {record.subtitle}
                    </Text>
                </View>
                <StatusBadge status={record.status} />
            </View>
            {record.fields?.map((field, index) => (
                <Text key={`${record.id}-${index}`} style={styles.field}>
                    {field}
                </Text>
            ))}
            <View style={styles.cardActions}>
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        onView?.();
                    }}
                    style={styles.outline}
                >
                    <Ionicons name="eye-outline" size={15} color={COLORS.blue} />
                    <Text style={[styles.outlineText, { color: COLORS.blue }]}>{actionLabel}</Text>
                </Pressable>
                {onEdit ? (
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        style={styles.outline}
                    >
                        <Ionicons name="create-outline" size={15} color={COLORS.ink} />
                        <Text style={styles.outlineText}>Edit</Text>
                    </Pressable>
                ) : null}
                {onToggle ? (
                    <Pressable
                        disabled={busy}
                        onPress={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                        style={[
                            styles.outline,
                            {
                                borderColor: record.status === "blocked" ? `${COLORS.green}55` : `${COLORS.blue}55`,
                                opacity: busy ? 0.6 : 1,
                            },
                        ]}
                    >
                        {busy ? (
                            <ActivityIndicator size="small" color={COLORS.blue} />
                        ) : (
                            <>
                                <Ionicons
                                    name={
                                        toggleLabel
                                            ? "arrow-forward-circle-outline"
                                            : record.status === "blocked"
                                                ? "lock-open-outline"
                                                : "ban-outline"
                                    }
                                    size={15}
                                    color={toggleLabel ? COLORS.blue : record.status === "blocked" ? COLORS.green : COLORS.red}
                                />
                                <Text
                                    style={[
                                        styles.outlineText,
                                        {
                                            color: toggleLabel
                                                ? COLORS.blue
                                                : record.status === "blocked"
                                                    ? COLORS.green
                                                    : COLORS.red,
                                        },
                                    ]}
                                >
                                    {toggleLabel ?? (record.status === "blocked" ? "Unblock" : "Block")}
                                </Text>
                            </>
                        )}
                    </Pressable>
                ) : null}
                {onDelete ? (
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        style={styles.delete}
                    >
                        <Ionicons name="trash-outline" size={15} color={COLORS.red} />
                    </Pressable>
                ) : null}
            </View>
        </Pressable>
    );
}

export function EmptyState({ text = "No records found." }: { text?: string }) {
    return (
        <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={30} color={COLORS.faint} />
            <Text style={styles.emptyText}>{text}</Text>
        </View>
    );
}

const skeletonStyles = StyleSheet.create({
    wrap: { gap: 9 },
    card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 17, padding: 13, gap: 11 },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    copy: { flex: 1, gap: 7 },
});

export function EntityPage({
    title,
    subtitle,
    seed,
    filters = ["All", "Active", "Blocked"],
    searchPlaceholder,
    metrics = [],
    actionLabel = "Add record",
    workflow = "access",
    schoolNames = [],
    onNavigate,
}: {
    title: string;
    subtitle: string;
    seed: AdminRecord[];
    filters?: string[];
    searchPlaceholder?: string;
    metrics?: Metric[];
    actionLabel?: string;
    workflow?: "access" | "payment";
    schoolNames?: string[];
    onNavigate?: (page: string) => void;
}) {
    const [records, setRecords] = useState(seed);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("All");
    const [schoolFilter, setSchoolFilter] = useState("All Schools");
    const [selected, setSelected] = useState<AdminRecord | null>(null);
    const [editing, setEditing] = useState<AdminRecord | null>(null);
    const [busyId, setBusyId] = useState("");

    // Record counts by school for chip badges
    const recordsCountBySchool = useMemo(() => {
        const map: Record<string, number> = { "All Schools": records.length };
        schoolNames.forEach((s) => {
            map[s] = records.filter(
                (r) =>
                    r.subtitle.toLowerCase().includes(s.toLowerCase()) ||
                    r.title.toLowerCase().includes(s.toLowerCase()) ||
                    (r.fields?.some((f) => f.toLowerCase().includes(s.toLowerCase())) ?? false)
            ).length;
        });
        return map;
    }, [records, schoolNames]);

    const visible = useMemo(
        () =>
            records.filter((record) => {
                const normalized = record.status.toLowerCase();
                const filterMatch =
                    filter === "All" ||
                    normalized === filter.toLowerCase() ||
                    (filter.toLowerCase() === "approved" && normalized === "active") ||
                    (filter.toLowerCase() === "rejected" && (normalized === "blocked" || normalized === "inactive"));

                const schoolMatch =
                    schoolFilter === "All Schools" ||
                    record.subtitle.toLowerCase().includes(schoolFilter.toLowerCase()) ||
                    record.title.toLowerCase().includes(schoolFilter.toLowerCase()) ||
                    (record.fields?.some((f) => f.toLowerCase().includes(schoolFilter.toLowerCase())) ?? false);

                const queryMatch =
                    !query ||
                    `${record.title} ${record.subtitle} ${record.id} ${record.fields?.join(" ") ?? ""}`
                        .toLowerCase()
                        .includes(query.toLowerCase());

                return queryMatch && filterMatch && schoolMatch;
            }),
        [records, query, filter, schoolFilter]
    );

    const performToggle = (record: AdminRecord) => {
        setBusyId(record.id);
        setTimeout(() => {
            const nextStatus =
                workflow === "payment"
                    ? record.status === "pending"
                        ? "processing"
                        : record.status === "processing"
                            ? "completed"
                            : "rejected"
                    : record.status === "blocked"
                        ? "active"
                        : "blocked";
            setRecords((items) => items.map((item) => (item.id === record.id ? { ...item, status: nextStatus } : item)));
            setBusyId("");
        }, 250);
    };

    const addRecord = () => {
        const next: AdminRecord = {
            id: `NEW-${records.length + 1}`,
            title: `New ${title.toLowerCase().replace(" management", "")}`,
            subtitle: "Awaiting details · local record",
            status: "pending",
            icon: "add-circle-outline",
            fields: ["Created from frontend form", "Ready for admin review"],
        };
        setRecords((items) => [next, ...items]);
        setSelected(next);
    };

    const saveEdit = () => {
        if (!editing) return;
        setRecords((items) => items.map((item) => (item.id === editing.id ? editing : item)));
        setEditing(null);
    };

    return (
        <AdminPageFrame
            title={title}
            subtitle={subtitle}
            metrics={metrics}
            search={query}
            onSearch={setQuery}
            searchPlaceholder={searchPlaceholder}
            filters={filters}
            activeFilter={filter}
            onFilter={setFilter}
            actionLabel={actionLabel}
            onAction={addRecord}
            onMetricPress={
                onNavigate
                    ? (m) => {
                        const routeByMetric: Record<string, string> = {
                            "Total parents": "parents",
                            "Total drivers": "drivers",
                            "Total students": "students",
                            "Total schools": "schools",
                            "Total buses": "buses",
                            Subscribed: "subscriptions",
                        };
                        const route = routeByMetric[m.label];
                        if (route) onNavigate(route);
                    }
                    : undefined
            }
        >
            {/* School filter selector */}
            {schoolNames.length > 0 ? (
                <SchoolFilterBar
                    schools={schoolNames}
                    selected={schoolFilter}
                    onSelect={setSchoolFilter}
                    recordsCountBySchool={recordsCountBySchool}
                />
            ) : null}

            {/* Result stats bar */}
            <View style={styles.resultBar}>
                <View style={styles.resultBadgeWrap}>
                    <Text style={styles.resultText}>{visible.length} records</Text>
                    {schoolFilter !== "All Schools" ? (
                        <View style={styles.activeSchoolTag}>
                            <Ionicons name="business" size={11} color={COLORS.blue} />
                            <Text style={styles.activeSchoolTagText} numberOfLines={1}>
                                {schoolFilter}
                            </Text>
                            <Pressable onPress={() => setSchoolFilter("All Schools")}>
                                <Ionicons name="close-circle" size={13} color={COLORS.blue} />
                            </Pressable>
                        </View>
                    ) : null}
                </View>
                {query || filter !== "All" || schoolFilter !== "All Schools" ? (
                    <Pressable
                        onPress={() => {
                            setQuery("");
                            setFilter("All");
                            setSchoolFilter("All Schools");
                        }}
                    >
                        <Text style={styles.resetText}>Reset filters</Text>
                    </Pressable>
                ) : null}
            </View>

            {visible.map((record) => (
                <RecordCard
                    key={record.id}
                    record={record}
                    busy={busyId === record.id}
                    toggleLabel={
                        workflow === "payment"
                            ? record.status === "pending"
                                ? "Process"
                                : record.status === "processing"
                                    ? "Complete"
                                    : "Reject"
                            : undefined
                    }
                    onView={() => setSelected(record)}
                    onEdit={() => setEditing(record)}
                    onToggle={() =>
                        workflow === "payment"
                            ? performToggle(record)
                            : record.status === "blocked"
                                ? performToggle(record)
                                : Alert.alert("Block record", `Block ${record.title}?`, [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Block", style: "destructive", onPress: () => performToggle(record) },
                                ])
                    }
                    onDelete={() =>
                        Alert.alert("Delete record", `Archive ${record.title}?`, [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Archive",
                                style: "destructive",
                                onPress: () => setRecords((items) => items.map((item) => (item.id === record.id ? { ...item, status: "inactive" } : item))),
                            },
                        ])
                    }
                />
            ))}

            {visible.length === 0 ? <EmptyState text="No matching records. Try resetting filters." /> : null}

            {/* Comprehensive Record details modal */}
            <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
                <View style={styles.sheetBackdrop}>
                    <View style={[styles.sheet, { maxHeight: "88%" }]}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.sheetHeader}>
                            <View style={[styles.recordIcon, { backgroundColor: "#EEF2FF", width: 38, height: 38, borderRadius: 12 }]}>
                                <Ionicons name={selected?.icon ?? "document-text-outline"} size={22} color={COLORS.blue} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                                <Text style={styles.eyebrow}>{selected?.id} · PROFILE DOSSIER</Text>
                                <Text style={styles.sheetTitle} numberOfLines={1}>
                                    {selected?.title}
                                </Text>
                                <Text style={styles.sheetSubtitle} numberOfLines={1}>
                                    {selected?.subtitle}
                                </Text>
                            </View>
                            <Pressable onPress={() => setSelected(null)}>
                                <Ionicons name="close-circle" size={26} color={COLORS.faint} />
                            </Pressable>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <StatusBadge status={selected?.status ?? ""} />
                            {selected?.phone ? (
                                <View style={styles.phoneChip}>
                                    <Ionicons name="call" size={12} color={COLORS.green} />
                                    <Text style={styles.phoneChipText}>{selected.phone}</Text>
                                </View>
                            ) : null}
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 1, marginBottom: 10 }}>
                            {selected?.details && selected.details.length > 0 ? (
                                <View style={styles.detailsList}>
                                    {selected.details.map((item, idx) => (
                                        <View
                                            key={item.label}
                                            style={[
                                                styles.detailCardRow,
                                                idx > 0 && { borderTopWidth: 1, borderTopColor: "#F0F2F5" },
                                            ]}
                                        >
                                            <View style={styles.detailIconBox}>
                                                <Ionicons name={item.icon ?? "information-circle-outline"} size={16} color={COLORS.blue} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 10 }}>
                                                <Text style={styles.detailCardLabel}>{item.label}</Text>
                                                <Text style={styles.detailCardValue}>{item.value}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.detailsList}>
                                    {selected?.fields?.map((field, idx) => (
                                        <View key={idx} style={[styles.detailCardRow, idx > 0 && { borderTopWidth: 1, borderTopColor: "#F0F2F5" }]}>
                                            <View style={styles.detailIconBox}>
                                                <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.blue} />
                                            </View>
                                            <Text style={[styles.detailCardValue, { flex: 1, marginLeft: 10 }]}>{field}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooterActions}>
                            <Pressable
                                onPress={() => {
                                    const target = selected;
                                    setSelected(null);
                                    if (target) setEditing(target);
                                }}
                                style={[styles.outline, { flex: 1, justifyContent: "center", minHeight: 44, borderRadius: 12 }]}
                            >
                                <Ionicons name="create-outline" size={16} color={COLORS.ink} />
                                <Text style={[styles.outlineText, { fontSize: 12 }]}>Edit Record</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    if (selected) performToggle(selected);
                                    setSelected(null);
                                }}
                                style={[
                                    styles.action,
                                    {
                                        flex: 1,
                                        justifyContent: "center",
                                        minHeight: 44,
                                        borderRadius: 12,
                                        backgroundColor: selected?.status === "blocked" ? COLORS.green : COLORS.navy,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={selected?.status === "blocked" ? "lock-open" : "ban"}
                                    size={16}
                                    color="#FFFFFF"
                                />
                                <Text style={[styles.actionText, { color: "#FFFFFF", fontSize: 12 }]}>
                                    {selected?.status === "blocked" ? "Unblock Access" : "Block Access"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit modal */}
            <Modal visible={Boolean(editing)} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
                <View style={styles.sheetBackdrop}>
                    <View style={styles.editSheet}>
                        <Text style={styles.eyebrow}>EDIT RECORD</Text>
                        <Text style={styles.sheetTitle}>{editing?.id}</Text>
                        <Text style={styles.formLabel}>Name / title</Text>
                        <TextInput
                            value={editing?.title ?? ""}
                            onChangeText={(value) => setEditing((item) => (item ? { ...item, title: value } : item))}
                            style={styles.formInput}
                        />
                        <Text style={styles.formLabel}>Details</Text>
                        <TextInput
                            value={editing?.subtitle ?? ""}
                            onChangeText={(value) => setEditing((item) => (item ? { ...item, subtitle: value } : item))}
                            style={styles.formInput}
                        />
                        <Text style={styles.formLabel}>Status</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                            {filters
                                .filter((item) => item !== "All")
                                .map((item) => (
                                    <Pressable
                                        key={item}
                                        onPress={() => setEditing((record) => (record ? { ...record, status: item.toLowerCase() } : record))}
                                        style={[styles.filter, editing?.status.toLowerCase() === item.toLowerCase() && styles.filterActive]}
                                    >
                                        <Text style={styles.filterText}>{item}</Text>
                                    </Pressable>
                                ))}
                        </ScrollView>
                        <View style={styles.sheetActions}>
                            <Pressable onPress={() => setEditing(null)} style={styles.outline}>
                                <Text style={styles.outlineText}>Cancel</Text>
                            </Pressable>
                            <Pressable onPress={saveEdit} style={styles.primarySheetAction}>
                                <Text style={styles.actionText}>Save changes</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </AdminPageFrame>
    );
}

export const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: COLORS.bg },
    heading: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 14 },
    headingCopy: { flex: 1, minWidth: 0 },
    headingEyebrow: { flexDirection: "row", alignItems: "center", gap: 6 },
    headingMark: { width: 7, height: 7, borderRadius: 99, backgroundColor: COLORS.yellow },
    eyebrow: { color: COLORS.blue, fontFamily: FONT.bold, letterSpacing: 1.2, fontSize: 10, marginBottom: 3 },
    title: { color: COLORS.ink, fontFamily: FONT.display, fontSize: 23, letterSpacing: -0.5 },
    subtitle: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 11, marginTop: 3 },
    sectionTitle: { color: COLORS.ink, fontFamily: FONT.display, fontSize: 15.5, marginTop: 14, marginBottom: 8 },

    // Responsive 2-Column Metric Grid
    metricGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginBottom: 12 },
    metric: {
        flexBasis: "48%",
        flexGrow: 1,
        minHeight: 105,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 11,
        shadowColor: "#172554",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
    },
    metricHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    metricIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    metricArrowWrap: { width: 20, height: 20, borderRadius: 6, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
    metricLabel: { color: COLORS.muted, fontFamily: FONT.semibold, fontSize: 10 },
    metricValue: { color: COLORS.ink, fontFamily: FONT.display, fontSize: 20, marginTop: 2 },
    metricNoteBadge: { alignSelf: "flex-start", marginTop: 4, backgroundColor: "#F2F4F7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    metricNoteText: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 8.5 },

    // School filter components
    schoolFilterContainer: { marginBottom: 10 },
    schoolSelectButton: {
        minHeight: 46,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        paddingHorizontal: 11,
        shadowColor: "#172554",
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    schoolIconWrap: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
    schoolSelectLabel: { color: COLORS.blue, fontFamily: FONT.bold, fontSize: 8, letterSpacing: 0.8 },
    schoolSelectValue: { color: COLORS.ink, fontFamily: FONT.bold, fontSize: 12, marginTop: 1 },
    schoolDropdownBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: "#FFF8DB", alignItems: "center", justifyContent: "center" },
    schoolChipsScroll: { gap: 6, paddingVertical: 8 },
    schoolChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 99,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    schoolChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
    schoolChipText: { color: COLORS.muted, fontFamily: FONT.semibold, fontSize: 10.5 },
    schoolChipTextActive: { color: COLORS.yellow, fontFamily: FONT.bold },
    chipCountBadge: { backgroundColor: "#F2F4F7", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 99, marginLeft: 2 },
    chipCountBadgeActive: { backgroundColor: "rgba(255,255,255,0.2)" },
    chipCountText: { color: COLORS.muted, fontFamily: FONT.bold, fontSize: 9 },
    chipCountTextActive: { color: "#FFFFFF" },

    // School modal list
    schoolModalRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 12 },
    schoolModalRowActive: { backgroundColor: "#F8FAFC" },
    schoolModalIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
    schoolModalName: { color: COLORS.ink, fontFamily: FONT.semibold, fontSize: 12.5 },
    schoolModalSub: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 10, marginTop: 1 },
    clearSchoolBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 12,
        paddingVertical: 10,
        backgroundColor: "#FFF1F2",
        borderRadius: 12,
    },
    clearSchoolText: { color: COLORS.red, fontFamily: FONT.bold, fontSize: 11 },

    // Search and general filters
    search: {
        height: 44,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 13,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        marginBottom: 6,
        shadowColor: "#172554",
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    searchInput: { flex: 1, color: COLORS.ink, fontFamily: FONT.regular, fontSize: 12 },
    filters: { gap: 6, paddingVertical: 6 },
    filter: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#FFFFFF", borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 },
    filterActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
    filterText: { color: COLORS.muted, fontFamily: FONT.semibold, fontSize: 10 },
    filterTextActive: { color: COLORS.yellow, fontFamily: FONT.bold },

    // Result stats bar
    resultBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, marginBottom: 8 },
    resultBadgeWrap: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", flex: 1 },
    resultText: { color: COLORS.muted, fontFamily: FONT.semibold, fontSize: 10.5 },
    activeSchoolTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#EEF2FF",
        borderWidth: 1,
        borderColor: "#D9E2FF",
        borderRadius: 99,
        paddingHorizontal: 7,
        paddingVertical: 2,
        maxWidth: 180,
    },
    activeSchoolTagText: { color: COLORS.blue, fontFamily: FONT.bold, fontSize: 9.5 },
    resetText: { color: COLORS.blue, fontFamily: FONT.bold, fontSize: 10.5 },

    // Cards
    card: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 12,
        marginBottom: 9,
        shadowColor: "#172554",
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    cardTop: { flexDirection: "row", alignItems: "center" },
    recordIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
    cardTitle: { color: COLORS.ink, fontFamily: FONT.semibold, fontSize: 13 },
    cardSubtitle: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 10, marginTop: 2 },
    status: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 4 },
    statusDot: { width: 5, height: 5, borderRadius: 99 },
    statusText: { fontFamily: FONT.bold, fontSize: 9 },
    field: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 10.5, marginTop: 8, paddingTop: 7, borderTopWidth: 1, borderTopColor: "#F0F2F5" },
    cardActions: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
    outline: { minHeight: 30, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
    outlineText: { fontFamily: FONT.bold, fontSize: 9 },
    delete: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#FFF1F2", alignItems: "center", justifyContent: "center" },
    empty: { alignItems: "center", justifyContent: "center", paddingVertical: 36, gap: 8 },
    emptyText: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 11.5 },
    action: { backgroundColor: COLORS.yellow, borderRadius: 10, minHeight: 36, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4 },
    actionText: { color: COLORS.ink, fontFamily: FONT.bold, fontSize: 10 },

    // Sheets & Modals
    sheetBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "flex-end" },
    sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, minHeight: 280 },
    editSheet: { backgroundColor: "#FFFFFF", borderRadius: 20, margin: 16, padding: 16 },
    sheetHandle: { width: 40, height: 4, borderRadius: 99, alignSelf: "center", backgroundColor: "#D0D5DD", marginBottom: 12 },
    sheetHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
    sheetTitle: { color: COLORS.ink, fontFamily: FONT.display, fontSize: 18, marginBottom: 2 },
    sheetSubtitle: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 10.5 },
    sheetField: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 11, borderTopWidth: 1, borderTopColor: "#F0F2F5", paddingVertical: 9 },
    primarySheetAction: { minHeight: 40, borderRadius: 11, backgroundColor: COLORS.yellow, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 10 },
    sheetActions: { flexDirection: "row", gap: 8, marginTop: 8 },
    countPill: { borderRadius: 99, backgroundColor: "#F2F4F7", paddingHorizontal: 7, paddingVertical: 4 },
    countText: { color: "#667085", fontFamily: FONT.Bold ?? FONT.bold, fontSize: 9 },

    // Dossier Modal styles
    phoneChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ECFDF3", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    phoneChipText: { color: COLORS.green, fontFamily: FONT.bold, fontSize: 9.5 },
    detailsList: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 14, paddingHorizontal: 11, paddingVertical: 4 },
    detailCardRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 9 },
    detailIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginTop: 2 },
    detailCardLabel: { color: COLORS.muted, fontFamily: FONT.semibold, fontSize: 9.5 },
    detailCardValue: { color: COLORS.ink, fontFamily: FONT.bold, fontSize: 11.5, marginTop: 2, lineHeight: 16 },
    modalFooterActions: { flexDirection: "row", gap: 8, marginTop: 8 },

    // Form styles
    formCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 13, marginBottom: 14 },
    formLabel: { color: COLORS.ink, fontFamily: FONT.semibold, fontSize: 10.5, marginTop: 7, marginBottom: 5 },
    formInput: { minHeight: 42, borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, paddingHorizontal: 10, color: COLORS.ink, fontFamily: FONT.regular, fontSize: 11.5 },
    formArea: { minHeight: 90, borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, padding: 10, color: COLORS.ink, fontFamily: FONT.regular, textAlignVertical: "top" },
    recipientRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
    recipient: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 99, backgroundColor: "#EEF2FF" },
    recipientText: { color: COLORS.blue, fontFamily: FONT.semibold, fontSize: 9.5 },
    chart: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 13 },
    chartValue: { color: COLORS.ink, fontFamily: FONT.display, fontSize: 22, marginTop: 3 },
    bars: { height: 120, marginTop: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around" },
    barColumn: { alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 4 },
    bar: { width: 16, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: COLORS.blue },
    barLabel: { color: COLORS.faint, fontFamily: FONT.regular, fontSize: 8.5, marginBottom: 3 },
    securityCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 13, marginBottom: 9 },
    settingsRow: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, padding: 13, marginBottom: 9 },
    content: { paddingBottom: 24 },
});
