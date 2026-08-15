import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EntityPage, styles, COLORS, FONT } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";

const logs = [
  { id: "LOG-01", title: "Approved school registration", subtitle: "Bluebells Public School · Super Admin · Today 09:12", status: "completed", icon: "checkmark-done" as const, fields: ["Action: Approve School Account · IP 192.168.1.10", "Target: SCH-101 · Rohan Mehta"] },
  { id: "LOG-02", title: "Processed subscription payment", subtitle: "St. Xavier's Academy · Super Admin · Yesterday 16:20", status: "completed", icon: "wallet" as const, fields: ["Action: Verify Payment SUB-20260813-92", "Amount: ₹999 · Parent Sanjay Gupta"] },
  { id: "LOG-03", title: "Blocked parent account", subtitle: "Green Valley School · Super Admin · Yesterday 13:10", status: "completed", icon: "ban" as const, fields: ["Action: Block Parent Access · Reason: Non-payment", "Target: PAR-203 · Meera Joshi"] },
  { id: "LOG-04", title: "Assigned driver to route", subtitle: "Bluebells Public School · Super Admin · 13 Aug 11:30", status: "completed", icon: "person" as const, fields: ["Action: Driver Vikram Yadav assigned to Bus 101", "Route: Dwarka Morning Route"] },
  { id: "LOG-05", title: "Processed withdrawal payout", subtitle: "St. Xavier's Academy · Super Admin · 12 Aug 15:45", status: "completed", icon: "wallet" as const, fields: ["Action: Bank payout ₹12,600 verified", "Target: ICICI Bank ****0901"] },
  { id: "LOG-06", title: "Blocked school account", subtitle: "Little Stars International · Super Admin · 11 Aug 17:00", status: "completed", icon: "ban" as const, fields: ["Action: Block School Access · Reason: Compliance issue", "Target: SCH-104 · Priya Kapoor"] },
];

export default function AuditLogsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [exportContent, setExportContent] = useState("");

  const handleExportLogs = () => {
    const headers = "Log ID,Action,Target / Details,Status,Timestamp\n";
    const rows = logs
      .map((l) => `"${l.id}","${l.title}","${l.subtitle}","${l.status}","${l.fields?.join(" | ") || ""}"`)
      .join("\n");

    const content = `${headers}${rows}\n\n---\nTotal Logs: ${logs.length}\nExported: ${new Date().toLocaleString()}\nBy: Super Admin Master`;
    setExportContent(content);
    setModalVisible(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: "TrackIQ_Audit_Logs.csv",
        message: exportContent,
      });
    } catch {
      Alert.alert("Share Failed", "Could not open share dialog.");
    }
  };

  return (
    <>
      <EntityPage
        title="Audit logs"
        subtitle="Every local Super Admin action is recorded with timestamp and target."
        seed={logs}
        schoolNames={SCHOOL_NAMES}
        onNavigate={onNavigate}
        metrics={[
          { label: "Total logs", value: logs.length, icon: "document-text", color: "#2563EB" },
          { label: "Completed actions", value: logs.length, icon: "checkmark-circle", color: "#16A34A" },
          { label: "Admins active", value: 1, icon: "shield-checkmark", color: "#7C3AED" },
        ]}
        filters={["All", "Completed"]}
        searchPlaceholder="Action, school, admin, user or target"
        actionLabel="Export logs"
        onAction={handleExportLogs}
      />

      {/* Export Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { maxHeight: "80%" }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={[styles.recordIcon, { backgroundColor: "#EEF2FF", width: 38, height: 38, borderRadius: 12 }]}>
                <Ionicons name="document-text" size={20} color={COLORS.blue} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.eyebrow}>AUDIT TRAIL EXPORT</Text>
                <Text style={styles.sheetTitle}>TrackIQ_Audit_Logs.csv</Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.faint} />
              </Pressable>
            </View>

            <View style={logExp.codeBox}>
              <ScrollView showsVerticalScrollIndicator style={{ maxHeight: 200 }}>
                <Text style={logExp.codeText}>{exportContent}</Text>
              </ScrollView>
            </View>

            <Pressable onPress={handleShare} style={logExp.shareBtn}>
              <Ionicons name="share-social" size={17} color="#FFFFFF" />
              <Text style={logExp.shareBtnText}>Share / Save CSV File</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const logExp = StyleSheet.create({
  codeBox: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  codeText: { color: "#E2E8F0", fontFamily: "monospace", fontSize: 10, lineHeight: 15 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#172554",
    borderRadius: 12,
    paddingVertical: 12,
  },
  shareBtnText: { color: "#FFFFFF", fontFamily: FONT.bold, fontSize: 12 },
});
