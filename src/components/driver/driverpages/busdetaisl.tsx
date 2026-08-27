import React from "react";
import { Dimensions, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#FFD60A";
const ACCENT_SOFT = "#FFF6CC";
const ACCENT_DEEP = "#E6BC00";
const INK = "#101010";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER = "#ECEDF0";
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

const schoolBusIcon = require("../../../../assets/expo.icon/Assets/3d-yellow-school-bus-vehicle-transport-icon-education-design-kids-passenger-transportation-school-elements-back-to-school-concept-3d-render-illustration-png.webp");

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
    image: schoolBusIcon,
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
                    borderTopLeftRadius: ms(17),
                    backgroundColor: ACCENT_SOFT,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#F5E6A3",
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
    const [busInfo, setBusInfo] = React.useState(BUS);

    React.useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const { getDriverDashboard } = await import("../../../services/driverService");
                const dash = await getDriverDashboard();
                if (isMounted && dash?.bus) {
                    setBusInfo({
                        number: dash.bus.bus_number || BUS.number,
                        route: dash.bus.route_name || BUS.route,
                        model: (dash.bus as any).model || BUS.model,
                        capacity: `${dash.bus.capacity || 30} students`,
                        driver: dash.profile?.full_name || BUS.driver,
                        helper: (dash.bus as any).helper_name || BUS.helper,
                        insuranceValid: "Active",
                        fitnessValid: "Valid",
                        gpsDevice: "Installed & Active",
                        image: schoolBusIcon,
                    });
                }
            } catch (err) {
                console.warn("Bus details fetch fallback:", err);
            }
        })();
        return () => { isMounted = false; };
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            {/* Header backdrop */}
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

            {/* Header */}
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
                    android_ripple={null}
                    onPress={onBack}
                    accessibilityLabel="Go back"
                    style={({ pressed }) => ({
                        width: ms(42),
                        height: ms(42),
                        borderRadius: 16,
                        borderTopLeftRadius: ms(20),
                        borderBottomRightRadius: ms(20),
                        backgroundColor: pressed ? ACCENT_SOFT : "#FFFFFF",
                        borderWidth: 1.5,
                        borderColor: BORDER,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 3,
                        opacity: pressed ? 0.85 : 1,
                    })}
                >
                    <Ionicons name="arrow-back" size={ms(20)} color={INK} />
                </Pressable>
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK }}>Bus Details</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: insets.bottom + ms(30) }}
            >
                {/* Bus Hero Card */}
                <View
                    style={{
                        alignItems: "center",
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderTopLeftRadius: 28,
                        borderWidth: 1.5,
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
                            borderTopLeftRadius: ms(30),
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

                {/* ── Live Speedometer & Telemetry Dashboard Widget ── */}
                <View
                    style={{
                        marginTop: ms(16),
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderTopLeftRadius: ms(30),
                        borderBottomRightRadius: ms(30),
                        borderWidth: 1.5,
                        borderColor: ACCENT_DEEP,
                        padding: ms(14),
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 3,
                    }}
                >
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: ms(12) }}>
                        <View style={{ width: ms(4), height: ms(16), borderRadius: 3, backgroundColor: ACCENT, marginRight: 8 }} />
                        <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: ms(14), color: INK }}>Live Bus Telemetry</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10), color: GREEN }}>LIVE SENSORS</Text>
                        </View>
                    </View>

                    {/* Speedometer & GPS Grid */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        {/* Speedometer Card */}
                        <View style={{ flex: 1, backgroundColor: PAGE_BG, borderRadius: 18, padding: ms(12), borderWidth: 1, borderColor: BORDER, alignItems: "center" }}>
                            <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="speedometer" size={ms(20)} color={ACCENT_DEEP} />
                            </View>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(20), color: INK, marginTop: ms(6) }}>42 <Text style={{ fontSize: ms(11), fontFamily: FONT.semibold, color: MUTED }}>km/h</Text></Text>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: MUTED, marginTop: 2 }}>Current Speed ⚡</Text>
                            <View style={{ backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 6 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9.5), color: GREEN }}>Safe Speed 🟢</Text>
                            </View>
                        </View>

                        {/* GPS Accuracy Card */}
                        <View style={{ flex: 1, backgroundColor: PAGE_BG, borderRadius: 18, padding: ms(12), borderWidth: 1, borderColor: BORDER, alignItems: "center" }}>
                            <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="location" size={ms(18)} color={GREEN} />
                            </View>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(17), color: INK, marginTop: ms(6) }}>High <Text style={{ fontSize: ms(10.5), fontFamily: FONT.regular, color: MUTED }}>(2m)</Text></Text>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: MUTED, marginTop: 2 }}>GPS Signal 📍</Text>
                            <View style={{ backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 6 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(9.5), color: GREEN }}>Strong 📡</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Details list */}
                <View
                    style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderTopLeftRadius: 28,
                        borderWidth: 1.5,
                        borderColor: BORDER,
                        paddingHorizontal: ms(16),
                        paddingVertical: ms(4),
                        marginTop: ms(16),
                    }}
                >
                    <InfoRow icon="bus-outline" label="BUS NUMBER" value={busInfo.number} />
                    <InfoRow icon="map-outline" label="ROUTE" value={busInfo.route} />
                    <InfoRow icon="construct-outline" label="MODEL" value={busInfo.model} />
                    <InfoRow icon="people-outline" label="CAPACITY" value={busInfo.capacity} />
                    <InfoRow icon="person-outline" label="DRIVER NAME" value={busInfo.driver} />
                    <InfoRow icon="person-add-outline" label="HELPER" value={busInfo.helper} last />
                </View>

                <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: ms(20), marginBottom: ms(10) }}>
                    Documents & Devices
                </Text>
                <View
                    style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderTopLeftRadius: 28,
                        borderWidth: 1.5,
                        borderColor: BORDER,
                        paddingHorizontal: ms(16),
                        paddingVertical: ms(4),
                    }}
                >
                    <InfoRow icon="shield-checkmark-outline" label="INSURANCE VALID TILL" value={busInfo.insuranceValid} valueColor={GREEN} />
                    <InfoRow icon="document-text-outline" label="FITNESS CERTIFICATE" value={busInfo.fitnessValid} valueColor={GREEN} />
                    <InfoRow icon="hardware-chip-outline" label="GPS DEVICE" value={busInfo.gpsDevice} valueColor={GREEN} last />
                </View>
            </ScrollView>
        </View>
    );
}
