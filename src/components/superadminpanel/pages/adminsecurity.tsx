import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminPageFrame, COLORS, FONT, styles } from "./pagekit";

export default function AdminSecurityPage({
  onChangePassword,
  onLogout,
}: {
  onChangePassword?: () => void;
  onLogout?: () => void;
}) {
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  const handlePasswordSave = () => {
    if (!newPwd || newPwd !== confirmPwd) {
      Alert.alert("Error", "New passwords do not match or are empty.");
      return;
    }
    Alert.alert("Success", "Master password updated successfully.");
    setPwdModalVisible(false);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    onChangePassword?.();
  };

  return (
    <AdminPageFrame
      eyebrow="SUPER ADMIN / SECURITY & AUTH"
      title="Admin Security"
      subtitle="Master credentials, active session security, 2FA and audit controls."
    >
      {/* ── 1. Master Admin Identity Card ── */}
      <View style={sec.heroCard}>
        <View style={sec.heroTop}>
          <View style={sec.heroAvatar}>
            <Ionicons name="shield-checkmark" size={26} color="#FFD60A" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={sec.roleTag}>
              <View style={sec.roleDot} />
              <Text style={sec.roleText}>ROOT SUPER ADMIN · HIGHEST CLEARANCE</Text>
            </View>
            <Text style={sec.adminName}>Super Admin Master</Text>
            <Text style={sec.adminSub}>+91 98267 51348 · superadmin@bustracker.app</Text>
          </View>
        </View>

        <View style={sec.heroDivider} />

        <View style={sec.heroMetaRow}>
          <View style={sec.metaItem}>
            <Text style={sec.metaLabel}>ACTIVE SESSION</Text>
            <Text style={sec.metaVal}>Mobile Android (ID: #SA-9902)</Text>
          </View>
          <View style={sec.metaItem}>
            <Text style={sec.metaLabel}>LAST LOGIN</Text>
            <Text style={sec.metaVal}>Today, 09:14 AM (IP 192.168.1.10)</Text>
          </View>
        </View>
      </View>

      {/* ── 2. Security & Authentication Controls (Enclosed Box) ── */}
      <View style={sec.card}>
        <View style={sec.cardHeader}>
          <View style={[sec.headerIcon, { backgroundColor: "#EEF2FF" }]}>
            <Ionicons name="key" size={17} color={COLORS.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sec.cardTitle}>Credentials & Access Protection</Text>
            <Text style={sec.cardSubtitle}>Configure master password and multi-factor auth</Text>
          </View>
        </View>

        {/* Change Password Row */}
        <Pressable
          onPress={() => setPwdModalVisible(true)}
          style={({ pressed }) => [sec.settingItem, pressed && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={[sec.itemIcon, { backgroundColor: "#FFF8DB" }]}>
            <Ionicons name="lock-closed" size={16} color={COLORS.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sec.itemTitle}>Change Master Password</Text>
            <Text style={sec.itemSub}>Update the local encryption & portal password</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.faint} />
        </Pressable>

        {/* 2FA Toggle Row */}
        <Pressable
          onPress={() => setTwoFactorEnabled(!twoFactorEnabled)}
          style={({ pressed }) => [sec.settingItem, pressed && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={[sec.itemIcon, { backgroundColor: "#ECFDF3" }]}>
            <Ionicons name="phone-portrait" size={16} color={COLORS.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sec.itemTitle}>Two-Factor Authentication (OTP)</Text>
            <Text style={sec.itemSub}>Requires SMS OTP on login for +91 98267 51348</Text>
          </View>
          <View style={[sec.togglePill, { backgroundColor: twoFactorEnabled ? "#ECFDF3" : "#F2F4F7" }]}>
            <Text style={[sec.toggleText, { color: twoFactorEnabled ? COLORS.green : COLORS.muted }]}>
              {twoFactorEnabled ? "ENABLED" : "DISABLED"}
            </Text>
          </View>
        </Pressable>

        {/* Biometric Toggle Row */}
        <Pressable
          onPress={() => setBiometricEnabled(!biometricEnabled)}
          style={({ pressed }) => [sec.settingItem, pressed && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={[sec.itemIcon, { backgroundColor: "#F5E6FF" }]}>
            <Ionicons name="finger-print" size={16} color={COLORS.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sec.itemTitle}>Biometric Fingerprint / FaceID</Text>
            <Text style={sec.itemSub}>Instant biometric unlock on trusted hardware</Text>
          </View>
          <View style={[sec.togglePill, { backgroundColor: biometricEnabled ? "#ECFDF3" : "#F2F4F7" }]}>
            <Text style={[sec.toggleText, { color: biometricEnabled ? COLORS.green : COLORS.muted }]}>
              {biometricEnabled ? "ENABLED" : "DISABLED"}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ── 3. Session & Danger Zone (Enclosed Box) ── */}
      <View style={sec.card}>
        <View style={sec.cardHeader}>
          <View style={[sec.headerIcon, { backgroundColor: "#FFF1F2" }]}>
            <Ionicons name="alert-circle" size={17} color={COLORS.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sec.cardTitle}>Session Security & Signout</Text>
            <Text style={sec.cardSubtitle}>Revoke tokens and sign out of control centre</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            Alert.alert("Revoke Sessions", "Are you sure you want to invalidate all other active tokens?", [
              { text: "Cancel", style: "cancel" },
              { text: "Revoke All", style: "destructive", onPress: () => Alert.alert("Success", "All other sessions terminated.") },
            ]);
          }}
          style={({ pressed }) => [sec.settingItem, pressed && { backgroundColor: "#F8FAFC" }]}
        >
          <View style={[sec.itemIcon, { backgroundColor: "#FFF7ED" }]}>
            <Ionicons name="cloud-offline" size={16} color={COLORS.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sec.itemTitle}>Revoke Other Active Sessions</Text>
            <Text style={sec.itemSub}>Force sign-out on web portals and secondary tablets</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.faint} />
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert("Sign Out", "Are you sure you want to sign out of Super Admin control centre?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: onLogout },
            ]);
          }}
          style={({ pressed }) => [sec.settingItem, { borderTopWidth: 1, borderTopColor: "#FFF1F2" }, pressed && { backgroundColor: "#FFF1F2" }]}
        >
          <View style={[sec.itemIcon, { backgroundColor: "#FFF1F2" }]}>
            <Ionicons name="log-out" size={16} color={COLORS.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[sec.itemTitle, { color: COLORS.red }]}>Sign Out of Control Centre</Text>
            <Text style={sec.itemSub}>Exit secure Super Admin environment</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={COLORS.red} />
        </Pressable>
      </View>

      {/* ── Password Update Modal ── */}
      <Modal visible={pwdModalVisible} transparent animationType="slide" onRequestClose={() => setPwdModalVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>AUTHENTICATION</Text>
                <Text style={styles.sheetTitle}>Change Master Password</Text>
              </View>
              <Pressable onPress={() => setPwdModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.faint} />
              </Pressable>
            </View>

            <Text style={sec.inputLabel}>Current Password</Text>
            <TextInput
              secureTextEntry
              value={currentPwd}
              onChangeText={setCurrentPwd}
              placeholder="Enter current password"
              placeholderTextColor="#98A2B3"
              style={sec.modalInput}
            />

            <Text style={sec.inputLabel}>New Password</Text>
            <TextInput
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="Enter new strong password"
              placeholderTextColor="#98A2B3"
              style={sec.modalInput}
            />

            <Text style={sec.inputLabel}>Confirm New Password</Text>
            <TextInput
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              placeholder="Re-enter new password"
              placeholderTextColor="#98A2B3"
              style={sec.modalInput}
            />

            <Pressable onPress={handlePasswordSave} style={styles.primarySheetAction}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.ink} />
              <Text style={styles.actionText}>Save New Password</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AdminPageFrame>
  );
}

