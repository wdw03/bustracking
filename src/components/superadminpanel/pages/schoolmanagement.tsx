import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EntityPage, StatusBadge, styles as kitStyles } from "./pagekit";
import { schoolMetrics, schools, schoolDetails, SchoolDetail, SCHOOL_NAMES } from "./mockData";
import SuperAdminFleetMap from "./superadminmap";
import SchoolInsights from "./schoolinsights";

export default function SchoolManagementPage() {
  const [selectedSchool, setSelectedSchool] = useState<SchoolDetail | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <SchoolInsights />
      <SuperAdminFleetMap />

      {/* School Detail Modal */}
      <Modal visible={Boolean(selectedSchool)} transparent animationType="slide" onRequestClose={() => setSelectedSchool(null)}>
        <View style={kitStyles.sheetBackdrop}>
          <View style={sd.detailSheet}>
            <View style={kitStyles.sheetHandle} />
            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={kitStyles.eyebrow}>SCHOOL DETAILS</Text>
                <Text style={kitStyles.sheetTitle}>{selectedSchool?.name}</Text>
              </View>
              <Pressable onPress={() => setSelectedSchool(null)}><Ionicons name="close-circle" size={24} color="#98A2B3" /></Pressable>
            </View>
            {selectedSchool ? <StatusBadge status={selectedSchool.status} /> : null}
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              {selectedSchool ? (
                <>
                  <DetailSection title="Basic Information" icon="information-circle" color="#2563EB">
                    <DetailRow label="School ID" value={selectedSchool.id} />
                    <DetailRow label="Admin" value={selectedSchool.admin} />
                    <DetailRow label="Email" value={selectedSchool.email} />
                    <DetailRow label="Phone" value={selectedSchool.phone} />
                    <DetailRow label="Website" value={selectedSchool.website} />
                    <DetailRow label="GST Number" value={selectedSchool.gstNumber} />
                  </DetailSection>
                  <DetailSection title="Address" icon="location" color="#16A34A">
                    <DetailRow label="Address" value={selectedSchool.address} />
                    <DetailRow label="City" value={selectedSchool.city} />
                    <DetailRow label="State" value={selectedSchool.state} />
                    <DetailRow label="Pincode" value={selectedSchool.pincode} />
                  </DetailSection>
                  <DetailSection title="Principal" icon="person" color="#7C3AED">
                    <DetailRow label="Name" value={selectedSchool.principal} />
                    <DetailRow label="Phone" value={selectedSchool.principalPhone} />
                  </DetailSection>
                  <DetailSection title="Plan & Billing" icon="card" color="#DB2777">
                    <DetailRow label="Plan" value={selectedSchool.plan} />
                    <DetailRow label="Expiry" value={selectedSchool.planExpiry} />
                    <DetailRow label="Registered on" value={selectedSchool.registeredOn} />
                  </DetailSection>
                  <DetailSection title="Fleet & People" icon="stats-chart" color="#EA580C">
                    <DetailRow label="Students" value={String(selectedSchool.studentCount)} />
                    <DetailRow label="Parents" value={String(selectedSchool.parentCount)} />
                    <DetailRow label="Buses" value={String(selectedSchool.busCount)} />
                    <DetailRow label="Drivers" value={String(selectedSchool.driverCount)} />
                  </DetailSection>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <EntityPage
        title="School management"
        subtitle="Manage registrations, accounts, plans, users and school transport."
        seed={schools.map((s) => ({
          ...s,
          fields: [
            ...(s.fields ?? []),
            `Tap "View" for full details`
          ],
        }))}
        metrics={[...schoolMetrics, { label: "Pending requests", value: 1, icon: "time", color: "#EA580C" }]}
        filters={["All", "Active", "Pending", "Blocked"]}
        searchPlaceholder="Search school, ID, admin or mobile"
        actionLabel="Add school request"
      />
    </View>
  );
}

function DetailSection({ title, icon, color, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; color: string; children: React.ReactNode }) {
  return (
    <View style={sd.section}>
      <View style={sd.sectionHeader}>
        <View style={[sd.sectionIcon, { backgroundColor: `${color}16` }]}><Ionicons name={icon} size={15} color={color} /></View>
        <Text style={sd.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={sd.detailRow}>
      <Text style={sd.detailLabel}>{label}</Text>
      <Text style={sd.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const sd = StyleSheet.create({
  detailSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 18, maxHeight: "85%", flex: 1 },
  section: { marginBottom: 16, backgroundColor: "#F8FAFC", borderRadius: 14, borderWidth: 1, borderColor: "#E4E7EC", padding: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionTitle: { color: "#101828", fontFamily: "Inter-Bold", fontSize: 12 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 7, borderTopWidth: 1, borderTopColor: "#F0F2F5" },
  detailLabel: { width: 100, color: "#667085", fontFamily: "Inter-SemiBold", fontSize: 10.5 },
  detailValue: { flex: 1, color: "#101828", fontFamily: "Inter-Regular", fontSize: 11.5, textAlign: "right" },
});
