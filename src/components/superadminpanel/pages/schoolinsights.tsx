import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminRecord, StatusBadge } from "./pagekit";
import { buses, drivers, parents, students } from "./mockData";

type RelatedKey = "parents" | "students" | "buses" | "drivers";
type SchoolSummary = { id: string; name: string; city: string; parents: number; students: number; buses: number; drivers: number };

const SCHOOL_SUMMARIES: SchoolSummary[] = [];

const RELATED: Record<RelatedKey, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; records: AdminRecord[] }> = {
  parents: { label: "Parents", icon: "people", color: "#7C3AED", records: parents },
  students: { label: "Students", icon: "school", color: "#16A34A", records: students },
  buses: { label: "Buses", icon: "bus", color: "#0891B2", records: buses },
  drivers: { label: "Drivers", icon: "person", color: "#EA580C", records: drivers },
};

const ALL_SCHOOLS: SchoolSummary = { id: "all", name: "All schools", city: "0 schools", parents: 0, students: 0, buses: 0, drivers: 0 };

export default function SchoolInsights() {
  const [schoolId, setSchoolId] = useState("all");
  const [relatedKey, setRelatedKey] = useState<RelatedKey>("parents");
  const selectedSchool = SCHOOL_SUMMARIES.find((school) => school.id === schoolId) ?? ALL_SCHOOLS;
  const related = RELATED[relatedKey];
  const visibleRecords = useMemo(() => schoolId === "all" ? related.records : related.records.filter((record) => `${record.title} ${record.subtitle} ${record.fields?.join(" ") ?? ""}`.includes(selectedSchool.name)), [related.records, schoolId, selectedSchool.name]);
  const selectedCount = selectedSchool[relatedKey];

  return <View style={styles.panel}>
    <View style={styles.headingRow}>
      <View style={styles.headingIcon}><Ionicons name="funnel" size={18} color="#172554" /></View>
      <View style={styles.headingCopy}><Text style={styles.eyebrow}>SCHOOL-WISE FILTER</Text><Text style={styles.title}>School insights</Text><Text style={styles.subtitle}>Choose a school to view its parents, students, buses and drivers.</Text></View>
    </View>

    <Text style={styles.sectionLabel}>Select school</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schoolFilters}>
      {[ALL_SCHOOLS, ...SCHOOL_SUMMARIES].map((school) => { const active = schoolId === school.id; return <Pressable key={school.id} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setSchoolId(school.id)} style={[styles.schoolFilter, active && styles.schoolFilterActive]}>
        <View style={[styles.schoolDot, active && styles.schoolDotActive]} /><View style={styles.schoolCopy}><Text numberOfLines={1} style={[styles.schoolName, active && styles.schoolNameActive]}>{school.name}</Text><Text style={[styles.schoolCity, active && styles.schoolCityActive]}>{school.city}</Text></View>{active ? <Ionicons name="checkmark-circle" size={16} color="#FFD60A" /> : null}
      </Pressable>; })}
    </ScrollView>

    <View style={styles.selectedBanner}><View style={styles.selectedIcon}><Ionicons name={schoolId === "all" ? "business" : "school"} size={19} color="#2563EB" /></View><View style={styles.selectedCopy}><Text numberOfLines={1} style={styles.selectedName}>{selectedSchool.name}</Text><Text style={styles.selectedMeta}>{schoolId === "all" ? "Combined network totals" : `${selectedSchool.city}  ·  ${selectedSchool.id}`}</Text></View></View>

    <View style={styles.countGrid}>{(Object.keys(RELATED) as RelatedKey[]).map((key) => { const item = RELATED[key]; const active = relatedKey === key; return <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setRelatedKey(key)} style={[styles.countCard, active && { borderColor: item.color, backgroundColor: `${item.color}0D` }]}>
      <View style={[styles.countIcon, { backgroundColor: `${item.color}18` }]}><Ionicons name={item.icon} size={17} color={item.color} /></View><Text style={styles.countValue}>{selectedSchool[key].toLocaleString()}</Text><Text style={[styles.countLabel, active && { color: item.color }]}>{item.label}</Text>{active ? <View style={[styles.activeLine, { backgroundColor: item.color }]} /> : null}
    </Pressable>; })}</View>

    <View style={styles.recordsHeader}><View style={styles.recordsCopy}><Text numberOfLines={1} style={styles.recordsTitle}>{related.label} in {selectedSchool.name}</Text><Text style={styles.recordsMeta}>{selectedCount.toLocaleString()} registered  ·  {visibleRecords.length} sample records shown</Text></View><View style={[styles.totalPill, { backgroundColor: `${related.color}14` }]}><Text style={[styles.totalPillText, { color: related.color }]}>{selectedCount.toLocaleString()}</Text></View></View>

    {visibleRecords.length > 0 ? visibleRecords.map((record) => <View key={`${relatedKey}-${record.id}`} style={styles.recordRow}><View style={[styles.recordIcon, { backgroundColor: `${related.color}14` }]}><Ionicons name={record.icon ?? related.icon} size={17} color={related.color} /></View><View style={styles.recordCopy}><Text numberOfLines={1} style={styles.recordTitle}>{record.title}</Text><Text numberOfLines={2} style={styles.recordSubtitle}>{record.subtitle}</Text></View><StatusBadge status={record.status} /></View>) : <View style={styles.emptyState}><Ionicons name="file-tray-outline" size={24} color="#98A2B3" /><Text style={styles.emptyTitle}>No sample {related.label.toLowerCase()} loaded</Text><Text style={styles.emptyText}>{selectedCount.toLocaleString()} registered {related.label.toLowerCase()} are included in the school total.</Text></View>}
  </View>;
}

