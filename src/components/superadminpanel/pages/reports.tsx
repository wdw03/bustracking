import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminPageFrame, SchoolFilterBar, MetricCard, styles, COLORS } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";

export default function ReportsPage() {
  const [schoolFilter, setSchoolFilter] = useState("All Schools");

  const revenueData: Record<string, { total: string; bars: number[] }> = {
    "All Schools": { total: "₹3,84,920", bars: [42, 56, 49, 68, 62, 86, 74] },
    "Bluebells Public School": { total: "₹1,84,200", bars: [20, 28, 25, 34, 30, 42, 38] },
    "St. Xavier's Academy": { total: "₹1,42,800", bars: [15, 20, 18, 24, 22, 32, 28] },
    "Green Valley School": { total: "₹42,120", bars: [5, 6, 4, 8, 7, 9, 6] },
    "Little Stars International": { total: "₹15,800", bars: [2, 2, 2, 2, 3, 3, 2] },
  };

  const currentRevenue = revenueData[schoolFilter] ?? revenueData["All Schools"];

  return (
    <AdminPageFrame
      title="Reports & Analytics"
      subtitle="School registrations, bus usage, revenue and subscription analytics."
      actionLabel="Export CSV"
      onAction={() => undefined}
      metrics={[
        { label: "Total revenue", value: currentRevenue.total, icon: "cash", color: "#0F766E" },
        { label: "Fleet efficiency", value: "94%", icon: "bus", color: "#16A34A" },
        { label: "Active parents", value: schoolFilter === "All Schools" ? "2,176" : "714", icon: "people", color: "#7C3AED" },
        { label: "Withdrawals", value: "₹41,000", icon: "wallet", color: "#EA580C" },
      ]}
    >
      {/* School filter selector */}
      <SchoolFilterBar
        schools={SCHOOL_NAMES}
        selected={schoolFilter}
        onSelect={setSchoolFilter}
      />

      <View style={styles.chart}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={styles.cardTitle}>Monthly Revenue Trend</Text>
            <Text style={styles.cardSubtitle}>{schoolFilter}</Text>
          </View>
          <View style={{ backgroundColor: "#ECFDF3", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ color: "#16A34A", fontFamily: "Inter-Bold", fontSize: 9.5 }}>+14.8% GROWTH</Text>
          </View>
        </View>

        <Text style={styles.chartValue}>{currentRevenue.total}</Text>

        <View style={styles.bars}>
          {currentRevenue.bars.map((height, index) => (
            <View key={index} style={styles.barColumn}>
              <View style={[styles.bar, { height: height * 1.1 }]} />
              <Text style={styles.barLabel}>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][index]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        <Pressable style={[styles.outline, { flex: 1, justifyContent: "center" }]}>
          <Ionicons name="document-text-outline" size={14} color={COLORS.navy} />
          <Text style={styles.outlineText}>Export PDF Report</Text>
        </Pressable>
        <Pressable style={[styles.outline, { flex: 1, justifyContent: "center" }]}>
          <Ionicons name="download-outline" size={14} color={COLORS.navy} />
          <Text style={styles.outlineText}>Export CSV Data</Text>
        </Pressable>
      </View>
    </AdminPageFrame>
  );
}
