/* ============================================================================
   PARENT PORTAL — SUBSCRIPTION (7-day free trial → paid plans)
   Copy to: src/components/parentsdashbaord/pages/subscriptionparents.tsx
   ========================================================================== */

import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    Chip, FONT, PLANS, PageHeader, Press, VIDEOS, VideoHero,
    ms, useSubscription, useTheme,
} from "../common";

export default function SubscriptionParentsPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const { INK, MUTED, FAINT, BORDER, CARD_BG, PAGE_BG, ACCENT, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, BLUE, BLUE_SOFT, RED, RED_SOFT, isDark } = useTheme();
    const sub = useSubscription();
    const [selected, setSelected] = useState("quarterly");
    const [paymentMethod, setPaymentMethod] = useState<"googlePay" | "upi">("googlePay");
    const [processing, setProcessing] = useState(false);
    const [paymentReference, setPaymentReference] = useState<string | null>(null);

    const buy = () => {
        if (processing) return;
        setProcessing(true);
        setPaymentReference(null);

        // Frontend-only checkout simulation. Replace this timer with the real
        // provider flow after a payment backend is available.
        setTimeout(() => {
            const ref = `${paymentMethod === "googlePay" ? "GPAY" : "UPI"}-${Date.now().toString().slice(-8)}`;
            sub.buyPlan(selected);
            setPaymentReference(ref);
            setProcessing(false);
            Alert.alert("Subscription Activated", "Your selected plan is now active and live tracking is unlocked.", [{ text: "Great!" }]);
        }, 900);
    };

    const statusChip =
        sub.status === "active"
            ? { text: `${sub.planName} Active`, color: GREEN, soft: GREEN_SOFT }
            : sub.status === "trial"
                ? { text: `Trial · ${sub.trialDaysLeft}d left`, color: ACCENT_DEEP, soft: ACCENT_SOFT }
                : { text: "Expired", color: RED, soft: RED_SOFT };

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader
                title="Subscription"
                subtitle="Unlock live tracking for your child"
                onBack={onBack}
                topInset={insets.top}
                right={<Chip text={statusChip.text} color={statusChip.color} soft={statusChip.soft} />}
            />

            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(110) }} showsVerticalScrollIndicator={false}>
                {/* Video hero with overlay text */}
                <VideoHero
                    source={VIDEOS.family}
                    height={165}
                    title="Peace of Mind, Every Trip"
                    subtitle="Know exactly where your child's bus is — from pickup to drop."
                />

                {/* Trial banner */}
                {sub.status === "trial" ? (
                    <View style={{ marginTop: ms(12), flexDirection: "row", alignItems: "center", gap: ms(10), backgroundColor: ACCENT_SOFT, borderWidth: 1, borderColor: "rgba(185,151,0,0.25)", borderRadius: ms(16), padding: ms(13) }}>
                        <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="gift" size={ms(18)} color="#111827" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: INK }}>7-Day Free Trial Active</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 1 }}>
                                {sub.trialDaysLeft} days remaining — subscribe now so tracking never stops.
                            </Text>
                        </View>
                    </View>
                ) : sub.status === "expired" ? (
                    <View style={{ marginTop: ms(12), flexDirection: "row", alignItems: "center", gap: ms(10), backgroundColor: RED_SOFT, borderWidth: 1, borderColor: "rgba(220,38,38,0.25)", borderRadius: ms(16), padding: ms(13) }}>
                        <Ionicons name="lock-closed" size={ms(20)} color={RED} />
                        <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>
                            Your free trial has ended. Choose a plan below to restore live tracking.
                        </Text>
                    </View>
                ) : (
                    <View style={{ marginTop: ms(12), flexDirection: "row", alignItems: "center", gap: ms(10), backgroundColor: GREEN_SOFT, borderWidth: 1, borderColor: "rgba(22,163,74,0.25)", borderRadius: ms(16), padding: ms(13) }}>
                        <Ionicons name="shield-checkmark" size={ms(20)} color={GREEN} />
                        <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>
                            {sub.planName} plan is active. Thank you for subscribing!
                        </Text>
                    </View>
                )}

                {/* Plans */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: ms(18), marginBottom: ms(10) }}>Choose Your Plan</Text>
                <View style={{ gap: ms(10) }}>
                    {PLANS.map((p) => {
                        const active = selected === p.id;
                        return (
                            <Press key={p.id} onPress={() => setSelected(p.id)} style={{
                                backgroundColor: CARD_BG,
                                borderRadius: ms(20),
                                borderWidth: 2,
                                borderColor: active ? ACCENT : BORDER,
                                padding: ms(14),
                            }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                                    <View style={{
                                        width: ms(22), height: ms(22), borderRadius: 99, borderWidth: 2,
                                        borderColor: active ? ACCENT_DEEP : FAINT, alignItems: "center", justifyContent: "center",
                                        backgroundColor: active ? ACCENT : "transparent",
                                    }}>
                                        {active ? <Ionicons name="checkmark" size={ms(13)} color="#111827" /> : null}
                                    </View>
                                    <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: ms(15), color: INK }}>{p.name}</Text>
                                    {p.popular ? <Chip text="Most Popular" color={ACCENT_DEEP} soft={ACCENT_SOFT} /> : null}
                                    {p.save ? <Chip text={p.save} color={GREEN} soft={GREEN_SOFT} /> : null}
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, marginTop: ms(8), marginLeft: ms(32) }}>
                                    <Text style={{ fontWeight: "800", fontSize: ms(19), color: INK, marginBottom: 2 }}>{"\u20B9"}</Text>
                                    <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(24), color: INK, letterSpacing: -0.5 }}>{p.price.replace("\u20B9", "")}</Text>
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED, marginBottom: 3 }}>{p.per}</Text>
                                </View>
                                <View style={{ marginTop: ms(8), marginLeft: ms(32), gap: ms(6) }}>
                                    {p.features.map((f) => (
                                        <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: ms(8) }}>
                                            <Ionicons name="checkmark-circle" size={ms(14)} color={GREEN} />
                                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED }}>{f}</Text>
                                        </View>
                                    ))}
                                </View>
                            </Press>
                        );
                    })}
                </View>

                {/* Payment method */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: ms(20), marginBottom: ms(10) }}>
                    Choose Payment Method
                </Text>
                <View style={{ gap: ms(9) }}>
                    {([
                        { id: "googlePay" as const, title: "Google Pay", subtitle: "Fast checkout with your saved payment method", icon: "logo-google" as const, color: "#4285F4", soft: "#EAF2FF" },
                        { id: "upi" as const, title: "UPI", subtitle: "Pay with any UPI app", icon: "flash" as const, color: ACCENT_DEEP, soft: ACCENT_SOFT },
                    ]).map((method) => {
                        const active = paymentMethod === method.id;
                        return (
                            <Press key={method.id} onPress={() => setPaymentMethod(method.id)} style={{
                                flexDirection: "row", alignItems: "center", gap: ms(11), padding: ms(13),
                                borderRadius: ms(17), borderWidth: 1.5, borderColor: active ? method.color : BORDER,
                                backgroundColor: active ? method.soft : CARD_BG,
                            }}>
                                <View style={{ width: ms(40), height: ms(40), borderRadius: ms(13), backgroundColor: active ? method.color : method.soft, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name={method.icon} size={ms(19)} color={active ? "#FFFFFF" : method.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: INK }}>{method.title}</Text>
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED, marginTop: 2 }}>{method.subtitle}</Text>
                                </View>
                                <View style={{ width: ms(21), height: ms(21), borderRadius: 99, borderWidth: 2, borderColor: active ? method.color : FAINT, alignItems: "center", justifyContent: "center" }}>
                                    {active ? <View style={{ width: ms(11), height: ms(11), borderRadius: 99, backgroundColor: method.color }} /> : null}
                                </View>
                            </Press>
                        );
                    })}
                </View>

                {paymentReference ? (
                    <View style={{ marginTop: ms(12), flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(13), borderRadius: ms(16), backgroundColor: GREEN_SOFT, borderWidth: 1, borderColor: "rgba(22,163,74,0.25)" }}>
                        <Ionicons name="checkmark-circle" size={ms(22)} color={GREEN} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.display, fontSize: ms(12.5), color: INK }}>Payment completed</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED, marginTop: 2 }}>Reference: {paymentReference}</Text>
                        </View>
                    </View>
                ) : null}

                {/* Buy button */}
                <Press onPress={buy} disabled={processing} style={{
                    marginTop: ms(16), flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: ms(8), backgroundColor: processing ? "#E5E7EB" : ACCENT, borderRadius: ms(18), paddingVertical: ms(15),
                }}>
                    {processing ? <ActivityIndicator size="small" color={INK} /> : <Ionicons name={paymentMethod === "googlePay" ? "logo-google" : "flash"} size={ms(18)} color="#111827" />}
                    <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: "#111827" }}>
                        {processing ? "Preparing secure checkout..." : sub.status === "active" ? "Change Plan" : `Continue with ${paymentMethod === "googlePay" ? "Google Pay" : "UPI"}`}
                    </Text>
                </Press>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: FAINT, textAlign: "center", marginTop: ms(10) }}>
                    Secure payment · Cancel anytime · Instant activation
                </Text>

            </ScrollView>
        </View>
    );
}