const styles = StyleSheet.create({
  panel: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DCE3EC", borderRadius: 18, padding: 14, marginBottom: 12 },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, headingIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFD60A", alignItems: "center", justifyContent: "center" }, headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: "#2563EB", fontFamily: "Inter-Bold", fontSize: 9, letterSpacing: 0.8 }, title: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 18, marginTop: 2 }, subtitle: { color: "#667085", fontFamily: "Inter-Regular", fontSize: 10.5, marginTop: 4, lineHeight: 15 },
  sectionLabel: { color: "#344054", fontFamily: "Inter-Bold", fontSize: 10.5, marginTop: 15, marginBottom: 7 }, schoolFilters: { gap: 8, paddingRight: 4 },
  schoolFilter: { minWidth: 172, maxWidth: 220, minHeight: 54, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E4E7EC", backgroundColor: "#F8FAFC" }, schoolFilterActive: { borderColor: "#172554", backgroundColor: "#172554" }, schoolDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D0D5DD" }, schoolDotActive: { backgroundColor: "#FFD60A" }, schoolCopy: { flex: 1, minWidth: 0 }, schoolName: { color: "#344054", fontFamily: "Inter-SemiBold", fontSize: 10.5 }, schoolNameActive: { color: "#FFFFFF" }, schoolCity: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 9, marginTop: 2 }, schoolCityActive: { color: "#C7D2FE" },
  selectedBanner: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#F5F8FF", borderRadius: 12, padding: 10, marginTop: 11, borderWidth: 1, borderColor: "#D9E2FF" }, selectedIcon: { width: 35, height: 35, borderRadius: 10, backgroundColor: "#E8EEFF", alignItems: "center", justifyContent: "center" }, selectedCopy: { flex: 1, minWidth: 0 }, selectedName: { color: "#101828", fontFamily: "Inter-Bold", fontSize: 12 }, selectedMeta: { color: "#667085", fontFamily: "Inter-Regular", fontSize: 9.5, marginTop: 2 },
  countGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }, countCard: { width: "48%", flexGrow: 1, minHeight: 92, borderRadius: 12, borderWidth: 1, borderColor: "#E4E7EC", backgroundColor: "#FFFFFF", padding: 10, position: "relative", overflow: "hidden" }, countIcon: { width: 29, height: 29, borderRadius: 9, alignItems: "center", justifyContent: "center" }, countValue: { color: "#101828", fontFamily: "Sora-Bold", fontSize: 19, marginTop: 5 }, countLabel: { color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 10, marginTop: 1 }, activeLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3 },
  recordsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 15, marginBottom: 8 }, recordsCopy: { flex: 1, minWidth: 0 }, recordsTitle: { color: "#101828", fontFamily: "Inter-Bold", fontSize: 11.5 }, recordsMeta: { color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 9, marginTop: 2 }, totalPill: { minWidth: 44, minHeight: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }, totalPillText: { fontFamily: "Inter-Bold", fontSize: 11 },
  recordRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 9, borderTopWidth: 1, borderTopColor: "#EEF1F5", paddingVertical: 8 }, recordIcon: { width: 35, height: 35, borderRadius: 10, alignItems: "center", justifyContent: "center" }, recordCopy: { flex: 1, minWidth: 0 }, recordTitle: { color: "#101828", fontFamily: "Inter-SemiBold", fontSize: 11 }, recordSubtitle: { color: "#667085", fontFamily: "Inter-Regular", fontSize: 9.5, marginTop: 2, lineHeight: 13 },
  emptyState: { alignItems: "center", justifyContent: "center", borderTopWidth: 1, borderTopColor: "#EEF1F5", paddingVertical: 21 }, emptyTitle: { color: "#344054", fontFamily: "Inter-SemiBold", fontSize: 11, marginTop: 6 }, emptyText: { maxWidth: 260, color: "#98A2B3", fontFamily: "Inter-Regular", fontSize: 9.5, textAlign: "center", marginTop: 3, lineHeight: 14 },
});