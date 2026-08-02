import React from "react";
import { Dimensions, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#FFD500";
const ACCENT_SOFT = "#FFF7CC";
const ACCENT_DEEP = "#B99700";
const INK = "#111827";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER = "#E5E7EB";
const PAGE_BG = "#F8F9FB";
const GREEN = "#16A34A";
const GREEN_SOFT = "#DCFCE7";

const FONT = {
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    display: "Sora-Bold",
    displayHeavy: "Sora-ExtraBold",
};

const { width } = Dimensions.get("window");
const ms = (s: number) => Math.round((width / 390) * s);

const BUS = {
    number: "DL01AB1234",
    route: "Route A",
    model: "Tata Starbus 32-Seater",
    capacity: "32 students",
    driver: "Rajesh Kumar",
    helper: "Suresh Yadav",
    insuranceValid: "Mar 2027",
    fitnessValid: "Aug 2026",
    gpsDevice: "Installed & Active",
    image: null as any,
};

function InfoRow({ icon, label, value, valueColor, last }: { icon: any; label: string; value: string; valueColor?: string; last?: boolean }) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: ms(13),
                borderBottomWidth: last ? 0 : 1,
                borderBottomColor: "#F3F4F6",
            }}
        >
            <View
                style={{
                    width: ms(36),
                    height: ms(36),
                    borderRadius: 13,
                    backgroundColor: ACCENT_SOFT,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={icon} size={ms(16)} color={ACCENT_DEEP} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: FAINT }}>{label}</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(14), color: valueColor ?? INK, marginTop: 2 }}>{value}</Text>
            </View>
        </View>
    );
}

export default function BusDetails({ onBack }: { onBack?: () => void }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -ms(110),
                    left: -ms(40),
                    right: -ms(40),
                    height: ms(240) + insets.top,
                    backgroundColor: ACCENT,
                    borderBottomLeftRadius: ms(90),
                    borderBottomRightRadius: ms(90),
                }}
            />

            <View
                style={{
                    paddingTop: insets.top + ms(10),
                    paddingHorizontal: ms(20),
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <Pressable
                    onPress={onBack}
                    accessibilityLabel="Go back"
                    style={{
                        width: ms(42),
                        height: ms(42),
                        borderRadius: ms(15),
                        backgroundColor: "#FFFFFF",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 3,
                    }}
                >
                    <Ionicons name="arrow-back" size={ms(19)} color={INK} />
                </Pressable>
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK }}>Bus Details</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: insets.bottom + ms(30) }}
            >
                <View
                    style={{
                        alignItems: "center",
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: BORDER,
                        paddingVertical: ms(22),
                        marginTop: ms(18),
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 3,
                    }}
                >
                    <View
                        style={{
                            width: ms(140),
                            height: ms(100),
                            borderRadius: ms(24),
                            backgroundColor: ACCENT_SOFT,
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            borderWidth: 2,
                            borderColor: ACCENT,
                        }}
                    >
                        {BUS.image ? (
                            <Image source={BUS.image} style={{ width: "85%", height: "85%" }} resizeMode="contain" />
                        ) : (
                            <Ionicons name="bus" size={ms(48)} color={ACCENT_DEEP} />
                        )}
                    </View>
                    <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(20), color: INK, marginTop: ms(12), letterSpacing: 1 }}>
                        {BUS.number}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <View style={{ backgroundColor: ACCENT_SOFT, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: ACCENT_DEEP }}>{BUS.route}</Text>
                        </View>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                backgroundColor: GREEN_SOFT,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 3,
                            }}
                        >
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: GREEN }}>GPS Active</Text>
                        </View>
                    </View>
                </View>

                <View
                    style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: BORDER,
                        paddingHorizontal: ms(16),
                        paddingVertical: ms(4),
                        marginTop: ms(16),
                    }}
                >
                    <InfoRow icon="bus-outline" label="BUS NUMBER" value={BUS.number} />
                    <InfoRow icon="map-outline" label="ROUTE" value={BUS.route} />
                    <InfoRow icon="construct-outline" label="MODEL" value={BUS.model} />
                    <InfoRow icon="people-outline" label="CAPACITY" value={BUS.capacity} />
                    <InfoRow icon="person-outline" label="DRIVER NAME" value={BUS.driver} />
                    <InfoRow icon="person-add-outline" label="HELPER" value={BUS.helper} last />
                </View>

                <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: ms(20), marginBottom: ms(10) }}>
                    Documents & Devices
                </Text>
                <View
                    style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: BORDER,
                        paddingHorizontal: ms(16),
                        paddingVertical: ms(4),
                    }}
                >
                    <InfoRow icon="shield-checkmark-outline" label="INSURANCE VALID TILL" value={BUS.insuranceValid} valueColor={GREEN} />
                    <InfoRow icon="document-text-outline" label="FITNESS CERTIFICATE" value={BUS.fitnessValid} valueColor={GREEN} />
                    <InfoRow icon="hardware-chip-outline" label="GPS DEVICE" value={BUS.gpsDevice} valueColor={GREEN} last />
                </View>
            </ScrollView>
        </View>
    );
}
