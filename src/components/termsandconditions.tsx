import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

/* ── Design Tokens ── */
const ACCENT = "#FFD60A";
const INK = "#101010";
const NAVY = "#172554";
const BLUE = "#2563EB";
const MUTED = "#64748B";
const FAINT = "#94A3B8";
const BORDER = "#E2E8F0";
const BG_PAGE = "#FFFFFF";

export type TermsModalProps = {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  initialTab?: "terms" | "privacy";
  showAcceptButtons?: boolean;
  accepted?: boolean;
};

export default function TermsAndConditionsModal({
  visible,
  onClose,
  onAccept,
  onDecline,
  initialTab = "terms",
  showAcceptButtons = true,
  accepted = false,
}: TermsModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);
  const [isChecked, setIsChecked] = useState(accepted);

  const handleAccept = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsChecked(true);
    onAccept?.();
    onClose();
  };

  const handleDecline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDecline?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <View style={styles.brandIconWrap}>
              <Ionicons name="shield-checkmark" size={20} color={NAVY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle}>BusTracker Legal & Privacy</Text>
              <Text style={styles.brandSub}>TrackIQ Child Safety & Data Governance</Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="close" size={22} color="#475467" />
          </Pressable>
        </View>

        {/* ── Tab Switcher (Terms vs Privacy) ── */}
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab("terms");
            }}
            style={[styles.tab, activeTab === "terms" && styles.tabActive]}
          >
            <Ionicons
              name="document-text-outline"
              size={16}
              color={activeTab === "terms" ? NAVY : MUTED}
            />
            <Text style={[styles.tabText, activeTab === "terms" && styles.tabTextActive]}>
              Terms of Service
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab("privacy");
            }}
            style={[styles.tab, activeTab === "privacy" && styles.tabActive]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={activeTab === "privacy" ? NAVY : MUTED}
            />
            <Text style={[styles.tabText, activeTab === "privacy" && styles.tabTextActive]}>
              Privacy & GPS Policy
            </Text>
          </Pressable>
        </View>

        {/* ── Scrollable Legal Document ── */}
        <ScrollView
          showsVerticalScrollIndicator
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === "terms" ? (
            <View style={styles.sectionWrap}>
              <View style={styles.badgeRow}>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionBadgeText}>VERSION 2.4 · EFFECTIVE AUG 2026</Text>
                </View>
              </View>

              <Text style={styles.docHeading}>Terms of Service</Text>
              <Text style={styles.leadPara}>
                Welcome to BusTracker (operated by TrackIQ Telematics Solutions). By downloading,
                accessing, or registering on this mobile application or portal, you agree to be bound
                by these terms and conditions.
              </Text>

              {/* Section 1 */}
              <View style={styles.clauseCard}>
                <View style={styles.clauseHeader}>
                  <Ionicons name="people" size={17} color={BLUE} />
                  <Text style={styles.clauseTitle}>1. User Roles & Account Responsibilities</Text>
                </View>
                <Text style={styles.clauseBody}>
                  • <Text style={styles.boldText}>Parents / Guardians:</Text> Authorized to track
                  assigned school buses for enrolled children, receive automated pickup/drop alerts,
                  and manage subscription renewals. You agree not to share your one-time passwords
                  (OTP) with unverified individuals.{"\n"}
                  • <Text style={styles.boldText}>Drivers:</Text> Must keep GPS location broadcast
                  active throughout designated morning and afternoon shifts. Drivers must adhere to
                  school safety speed limits (maximum 40 km/h in school zones).{"\n"}
                  • <Text style={styles.boldText}>School Administrators:</Text> Responsible for
                  verifying driver police clearances, maintaining bus fitness records, and managing
                  accurate route geofences.
                </Text>
              </View>

              {/* Section 2 */}
              <View style={styles.clauseCard}>
                <View style={styles.clauseHeader}>
                  <Ionicons name="navigate" size={17} color={BLUE} />
                  <Text style={styles.clauseTitle}>2. Real-Time GPS Tracking & Telemetry</Text>
                </View>
                <Text style={styles.clauseBody}>
                  BusTracker utilizes satellite GPS telemetry to estimate vehicle location and ETA.
                  While we strive for sub-second precision, ETA estimates may fluctuate due to
                  unforeseen road congestion, severe weather, or cellular network latency.
                </Text>
              </View>

              {/* Section 3 */}
              <View style={styles.clauseCard}>
                <View style={styles.clauseHeader}>
                  <Ionicons name="card" size={17} color={BLUE} />
                  <Text style={styles.clauseTitle}>3. Subscriptions, Payments & Refunds</Text>
                </View>
                <Text style={styles.clauseBody}>
                  Parent subscriptions (Monthly, Quarterly, or Annual) provide continuous access to
                  live map streaming and RFID notification services. Subscriptions renew automatically
                  via UPI/Card mandates unless cancelled prior to the billing cycle. Refund requests
                  are subject to school admin approval within 7 days of purchase.
                </Text>
              </View>

              {/* Section 4 */}
              <View style={styles.clauseCard}>
                <View style={styles.clauseHeader}>
                  <Ionicons name="alert-circle" size={17} color="#DC2626" />
                  <Text style={[styles.clauseTitle, { color: "#DC2626" }]}>
                    4. Emergency SOS & Incident Reporting
                  </Text>
                </View>
                <Text style={styles.clauseBody}>
                  The SOS panic trigger is reserved strictly for genuine transit emergencies. Misuse
                  or false distress triggering may result in immediate account suspension and review
                  by the respective school disciplinary board.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.sectionWrap}>
              <View style={styles.badgeRow}>
                <View style={[styles.versionBadge, { backgroundColor: "#ECFDF3", borderColor: "#A7F3D0" }]}>
                  <Text style={[styles.versionBadgeText, { color: "#16A34A" }]}>
                    DPDP ACT & CHILD SAFETY COMPLIANT
                  </Text>
                </View>
              </View>

              <Text style={styles.docHeading}>Privacy & GPS Policy</Text>
              <Text style={styles.leadPara}>
                We take student safety and data privacy with utmost priority. This policy describes
                how we collect, use, and safeguard personal and telemetry data.
              </Text>

              {/* Privacy 1 */}
              <View style={styles.clauseCard}>
                <View style={styles.clauseHeader}>
                  <Ionicons name="shield" size={17} color="#16A34A" />
                  <Text style={styles.clauseTitle}>1. Data We Collect</Text>
                </View>
                <Text style={styles.clauseBody}>
                  • <Text style={styles.boldText}>Student Identity:</Text> Student name, class,
                  section, roll number, and school admission ID.{"\n"}
                  • <Text style={styles.boldText}>Parent Details:</Text> Mobile number, residential
                  address for pickup/drop geofencing.{"\n"}
                  • <Text style={styles.boldText}>Driver Location:</Text> Real-time latitude,
                  longitude, vehicle speed, and bearing broadcast during active transit trips.
                </Text>
              </View>

              {/* Privacy 2 */}
              <View style={styles.clauseCard}>
                <View style={styles.clauseHeader}>
                  <Ionicons name="lock-closed" size={17} color="#16A34A" />
                  <Text style={styles.clauseTitle}>2. Strict Child Data Protection</Text>
                </View>
                <Text style={styles.clauseBody}>
                  Student transit records are strictly encrypted end-to-end and accessible ONLY to
                  verified parents and authorized school administrators. We NEVER sell, monetize, or
                  share child or student data with any third-party advertisers or external data brokers.
                </Text>
              </View>

              {/* Privacy 3 */}
              <View style={styles.clauseCard}>
                <View style={styles.clauseHeader}>
                  <Ionicons name="location" size={17} color="#16A34A" />
                  <Text style={styles.clauseTitle}>3. Location Tracking Scope</Text>
                </View>
                <Text style={styles.clauseBody}>
                  Driver GPS location is broadcast solely during authorized school transit routes.
                  Once the morning or afternoon route is completed and the driver closes the shift,
                  background location broadcasting is automatically halted.
                </Text>
              </View>

              {/* Privacy 4 */}
              <View style={styles.clauseCard}>
                <View style={styles.clauseHeader}>
                  <Ionicons name="mail" size={17} color="#16A34A" />
                  <Text style={styles.clauseTitle}>4. Grievance Officer & Contact</Text>
                </View>
                <Text style={styles.clauseBody}>
                  For any privacy inquiries, data deletion requests, or grievance redressal:{"\n"}
                  • Email: <Text style={styles.boldText}>grievance@bustracker.app</Text>{"\n"}
                  • Phone: <Text style={styles.boldText}>+91 98267 51348</Text>{"\n"}
                  • Physical Address: TrackIQ Telematics, Cyber Hub Sector 24, Gurugram, India.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Bottom Consent Bar & Action Buttons ── */}
        {showAcceptButtons ? (
          <View style={styles.footer}>
            {/* Interactive Checkbox */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setIsChecked(!isChecked);
              }}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                {isChecked ? <Ionicons name="checkmark" size={14} color={INK} /> : null}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read and agree to the{" "}
                <Text style={{ fontWeight: "700", color: INK }}>Terms of Service</Text> and{" "}
                <Text style={{ fontWeight: "700", color: INK }}>Privacy Policy</Text>.
              </Text>
            </Pressable>

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              {onDecline ? (
                <Pressable
                  onPress={handleDecline}
                  style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={handleAccept}
                disabled={!isChecked}
                style={({ pressed }) => [
                  styles.acceptBtn,
                  !isChecked && styles.acceptBtnDisabled,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="checkmark-circle" size={17} color={isChecked ? INK : FAINT} />
                <Text style={[styles.acceptText, !isChecked && styles.acceptTextDisabled]}>
                  Accept & Continue
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.acceptText}>Close Document</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_PAGE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBrand: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#FFF8DB",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: INK,
    fontFamily: "Sora-Bold",
    fontSize: 15,
  },
  brandSub: {
    color: MUTED,
    fontFamily: "Inter-Regular",
    fontSize: 10.5,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabActive: {
    backgroundColor: "#FFF8DB",
    borderColor: ACCENT,
  },
  tabText: {
    color: MUTED,
    fontFamily: "Inter-SemiBold",
    fontSize: 11.5,
  },
  tabTextActive: {
    color: INK,
    fontFamily: "Inter-Bold",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionWrap: {
    gap: 12,
  },
  badgeRow: {
    flexDirection: "row",
  },
  versionBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  versionBadgeText: {
    color: BLUE,
    fontFamily: "Inter-Bold",
    fontSize: 9,
    letterSpacing: 0.6,
  },
  docHeading: {
    color: INK,
    fontFamily: "Sora-Bold",
    fontSize: 20,
    marginTop: 4,
  },
  leadPara: {
    color: "#334155",
    fontFamily: "Inter-Regular",
    fontSize: 12,
    lineHeight: 18,
  },

  clauseCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  clauseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  clauseTitle: {
    color: INK,
    fontFamily: "Inter-Bold",
    fontSize: 12.5,
  },
  clauseBody: {
    color: "#475467",
    fontFamily: "Inter-Regular",
    fontSize: 11.5,
    lineHeight: 17,
  },
  boldText: {
    fontWeight: "700",
    color: INK,
  },

  footer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  checkboxLabel: {
    flex: 1,
    color: "#475467",
    fontFamily: "Inter-Regular",
    fontSize: 11.5,
    lineHeight: 16,
  },

  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  declineBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: {
    color: "#64748B",
    fontFamily: "Inter-Bold",
    fontSize: 12,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  acceptBtnDisabled: {
    backgroundColor: "#E2E8F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  acceptText: {
    color: INK,
    fontFamily: "Inter-Bold",
    fontSize: 13,
  },
  acceptTextDisabled: {
    color: FAINT,
  },
});
