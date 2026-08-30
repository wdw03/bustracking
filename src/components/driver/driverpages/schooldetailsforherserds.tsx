import React from "react";
import { Dimensions, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

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
const BLUE = "#2563EB";
const BLUE_SOFT = "#DBEAFE";

const FONT = {
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    display: "Sora-Bold",
    displayHeavy: "Sora-ExtraBold",
};

const { width } = Dimensions.get("window");
const ms = (s: number) => Math.round((width / 390) * s);

const SCHOOL_VIDEO = require("../../../../assets/expo.icon/Assets/diverse-kids-getting-on-school-bus-animation-gif-download-10282491.mp4");

const DEFAULT_SCHOOL = {
    name: "Delhi Public School",
    code: "SCH-001",
    address: "Haraya faridabad pali sukhi nahar near by",
    principal: "Dr. Saransh Kumar",
    contact: "+918789968980",
    email: "hqsavan@gmail.com",
    assignedBus: "BUS121",
    shift: "Morning Shift (7:00 AM - 2:30 PM)",
    students: "32 Students",
    totalBuses: "Fleet Active",
    capacity: 32,
    route: "Standard Route",
};

function InfoRow({ icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: ms(12),
                paddingVertical: ms(12),
                borderBottomWidth: last ? 0 : 1,
                borderBottomColor: "#F3F4F6",
            }}
        >
            <View
                style={{
                    width: ms(38),
                    height: ms(38),
                    borderRadius: ms(14),
                    backgroundColor: ACCENT_SOFT,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#F5E6A3",
                }}
            >
                <Ionicons name={icon} size={ms(17)} color={ACCENT_DEEP} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: FAINT, letterSpacing: 0.5 }}>{label}</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(14), color: INK, marginTop: 2, lineHeight: ms(19) }}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

