/* ============================================================================
   PARENT PORTAL — TRACKING PAYWALL (shown when subscription is expired)
   Copy to: src/components/parentsdashbaord/pages/trackinggate.tsx
   Shared by livetrackingparents.tsx (native) and livetrackingparents.web.tsx
   ========================================================================== */

import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { FONT, Press, VIDEOS, VideoHero, ms, useTheme } from "../common";

export default function TrackingGate({ onBuy }: { onBuy: () => void }) {
    const { INK, MUTED, BORDER, CARD_BG, PAGE_BG, ACCENT, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, RED, RED_SOFT } = useTheme();

    return (
        <ScrollView style={{ flex: 1, backgroundColor: PAGE_BG }} contentContainerStyle={{ padding: ms(16), paddingBottom: ms(110) }} showsVerticalScrollIndicator={false}>
            {/* Locked video hero with overlay text */}
            <VideoHero
                source={VIDEOS.locked}
                height={210}
                title="Live Tracking is Locked"
                subtitle="You need to buy a subscription first to see your child's bus."
            />

            {/* Locked message card */}
            <View style={{ marginTop: ms(14), backgroundColor: CARD_BG, borderRadius: ms(22), borderWidth: 1, borderColor: BORDER, padding: ms(18), alignItems: "center" }}>
                <View style={{ width: ms(58), height: ms(58), borderRadius: ms(20), backgroundColor: RED_SOFT, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="lock-closed" size={ms(26)} color={RED} />
                </View>
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(17), color: INK, marginTop: ms(12), textAlign: "center" }}>
                    Subscription Required
                </Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(12.5), color: MUTED, marginTop: ms(6), textAlign: "center", lineHeight: ms(18) }}>
                    Your free trial has ended. Buy a subscription to unlock the live map, real-time bus location, ETA alerts and driver contact.
                </Text>

                {/* What you get back */}
                <View style={{ width: "100%", marginTop: ms(14), gap: ms(9) }}>
                    {[
                        { icon: "navigate" as const, text: "Real-time bus location on the map" },
                        { icon: "time" as const, text: "Live ETA to your home stop" },
                        { icon: "notifications" as const, text: "Boarding, arrival & drop alerts" },
                        { icon: "call" as const, text: "One-tap call to the bus driver" },
                    ].map((f) => (
                        <View key={f.text} style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                            <View style={{ width: ms(28), height: ms(28), borderRadius: ms(10), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={f.icon} size={ms(14)} color={GREEN} />
                            </View>
                            <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>{f.text}</Text>
                        </View>
                    ))}
                </View>

                <Press onPress={onBuy} style={{
                    marginTop: ms(18), width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: ms(8), backgroundColor: ACCENT, borderRadius: ms(16), paddingVertical: ms(14),
                }}>
                    <Ionicons name="card" size={ms(17)} color="#111827" />
                    <Text style={{ fontFamily: FONT.display, fontSize: ms(14.5), color: "#111827" }}>Buy Subscription</Text>
                </Press>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED, marginTop: ms(10), textAlign: "center" }}>
                    Plans start at ₹99/month · New parents get a 7-day free trial
                </Text>
            </View>

            {/* Trust strip */}
            <View style={{ marginTop: ms(12), flexDirection: "row", alignItems: "center", gap: ms(10), backgroundColor: ACCENT_SOFT, borderRadius: ms(16), borderWidth: 1, borderColor: "rgba(185,151,0,0.22)", paddingVertical: ms(11), paddingHorizontal: ms(14) }}>
                <Ionicons name="shield-checkmark" size={ms(17)} color={ACCENT_DEEP} />
                <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(11.5), color: INK }}>
                    Trusted by 2,000+ parents · Cancel anytime · Secure payments
                </Text>
            </View>
        </ScrollView>
    );
}
