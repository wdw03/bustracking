/* ============================================================================
   SUBSCRIPTION MANAGEMENT — School Admin
   Copy to: src/components/schooldashboard/pages/subscription.tsx
   Plan, usage, parent subscriptions, 20% commission earnings + withdraw
   (UPI / IMPS) — dummy UI.
   ========================================================================== */

import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    ACCENT, ACCENT_DEEP, ACCENT_SOFT, BLUE, BLUE_SOFT, BORDER, BUSES, CARD_BG, Card, Chip, FAINT, FONT, GREEN,
    GREEN_SOFT, INK, InfoRow, MUTED, ORANGE, ORANGE_SOFT, PAGE_BG, PageHeader, Press, PURPLE, PURPLE_SOFT,
    SCHOOL, STUDENTS, SectionTitle, ms,
} from "../common";

export default function SubscriptionPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const sub = SCHOOL.subscription;
    const [method, setMethod] = useState<"UPI" | "IMPS">("UPI");
    const [amount, setAmount] = useState("");

    const studentsUsed = STUDENTS.length * 87;
    const usagePct = Math.min(studentsUsed / sub.studentsAllowed, 1);
    const busPct = Math.min(BUSES.length / sub.busesAllowed, 1);

    const withdraw = () => {
        const amt = Number(amount);
        if (!amt || amt <= 0) return Alert.alert("Enter amount", "Please enter a valid withdrawal amount.");
        if (amt > sub.balance) return Alert.alert("Insufficient balance", `Available balance is ₹${sub.balance.toLocaleString("en-IN")}.`);
        Alert.alert("Withdrawal Requested", `₹${amt.toLocaleString("en-IN")} via ${method}.\n\nDemo UI only — connect payout backend.`, [{ text: "OK", onPress: () => setAmount("") }]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Subscription" subtitle="Plan, usage & earnings" onBack={onBack} topInset={insets.top}
                right={<Chip text={sub.status} color={GREEN} soft={GREEN_SOFT} />} />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                {/* Plan card */}
                <View style={{ backgroundColor: INK, borderRadius: ms(22), padding: ms(18), overflow: "hidden" }}>
                    <View style={{ position: "absolute", top: -ms(30), right: -ms(30), width: ms(120), height: ms(120), borderRadius: ms(60), backgroundColor: "rgba(255,213,0,0.15)" }} />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Ionicons name="diamond" size={ms(18)} color={ACCENT} />
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: "#FFFFFF" }}>{sub.plan}</Text>
                    </View>
                    <View style={{ flexDirection: "row", marginTop: ms(14), gap: ms(16) }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: "#9CA3AF" }}>Expiry Date</Text>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: "#FFFFFF" }}>{sub.expiry}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: "#9CA3AF" }}>Renewal Date</Text>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: "#FFFFFF" }}>{sub.renewal}</Text>
                        </View>
                    </View>
                </View>

                {/* Usage */}
                <SectionTitle icon="analytics" title="Current Usage" />
                <Card>
                    {[
                        { label: `Students · ${studentsUsed} / ${sub.studentsAllowed}`, pct: usagePct, color: ORANGE },
                        { label: `Buses · ${BUSES.length} / ${sub.busesAllowed}`, pct: busPct, color: BLUE },
                    ].map((u) => (
                        <View key={u.label} style={{ marginBottom: ms(12) }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK, marginBottom: 6 }}>{u.label}</Text>
                            <View style={{ height: ms(9), borderRadius: 999, backgroundColor: PAGE_BG, overflow: "hidden" }}>
                                <View style={{ width: `${u.pct * 100}%`, height: "100%", borderRadius: 999, backgroundColor: u.color }} />
                            </View>
                        </View>
                    ))}
                    <InfoRow icon="people" label="Parent Subscriptions Purchased" value={`${sub.parentSubs} active parent plans`} color={PURPLE} soft={PURPLE_SOFT} />
                </Card>

                {/* Earnings + withdraw */}
                <SectionTitle icon="wallet" title="Earnings (20% Commission)" />
                <Card>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                        <View style={{ width: ms(48), height: ms(48), borderRadius: ms(16), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="cash" size={ms(22)} color={GREEN} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>Available Balance</Text>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(24), color: INK }}>₹{sub.balance.toLocaleString("en-IN")}</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT }}>
                                {sub.commissionPct}% of every parent subscription goes to your school
                            </Text>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: BORDER, marginVertical: ms(14) }} />

                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK, marginBottom: 8 }}>Withdraw via</Text>
                    <View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(12) }}>
                        {(["UPI", "IMPS"] as const).map((m) => (
                            <Press key={m} onPress={() => setMethod(m)} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: ms(46), borderRadius: ms(15), backgroundColor: method === m ? ACCENT_SOFT : PAGE_BG, borderWidth: 1.5, borderColor: method === m ? ACCENT : BORDER }}>
                                <Ionicons name={m === "UPI" ? "flash" : "business"} size={ms(15)} color={method === m ? ACCENT_DEEP : MUTED} />
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: method === m ? INK : MUTED }}>{m}</Text>
                                {method === m ? <Ionicons name="checkmark-circle" size={ms(15)} color={ACCENT_DEEP} /> : null}
                            </Press>
                        ))}
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: PAGE_BG, borderRadius: ms(15), borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(50), gap: 8, marginBottom: ms(12) }}>
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: MUTED }}>₹</Text>
                        <TextInput value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder="Enter amount to withdraw" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(14.5), color: INK }} />
                    </View>

                    <Press onPress={withdraw} style={{ height: ms(52), borderRadius: ms(17), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
                        <Ionicons name="arrow-down-circle" size={ms(17)} color={INK} />
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(14.5), color: INK }}>Withdraw Balance</Text>
                    </Press>
                </Card>

                {/* Payment history */}
                <SectionTitle icon="receipt" title="Payment History" />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    {[
                        { id: "t1", text: "Withdrawal · UPI", amt: "-₹5,000", time: "28 Jan 2026", color: ORANGE, soft: ORANGE_SOFT, icon: "arrow-up-circle" as const },
                        { id: "t2", text: "Commission · 42 parent plans", amt: "+₹3,360", time: "15 Jan 2026", color: GREEN, soft: GREEN_SOFT, icon: "arrow-down-circle" as const },
                        { id: "t3", text: "Commission · 61 parent plans", amt: "+₹4,880", time: "01 Jan 2026", color: GREEN, soft: GREEN_SOFT, icon: "arrow-down-circle" as const },
                        { id: "t4", text: "Plan renewal · Premium Fleet", amt: "-₹11,999", time: "12 Dec 2025", color: BLUE, soft: BLUE_SOFT, icon: "diamond" as const },
                    ].map((t, i) => (
                        <View key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(12), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                            <View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: t.soft, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={t.icon} size={ms(16)} color={t.color} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>{t.text}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT }}>{t.time}</Text>
                            </View>
                            <Text style={{ fontFamily: FONT.display, fontSize: ms(13.5), color: t.amt.startsWith("+") ? GREEN : INK }}>{t.amt}</Text>
                        </View>
                    ))}
                </Card>
            </ScrollView>
        </View>
    );
}
