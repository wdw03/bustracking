import React from "react";
import { Dimensions, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

const SCHOOL = {
    name: "Green Valley School",
    code: "GVS-2024-113",
    address: "Plot 7, Knowledge Park, Sector 62, Noida, Uttar Pradesh 201301",
    principal: "Dr. Meena Sharma",
    contact: "+91 120 456 7890",
    email: "office@greenvalley.edu.in",
    logo: null as any,
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

export default function SchoolDetails({ onBack }: { onBack?: () => void }) {
    const insets = useSafeAreaInsets();
    const [schoolInfo, setSchoolInfo] = React.useState(SCHOOL);

    React.useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const { getDriverDashboard } = await import("../../../services/driverService");
                const dash = await getDriverDashboard();
                if (isMounted && dash?.school) {
                    setSchoolInfo({
                        name: dash.school.name || SCHOOL.name,
                        code: (dash.school as any).code || dash.school.id.slice(0, 8).toUpperCase(),
                        address: (dash.school as any).address || SCHOOL.address,
                        principal: (dash.school as any).principal_name || SCHOOL.principal,
                        contact: dash.school.phone || SCHOOL.contact,
                        email: (dash.school as any).email || SCHOOL.email,
                        logo: null,
                    });
                }
            } catch (err) {
                console.warn("School details fetch fallback:", err);
            }
        })();
        return () => { isMounted = false; };
    }, []);

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
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK }}>School Details</Text>
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
                        paddingVertical: ms(24),
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
                            width: ms(84),
                            height: ms(84),
                            borderRadius: ms(28),
                            backgroundColor: ACCENT_SOFT,
                            borderWidth: 2,
                            borderColor: ACCENT,
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                        }}
                    >
                        {schoolInfo.logo ? (
                            <Image source={schoolInfo.logo} style={{ width: "70%", height: "70%" }} resizeMode="contain" />
                        ) : (
                            <Ionicons name="school" size={ms(38)} color={ACCENT_DEEP} />
                        )}
                    </View>
                    <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: INK, marginTop: ms(12) }}>
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
                    <InfoRow icon="school-outline" label="SCHOOL NAME" value={schoolInfo.name} />
                    <InfoRow icon="pricetag-outline" label="SCHOOL CODE" value={schoolInfo.code} />
                    <InfoRow icon="location-outline" label="SCHOOL ADDRESS" value={schoolInfo.address} />
                    <InfoRow icon="person-outline" label="PRINCIPAL NAME" value={schoolInfo.principal} />
                    <InfoRow icon="call-outline" label="SCHOOL CONTACT NUMBER" value={schoolInfo.contact} last />
                </View>
            </ScrollView>
        </View>
    );
}