const sec = StyleSheet.create({
  heroCard: {
    borderRadius: 20,
    backgroundColor: "#172554",
    padding: 16,
    marginBottom: 12,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  roleDot: { width: 5, height: 5, borderRadius: 99, backgroundColor: "#55E38B" },
  roleText: { color: "#B6F6CC", fontFamily: FONT.bold, fontSize: 8, letterSpacing: 0.6 },
  adminName: { color: "#FFFFFF", fontFamily: FONT.display, fontSize: 16, marginTop: 4 },
  adminSub: { color: "#C7D2FE", fontFamily: FONT.regular, fontSize: 10, marginTop: 2 },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginVertical: 12 },
  heroMetaRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  metaItem: { flex: 1 },
  metaLabel: { color: "#93C5FD", fontFamily: FONT.bold, fontSize: 8.5, letterSpacing: 0.6 },
  metaVal: { color: "#FFFFFF", fontFamily: FONT.semibold, fontSize: 10, marginTop: 2 },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 18,
    padding: 13,
    marginBottom: 12,
    shadowColor: "#172554",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  headerIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "#101828", fontFamily: FONT.display, fontSize: 13.5 },
  cardSubtitle: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 1 },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  itemIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  itemTitle: { color: "#101828", fontFamily: FONT.semibold, fontSize: 12 },
  itemSub: { color: "#667085", fontFamily: FONT.regular, fontSize: 10, marginTop: 2 },
  togglePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  toggleText: { fontFamily: FONT.bold, fontSize: 8.5, letterSpacing: 0.4 },

  inputLabel: { color: "#475467", fontFamily: FONT.bold, fontSize: 9.5, marginTop: 8, marginBottom: 4 },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 12,
    color: "#101828",
    fontFamily: FONT.regular,
  },
});
