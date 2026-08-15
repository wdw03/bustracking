import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminPageFrame, SchoolFilterBar, StatusBadge, styles, COLORS, FONT } from "./pagekit";
import { SCHOOL_NAMES, parents, drivers, students, schools } from "./mockData";

type RecipientRole = "Everyone" | "Parents" | "Students" | "Drivers" | "Schools" | "Single Person";
type PriorityType = "Announcement" | "Urgent Alert" | "Bus Delay" | "Fee Reminder" | "Route Change";

type PersonRecord = {
  id: string;
  name: string;
  role: "Parent" | "Driver" | "Student" | "Admin";
  school: string;
  sub: string;
  phone?: string;
};

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipientRole, setRecipientRole] = useState<RecipientRole>("Parents");
  const [priority, setPriority] = useState<PriorityType>("Announcement");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const [selectedPerson, setSelectedPerson] = useState<PersonRecord | null>(null);

  // User search modal state
  const [userPickerVisible, setUserPickerVisible] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Channel toggles
  const [sendPush, setSendPush] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [sendSms, setSendSms] = useState(false);

  // History state
  const [historyFilter, setHistoryFilter] = useState("All");
  const [sentHistory, setSentHistory] = useState<
    Array<{
      id: string;
      title: string;
      body: string;
      school: string;
      target: string;
      priority: PriorityType;
      time: string;
      channels: string;
      reachCount: number;
    }>
  >([
    {
      id: "NOTIF-101",
      title: "Weather Advisory — 15 Min Bus Delay",
      body: "Due to heavy rainfall in Delhi NCR, morning pickup will be delayed by 15-20 minutes. Please track buses via live GPS.",
      school: "All Schools",
      target: "Parents & Drivers",
      priority: "Bus Delay",
      time: "Today, 07:15 AM",
      channels: "Push + In-App",
      reachCount: 2890,
    },
    {
      id: "NOTIF-102",
      title: "Monthly Transportation Fee Reminder",
      body: "Gentle reminder to renew August bus subscription before 20th August to avoid service interruption.",
      school: "St. Xavier's Academy",
      target: "Parents",
      priority: "Fee Reminder",
      time: "Yesterday, 04:30 PM",
      channels: "Push + In-App + SMS",
      reachCount: 466,
    },
    {
      id: "NOTIF-103",
      title: "Document Verification Required",
      body: "Please upload your updated commercial driving license and police clearance certificate.",
      school: "Bluebells Public School",
      target: "Vikram Yadav (Driver · Bus 101)",
      priority: "Urgent Alert",
      time: "13 Aug 2026, 11:20 AM",
      channels: "Direct 1:1 Push + SMS",
      reachCount: 1,
    },
  ]);

  // Combined searchable individuals list
  const allIndividuals: PersonRecord[] = useMemo(() => {
    const list: PersonRecord[] = [];
    parents.forEach((p) => {
      const parts = p.subtitle.split(" · ");
      list.push({
        id: p.id,
        name: p.title,
        role: "Parent",
        school: parts[0] || "School",
        sub: `Parent of ${parts[1] || "Student"} · ${p.fields?.[0] || ""}`,
      });
    });
    drivers.forEach((d) => {
      const parts = d.subtitle.split(" · ");
      list.push({
        id: d.id,
        name: d.title,
        role: "Driver",
        school: parts[0] || "School",
        sub: `${parts[1] || "Bus"} · ${d.fields?.[0] || ""}`,
      });
    });
    students.forEach((s) => {
      const parts = s.subtitle.split(" · ");
      list.push({
        id: s.id,
        name: s.title,
        role: "Student",
        school: parts[0] || "School",
        sub: `${parts[1] || "Class"} · ${s.fields?.[0] || ""}`,
      });
    });
    schools.forEach((sc) => {
      list.push({
        id: sc.id,
        name: `${sc.subtitle.split(" · ")[0]} (Admin)`,
        role: "Admin",
        school: sc.title,
        sub: `School Transport Head · ${sc.title}`,
      });
    });
    return list;
  }, []);

  const filteredIndividuals = useMemo(() => {
    return allIndividuals.filter((item) => {
      const matchesSchool = schoolFilter === "All Schools" || item.school.toLowerCase().includes(schoolFilter.toLowerCase());
      const matchesSearch =
        !userSearch ||
        `${item.name} ${item.role} ${item.school} ${item.id}`.toLowerCase().includes(userSearch.toLowerCase());
      return matchesSchool && matchesSearch;
    });
  }, [allIndividuals, schoolFilter, userSearch]);

  // Calculate estimated audience reach count
  const estimatedReach = useMemo(() => {
    if (recipientRole === "Single Person") return selectedPerson ? 1 : 0;
    let base = 0;
    if (schoolFilter === "All Schools") {
      if (recipientRole === "Everyone") base = 3120;
      else if (recipientRole === "Parents") base = 2176;
      else if (recipientRole === "Students") base = 1894;
      else if (recipientRole === "Drivers") base = 32;
      else if (recipientRole === "Schools") base = 4;
    } else if (schoolFilter === "Bluebells Public School") {
      if (recipientRole === "Everyone") base = 1570;
      else if (recipientRole === "Parents") base = 714;
      else if (recipientRole === "Students") base = 842;
      else if (recipientRole === "Drivers") base = 14;
      else if (recipientRole === "Schools") base = 1;
    } else if (schoolFilter === "St. Xavier's Academy") {
      if (recipientRole === "Everyone") base = 985;
      else if (recipientRole === "Parents") base = 466;
      else if (recipientRole === "Students") base = 510;
      else if (recipientRole === "Drivers") base = 9;
      else if (recipientRole === "Schools") base = 1;
    } else if (schoolFilter === "Green Valley School") {
      if (recipientRole === "Everyone") base = 338;
      else if (recipientRole === "Parents") base = 250;
      else if (recipientRole === "Students") base = 328;
      else if (recipientRole === "Drivers") base = 6;
      else if (recipientRole === "Schools") base = 1;
    } else {
      base = 190;
    }
    return base;
  }, [recipientRole, schoolFilter, selectedPerson]);

  const handleSend = () => {
    if (!message.trim()) return;

    const targetDesc =
      recipientRole === "Single Person"
        ? `${selectedPerson?.name ?? "Individual User"} (${selectedPerson?.role} · ${selectedPerson?.school})`
        : `${recipientRole} of ${schoolFilter === "All Schools" ? "All Affiliated Schools" : schoolFilter}`;

    const channelsText = [
      sendPush ? "Push" : "",
      sendInApp ? "In-App" : "",
      sendSms ? "SMS" : "",
    ]
      .filter(Boolean)
      .join(" + ");

    const newNotif = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      title: title.trim() || `${priority}: Broadcast`,
      body: message.trim(),
      school: schoolFilter,
      target: targetDesc,
      priority,
      time: "Just now",
      channels: channelsText || "Push",
      reachCount: estimatedReach,
    };

    setSentHistory((prev) => [newNotif, ...prev]);
    setMessage("");
    setTitle("");
  };

  return (
    <AdminPageFrame
      eyebrow="SUPER ADMIN / BROADCAST CENTRE"
      title="Notifications & Alerts"
      subtitle="Send targeted broadcasts or 1-on-1 direct messages to parents, students, drivers and admins."
    >
      {/* ── 1. School Filter Bar ── */}
      <SchoolFilterBar
        schools={SCHOOL_NAMES}
        selected={schoolFilter}
        onSelect={setSchoolFilter}
      />

      {/* ── 2. Notification Compose Card (Enclosed Box) ── */}
      <View style={notif.card}>
        <View style={notif.cardHeader}>
          <View style={[notif.headerIcon, { backgroundColor: "#EEF2FF" }]}>
            <Ionicons name="megaphone" size={17} color={COLORS.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={notif.cardTitle}>Compose Targeted Broadcast</Text>
            <Text style={notif.cardSubtitle}>Configure audience, priority and channels</Text>
          </View>
        </View>

        {/* ── Audience Role Selector ── */}
        <Text style={notif.label}>1. SELECT AUDIENCE ROLE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={notif.roleScroll}>
          {(["Everyone", "Parents", "Students", "Drivers", "Schools", "Single Person"] as RecipientRole[]).map((role) => {
            const active = recipientRole === role;
            const iconName: keyof typeof Ionicons.glyphMap =
              role === "Everyone"
                ? "people"
                : role === "Parents"
                ? "person"
                : role === "Students"
                ? "school"
                : role === "Drivers"
                ? "bus"
                : role === "Schools"
                ? "business"
                : "person-circle";

            return (
              <Pressable
                key={role}
                onPress={() => setRecipientRole(role)}
                style={[notif.rolePill, active && notif.rolePillActive]}
              >
                <Ionicons name={iconName} size={14} color={active ? "#FFD60A" : COLORS.muted} />
                <Text style={[notif.roleText, active && notif.roleTextActive]}>{role}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Single Person Selector Button (when 1:1 is chosen) ── */}
        {recipientRole === "Single Person" ? (
          <View style={notif.personBox}>
            {selectedPerson ? (
              <View style={notif.personRow}>
                <View style={notif.personAvatar}>
                  <Ionicons name="person" size={16} color={COLORS.blue} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={notif.personName} numberOfLines={1}>
                    {selectedPerson.name}
                  </Text>
                  <Text style={notif.personSub} numberOfLines={1}>
                    {selectedPerson.role} · {selectedPerson.school} · {selectedPerson.id}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedPerson(null)} style={notif.personClear}>
                  <Ionicons name="close-circle" size={20} color={COLORS.red} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setUserPickerVisible(true)}
                style={({ pressed }) => [notif.pickUserBtn, pressed && { opacity: 0.8 }]}
              >
                <Ionicons name="search" size={16} color={COLORS.blue} />
                <Text style={notif.pickUserText}>Tap to search & select parent, student or driver</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.navy} />
              </Pressable>
            )}
          </View>
        ) : null}

        {/* ── Priority Category Selector ── */}
        <Text style={notif.label}>2. ALERT CATEGORY & PRIORITY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={notif.roleScroll}>
          {(["Announcement", "Urgent Alert", "Bus Delay", "Fee Reminder", "Route Change"] as PriorityType[]).map((p) => {
            const active = priority === p;
            const badgeColor =
              p === "Urgent Alert"
                ? COLORS.red
                : p === "Bus Delay"
                ? COLORS.orange
                : p === "Fee Reminder"
                ? COLORS.purple
                : p === "Route Change"
                ? COLORS.cyan
                : COLORS.blue;

            return (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  notif.priorityPill,
                  active && { backgroundColor: `${badgeColor}18`, borderColor: badgeColor },
                ]}
              >
                <View style={[notif.priorityDot, { backgroundColor: badgeColor }]} />
                <Text style={[notif.priorityText, active && { color: badgeColor, fontFamily: FONT.bold }]}>
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Notification Title ── */}
        <Text style={notif.label}>3. NOTIFICATION TITLE</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Bus 101 Morning Shift Delay Notice"
          placeholderTextColor="#98A2B3"
          style={notif.input}
        />

        {/* ── Message Body ── */}
        <Text style={notif.label}>4. MESSAGE CONTENT</Text>
        <TextInput
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder="Write your announcement, instructions, emergency alert or notification details here..."
          placeholderTextColor="#98A2B3"
          style={notif.textarea}
        />

        {/* ── Delivery Channels ── */}
        <Text style={notif.label}>5. DELIVERY CHANNELS</Text>
        <View style={notif.channelsRow}>
          <Pressable onPress={() => setSendPush(!sendPush)} style={[notif.channelPill, sendPush && notif.channelPillActive]}>
            <Ionicons name={sendPush ? "checkbox" : "square-outline"} size={16} color={sendPush ? COLORS.navy : COLORS.muted} />
            <Text style={[notif.channelText, sendPush && notif.channelTextActive]}>Push Notification</Text>
          </Pressable>
          <Pressable onPress={() => setSendInApp(!sendInApp)} style={[notif.channelPill, sendInApp && notif.channelPillActive]}>
            <Ionicons name={sendInApp ? "checkbox" : "square-outline"} size={16} color={sendInApp ? COLORS.navy : COLORS.muted} />
            <Text style={[notif.channelText, sendInApp && notif.channelTextActive]}>In-App Banner</Text>
          </Pressable>
          <Pressable onPress={() => setSendSms(!sendSms)} style={[notif.channelPill, sendSms && notif.channelPillActive]}>
            <Ionicons name={sendSms ? "checkbox" : "square-outline"} size={16} color={sendSms ? COLORS.navy : COLORS.muted} />
            <Text style={[notif.channelText, sendSms && notif.channelTextActive]}>Direct SMS</Text>
          </Pressable>
        </View>

        {/* ── Audience Reach Summary Box ── */}
        <View style={notif.reachBox}>
          <View style={notif.reachTop}>
            <Ionicons name="radio" size={16} color={COLORS.green} />
            <Text style={notif.reachTitle}>ESTIMATED TARGET REACH</Text>
          </View>
          <Text style={notif.reachCount}>
            {recipientRole === "Single Person"
              ? selectedPerson
                ? `1 User · ${selectedPerson.name} (${selectedPerson.role})`
                : "0 Users (Select a recipient)"
              : `~${estimatedReach.toLocaleString()} Recipients`}
          </Text>
          <Text style={notif.reachSub}>
            School: {schoolFilter} · Audience: {recipientRole} · Priority: {priority}
          </Text>
        </View>

        {/* ── Send Broadcast Button ── */}
        <Pressable
          onPress={handleSend}
          disabled={!message.trim() || (recipientRole === "Single Person" && !selectedPerson)}
          style={({ pressed }) => [
            notif.sendBtn,
            (!message.trim() || (recipientRole === "Single Person" && !selectedPerson)) && { opacity: 0.5 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="send" size={16} color="#FFFFFF" />
          <Text style={notif.sendBtnText}>
            {recipientRole === "Single Person" ? "Send Direct Message" : "Dispatch Broadcast Alert"}
          </Text>
        </Pressable>
      </View>

      {/* ── 3. Broadcast History (Enclosed Card) ── */}
      <View style={notif.card}>
        <View style={notif.cardHeader}>
          <View style={[notif.headerIcon, { backgroundColor: "#ECFDF3" }]}>
            <Ionicons name="time" size={17} color={COLORS.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={notif.cardTitle}>Broadcast History</Text>
            <Text style={notif.cardSubtitle}>{sentHistory.length} notifications dispatched</Text>
          </View>
        </View>

        {sentHistory.map((item, idx) => (
          <View key={item.id} style={[notif.historyRow, idx > 0 && notif.historyBorder]}>
            <View style={notif.historyTop}>
              <View style={notif.historyBadgeWrap}>
                <View
                  style={[
                    notif.priorityDot,
                    {
                      backgroundColor:
                        item.priority === "Urgent Alert"
                          ? COLORS.red
                          : item.priority === "Bus Delay"
                          ? COLORS.orange
                          : COLORS.blue,
                    },
                  ]}
                />
                <Text style={notif.historyPriority}>{item.priority}</Text>
              </View>
              <Text style={notif.historyTime}>{item.time}</Text>
            </View>

            <Text style={notif.historyTitle}>{item.title}</Text>
            <Text style={notif.historyBody}>{item.body}</Text>

            <View style={notif.historyMetaRow}>
              <View style={notif.metaPill}>
                <Ionicons name="people" size={11} color={COLORS.navy} />
                <Text style={notif.metaPillText}>{item.target}</Text>
              </View>
              <View style={notif.metaPill}>
                <Ionicons name="paper-plane" size={11} color={COLORS.green} />
                <Text style={notif.metaPillText}>{item.reachCount} devices</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* ── User Picker Modal (Searchable for 1:1 message) ── */}
      <Modal
        visible={userPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUserPickerVisible(false)}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>1-ON-1 DIRECT RECIPIENT</Text>
                <Text style={styles.sheetTitle}>Select Recipient</Text>
              </View>
              <Pressable onPress={() => setUserPickerVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.faint} />
              </Pressable>
            </View>

            {/* Modal Search Box */}
            <View style={[styles.search, { marginBottom: 10, minHeight: 40 }]}>
              <Ionicons name="search" size={15} color={COLORS.faint} />
              <TextInput
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Search name, role, school or ID..."
                placeholderTextColor={COLORS.faint}
                style={[styles.searchInput, { fontSize: 11.5 }]}
              />
              {userSearch ? (
                <Pressable onPress={() => setUserSearch("")}>
                  <Ionicons name="close-circle" size={15} color={COLORS.faint} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {filteredIndividuals.map((person, i) => (
                <Pressable
                  key={person.id}
                  onPress={() => {
                    setSelectedPerson(person);
                    setUserPickerVisible(false);
                  }}
                  style={({ pressed }) => [
                    notif.userPickerRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: "#F0F2F5" },
                    pressed && { backgroundColor: "#F8FAFC" },
                  ]}
                >
                  <View
                    style={[
                      notif.userPickerIcon,
                      {
                        backgroundColor:
                          person.role === "Parent"
                            ? "#EEF2FF"
                            : person.role === "Driver"
                            ? "#FFF7E6"
                            : person.role === "Student"
                            ? "#ECFDF3"
                            : "#F5E6FF",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        person.role === "Parent"
                          ? "person"
                          : person.role === "Driver"
                          ? "bus"
                          : person.role === "Student"
                          ? "school"
                          : "business"
                      }
                      size={16}
                      color={
                        person.role === "Parent"
                          ? COLORS.blue
                          : person.role === "Driver"
                          ? COLORS.orange
                          : person.role === "Student"
                          ? COLORS.green
                          : COLORS.purple
                      }
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={notif.userPickerName} numberOfLines={1}>
                        {person.name}
                      </Text>
                      <View style={notif.roleBadge}>
                        <Text style={notif.roleBadgeText}>{person.role}</Text>
                      </View>
                    </View>
                    <Text style={notif.userPickerSub} numberOfLines={1}>
                      {person.school} · {person.id}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={COLORS.faint} />
                </Pressable>
              ))}

              {filteredIndividuals.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <Text style={{ color: COLORS.muted, fontFamily: FONT.regular, fontSize: 11 }}>
                    No matching users found
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AdminPageFrame>
  );
}

const notif = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#172554",
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: "#101828", fontFamily: FONT.display, fontSize: 13.5 },
  cardSubtitle: { color: "#98A2B3", fontFamily: FONT.regular, fontSize: 9.5, marginTop: 1 },

  label: { color: "#475467", fontFamily: FONT.bold, fontSize: 9, letterSpacing: 0.6, marginTop: 10, marginBottom: 6 },
  roleScroll: { flexDirection: "row", gap: 7, paddingBottom: 4 },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  rolePillActive: { backgroundColor: "#172554", borderColor: "#172554" },
  roleText: { color: "#475467", fontFamily: FONT.semibold, fontSize: 11 },
  roleTextActive: { color: "#FFFFFF", fontFamily: FONT.bold },

  priorityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  priorityDot: { width: 6, height: 6, borderRadius: 99 },
  priorityText: { color: "#475467", fontFamily: FONT.semibold, fontSize: 10.5 },

  // Single person box
  personBox: { marginTop: 8, marginBottom: 2 },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 12,
    padding: 9,
  },
  personAvatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  personName: { color: COLORS.navy, fontFamily: FONT.bold, fontSize: 12 },
  personSub: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 9.5, marginTop: 1 },
  personClear: { padding: 4 },
  pickUserBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.blue,
    borderRadius: 12,
    padding: 10,
  },
  pickUserText: { flex: 1, color: COLORS.blue, fontFamily: FONT.semibold, fontSize: 11 },

  // Inputs
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 12,
    color: "#101828",
    fontFamily: FONT.regular,
  },
  textarea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 12,
    color: "#101828",
    fontFamily: FONT.regular,
    minHeight: 74,
    textAlignVertical: "top",
  },

  // Channels
  channelsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  channelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  channelPillActive: { backgroundColor: "#EEF2FF", borderColor: "#C7D2FE" },
  channelText: { color: COLORS.muted, fontFamily: FONT.semibold, fontSize: 10.5 },
  channelTextActive: { color: COLORS.navy, fontFamily: FONT.bold },

  // Reach Box
  reachBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 12,
    padding: 11,
    marginTop: 12,
  },
  reachTop: { flexDirection: "row", alignItems: "center", gap: 5 },
  reachTitle: { color: COLORS.muted, fontFamily: FONT.bold, fontSize: 8.5, letterSpacing: 0.6 },
  reachCount: { color: "#101828", fontFamily: FONT.display, fontSize: 14, marginTop: 3 },
  reachSub: { color: COLORS.faint, fontFamily: FONT.regular, fontSize: 9.5, marginTop: 2 },

  // Send Button
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#172554",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  sendBtnText: { color: "#FFFFFF", fontFamily: FONT.bold, fontSize: 12.5 },

  // History
  historyRow: { paddingVertical: 10 },
  historyBorder: { borderTopWidth: 1, borderTopColor: "#F0F2F5" },
  historyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  historyBadgeWrap: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F2F4F7", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  historyPriority: { color: "#344054", fontFamily: FONT.bold, fontSize: 9 },
  historyTime: { color: COLORS.faint, fontFamily: FONT.regular, fontSize: 9.5 },
  historyTitle: { color: "#101828", fontFamily: FONT.bold, fontSize: 12 },
  historyBody: { color: "#667085", fontFamily: FONT.regular, fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  historyMetaRow: { flexDirection: "row", gap: 7, marginTop: 7 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E4E7EC", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  metaPillText: { color: "#344054", fontFamily: FONT.semibold, fontSize: 9 },

  // User Picker Modal Rows
  userPickerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9 },
  userPickerIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  userPickerName: { color: "#101828", fontFamily: FONT.bold, fontSize: 12 },
  roleBadge: { backgroundColor: "#F2F4F7", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  roleBadgeText: { color: "#475467", fontFamily: FONT.bold, fontSize: 8 },
  userPickerSub: { color: COLORS.muted, fontFamily: FONT.regular, fontSize: 9.5, marginTop: 2 },
});