export default function SchoolDetailsForHerserds({ onBack }: { onBack?: () => void }) {
    const insets = useSafeAreaInsets();
    const [schoolInfo, setSchoolInfo] = React.useState(DEFAULT_SCHOOL);

    React.useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const { getDriverDashboard } = await import("../../../services/driverService");
                const dash = await getDriverDashboard();
                if (isMounted && dash) {
                    const rawS = dash.school as any;
                    const rawB = dash.bus as any;
                    setSchoolInfo({
                        name: rawS?.name || DEFAULT_SCHOOL.name,
                        code: rawS?.code || (rawS?.id ? `SCH-${rawS.id.slice(0, 4).toUpperCase()}` : DEFAULT_SCHOOL.code),
                        address: rawS?.address || DEFAULT_SCHOOL.address,
                        principal: rawS?.principal_name || DEFAULT_SCHOOL.principal,
                        contact: rawS?.phone || DEFAULT_SCHOOL.contact,
                        email: rawS?.email || DEFAULT_SCHOOL.email,
                        assignedBus: rawB?.bus_number || DEFAULT_SCHOOL.assignedBus,
                        shift: "Morning Shift (7:00 AM - 2:30 PM)",
                        students: `${rawB?.capacity || 32} Students`,
                        totalBuses: "Fleet Active",
                        capacity: rawB?.capacity || 32,
                        route: rawB?.route_name || DEFAULT_SCHOOL.route,
                    });
                }
            } catch (err) {
                console.warn("School details fetch fallback:", err);
            }
        })();
        return () => { isMounted = false; };
    }, []);

    const player = useVideoPlayer(SCHOOL_VIDEO, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    const call = () => {
        Haptics.selectionAsync();
        Linking.openURL(`tel:${schoolInfo.contact.replace(/\s/g, "")}`);
    };
    const email = () => {
        Haptics.selectionAsync();
        Linking.openURL(`mailto:${schoolInfo.email}`);
    };

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

            {/* Header Navbar */}
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
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK }}>School Details</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: insets.bottom + ms(30) }}
            >
                {/* Hero Organic Video Card */}
                <View
                    style={{
                        marginTop: ms(18),
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: BORDER,
                        overflow: "hidden",
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 3,
                    }}
                >
                    <View style={{ height: ms(200), width: "100%", backgroundColor: ACCENT_SOFT, overflow: "hidden" }}>
                        <VideoView
                            player={player}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            nativeControls={false}
                        />
                        {/* Overlay Glass Badge */}
                        <View
                            style={{
                                position: "absolute",
                                bottom: ms(10),
                                left: ms(10),
                                right: ms(10),
                                backgroundColor: "rgba(17, 24, 39, 0.78)",
                                borderRadius: 16,
                                paddingHorizontal: ms(12),
                                paddingVertical: ms(8),
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN }} />
                            <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(12), color: "#FFFFFF" }} numberOfLines={1}>
                                {schoolInfo.shift}
                            </Text>
                            <View style={{ backgroundColor: ACCENT, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10), color: INK }}>ACTIVE</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ padding: ms(16), alignItems: "center" }}>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(20), color: INK }}>
                            {schoolInfo.name}
                        </Text>
                        <View
                            style={{
                                backgroundColor: PAGE_BG,
                                borderRadius: 999,
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                marginTop: 6,
                                borderWidth: 1,
                                borderColor: BORDER,
                            }}
                        >
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: MUTED }}>
                                School Code: {schoolInfo.code}
                            </Text>
                        </View>

                        {/* Quick Contact Buttons */}
                        <View style={{ flexDirection: "row", gap: 10, marginTop: ms(16) }}>
                            <Pressable
                                onPress={call}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                    backgroundColor: GREEN_SOFT,
                                    borderRadius: 999,
                                    paddingHorizontal: ms(16),
                                    paddingVertical: ms(9),
                                }}
                            >
                                <Ionicons name="call" size={ms(14)} color={GREEN} />
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: GREEN }}>Call School</Text>
                            </Pressable>
                            <Pressable
                                onPress={email}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                    backgroundColor: BLUE_SOFT,
                                    borderRadius: 999,
                                    paddingHorizontal: ms(16),
                                    paddingVertical: ms(9),
                                }}
                            >
                                <Ionicons name="mail" size={ms(14)} color={BLUE} />
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: BLUE }}>Email</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Driver Assignment Overview */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: ms(20), marginBottom: ms(10) }}>
                    Driver Assignment
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: "#FFFFFF",
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: BORDER,
                            padding: ms(14),
                            alignItems: "center",
                        }}
                    >
                        <View style={{ width: ms(36), height: ms(36), borderRadius: 12, backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="bus" size={ms(18)} color={ACCENT_DEEP} />
                        </View>
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: 6 }}>{schoolInfo.assignedBus}</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED }}>Assigned Bus</Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: "#FFFFFF",
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: BORDER,
                            padding: ms(14),
                            alignItems: "center",
                        }}
                    >
                        <View style={{ width: ms(36), height: ms(36), borderRadius: 12, backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="people" size={ms(18)} color={GREEN} />
                        </View>
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: 6 }}>{schoolInfo.students}</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED }}>{schoolInfo.route} Capacity</Text>
                    </View>
                </View>

                {/* Detailed Info Card */}
                <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: ms(20), marginBottom: ms(10) }}>
                    Official Details
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
                    <InfoRow icon="school-outline" label="SCHOOL NAME" value={schoolInfo.name} />
                    <InfoRow icon="pricetag-outline" label="SCHOOL CODE" value={schoolInfo.code} />
                    <InfoRow icon="location-outline" label="SCHOOL ADDRESS" value={schoolInfo.address} />
                    <InfoRow icon="person-outline" label="PRINCIPAL NAME" value={schoolInfo.principal} />
                    <InfoRow icon="call-outline" label="CONTACT NUMBER" value={schoolInfo.contact} />
                    <InfoRow icon="time-outline" label="OPERATING SHIFT" value={schoolInfo.shift} last />
                </View>
            </ScrollView>
        </View>
    );
}
