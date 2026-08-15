import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminPageFrame, SchoolFilterBar, styles, COLORS, FONT } from "./pagekit";
import { SCHOOL_NAMES } from "./mockData";

export default function NotificationsPage() {
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("Everyone");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const [sent, setSent] = useState<Array<{ title: string; body: string; school: string; target: string; time: string }>>([
    { title: "Service Advisory", body: "Heavy rain in Delhi NCR. Expect 10-15 min bus delay.", school: "All Schools", target: "Everyone", time: "Today, 08:30 AM" },
    { title: "Route Update", body: "Bus 101 route updated for morning shift.", school: "Bluebells Public School", target: "Parents", time: "Yesterday, 07:15 PM" },
  ]);

  const sendNotification = () => {
    if (message.trim()) {
      setSent((items) => [
        {
          title: title.trim() || "Broadcast Alert",
          body: message.trim(),
          school: schoolFilter,
          target: recipient,
          time: "Just now",
        },
        ...items,
      ]);
      setMessage("");
      setTitle("");
    }
  };

  return (
    <AdminPageFrame
      title="Notifications & Alerts"
      subtitle="Send instant broadcast notifications to parents, drivers, and school admins."
    >
      {/* School filter selector */}
      <SchoolFilterBar
        schools={SCHOOL_NAMES}
        selected={schoolFilter}
        onSelect={setSchoolFilter}
      />

      <View style={styles.formCard}>
        <Text style={styles.formLabel}>Target Audience</Text>
        <View style={styles.recipientRow}>
          {["Everyone", "Parents", "Drivers", "Schools"].map((item) => {
            const active = item === recipient;
            return (
              <Pressable
                key={item}
                onPress={() => setRecipient(item)}
                style={[styles.recipient, active && { backgroundColor: COLORS.navy }]}
              >
                <Text style={[styles.recipientText, active && { color: "#FFFFFF", fontFamily: FONT.bold }]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.formLabel}>Notification Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Bus delay notice / Holiday alert"
          placeholderTextColor="#98A2B3"
          style={styles.formInput}
        />

        <Text style={styles.formLabel}>Message Body</Text>
        <TextInput
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder="Write your announcement or alert message here..."
          placeholderTextColor="#98A2B3"
          style={styles.formArea}
        />

        <Pressable onPress={sendNotification} style={[styles.action, { alignSelf: "flex-start", marginTop: 12 }]}>
          <Ionicons name="send" size={15} color={COLORS.ink} />
          <Text style={styles.actionText}>
            Broadcast to {schoolFilter === "All Schools" ? "All Schools" : schoolFilter}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Broadcast History ({sent.length})</Text>
      {sent.map((item, index) => (
        <View key={`${item.title}-${index}`} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.recordIcon, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="notifications" size={18} color={COLORS.blue} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>
                Target: {item.target} · {item.school} · {item.time}
              </Text>
            </View>
          </View>
          <Text style={styles.field}>{item.body}</Text>
        </View>
      ))}
    </AdminPageFrame>
  );
}
