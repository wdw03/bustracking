/* ============================================================================
   CONTACT CENTER — School Admin
   Copy to: src/components/schooldashboard/pages/contactcenter.tsx
   Call / WhatsApp any driver directly.
   ========================================================================== */

import React from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    BORDER, CARD_BG, Chip, DRIVERS, FONT, GREEN, GREEN_SOFT, INK, MUTED, PAGE_BG, PageHeader, Press, RED,
    RED_SOFT, busById, ms,
} from "../common";

export default function ContactCenterPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();

    const call = (phone: string) => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
    const whatsapp = (phone: string) => Linking.openURL(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`);

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Contact Center" subtitle="Reach any driver instantly" onBack={onBack} topInset={insets.top} />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                {DRIVERS.map((d) => {
                    const bus = busById(d.busId);
                    const suspended = d.status === "Suspended";
                    return (
                        <View key={d.id} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10) }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: ms(11) }}>
                                <View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="person" size={ms(20)} color={GREEN} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: INK }}>{d.name}</Text>
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>
                                        {bus ? `${bus.number} · ${bus.vehicleNumber}` : "No bus assigned"} · {d.phone}
                                    </Text>
                                </View>
                                <Chip text={d.status} color={suspended ? RED : GREEN} soft={suspended ? RED_SOFT : GREEN_SOFT} />
                            </View>
                            <View style={{ flexDirection: "row", gap: ms(9), marginTop: ms(11) }}>
                                <Press onPress={() => call(d.phone)} style={{ flex: 1, height: ms(44), borderRadius: ms(14), backgroundColor: INK, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}>
                                    <Ionicons name="call" size={ms(14)} color="#FFD500" />
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: "#FFFFFF" }}>Call Driver</Text>
                                </Press>
                                <Press onPress={() => whatsapp(d.phone)} style={{ flex: 1, height: ms(44), borderRadius: ms(14), backgroundColor: "#25D366", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}>
                                    <Ionicons name="logo-whatsapp" size={ms(15)} color="#FFFFFF" />
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: "#FFFFFF" }}>WhatsApp</Text>
                                </Press>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}
