import React, { useState } from "react";
import { Dimensions, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
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

const FONT = {
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    display: "Sora-Bold",
    displayHeavy: "Sora-ExtraBold",
};

const { width } = Dimensions.get("window");
const ms = (s: number) => Math.round((width / 390) * s);

const INITIAL = {
    name: "Rajesh Kumar",
    driverId: "DRV001",
    phone: "9876543210",
    email: "rajesh.kumar@gmail.com",
    license: "DL-0420110149646",
    experience: "8 years",
    address: "H-42, Sector 12, New Delhi",
    profileImage: null as any,
};

function Field({
    icon,
    label,
    value,
    editing,
    onChange,
    keyboardType,
}: {
    icon: any;
    label: string;
    value: string;
    editing: boolean;
    onChange: (v: string) => void;
    keyboardType?: any;
}) {
    return (
        <View style={{ marginBottom: ms(12) }}>
            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: MUTED, marginBottom: 6, marginLeft: 2 }}>
                {label}
            </Text>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: editing ? ACCENT : BORDER,
                    paddingHorizontal: ms(12),
                    height: ms(52),
                }}
            >
                <View
                    style={{
                        width: ms(32),
                        height: ms(32),
                        borderRadius: 11,
                        backgroundColor: ACCENT_SOFT,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name={icon} size={ms(15)} color={ACCENT_DEEP} />
                </View>
                {editing ? (
                    <TextInput
                        value={value}
                        onChangeText={onChange}
                        keyboardType={keyboardType}
                        style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(14), color: INK, paddingVertical: 0 }}
                    />
                ) : (
                    <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(14), color: INK }}>{value}</Text>
                )}
            </View>
        </View>
    );
}

export default function PersonalDetail({ onBack }: { onBack?: () => void }) {
    const insets = useSafeAreaInsets();
    const [editing, setEditing] = useState(false);
    const [data, setData] = useState(INITIAL);
    const [saved, setSaved] = useState(false);

    const set = (k: keyof typeof INITIAL) => (v: string) => setData((d) => ({ ...d, [k]: v }));

    const toggleEdit = () => {
        Haptics.selectionAsync();
        if (editing) {
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
        }
        setEditing((e) => !e);
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
                <Text style={{ flex: 1, fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK }}>Personal Details</Text>
                <Pressable
                    onPress={toggleEdit}
                    accessibilityLabel={editing ? "Save" : "Edit"}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        backgroundColor: editing ? INK : "#FFFFFF",
                        borderRadius: 999,
                        paddingHorizontal: ms(14),
                        paddingVertical: ms(8),
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 3,
                    }}
                >
                    <Ionicons name={editing ? "checkmark" : "create-outline"} size={ms(14)} color={editing ? ACCENT : INK} />
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: editing ? "#FFFFFF" : INK }}>
                        {editing ? "Save" : "Edit"}
                    </Text>
                </Pressable>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: insets.bottom + ms(30) }}
            >
                <View style={{ alignItems: "center", marginTop: ms(18) }}>
                    <View
                        style={{
                            width: ms(96),
                            height: ms(96),
                            borderRadius: ms(32),
                            backgroundColor: "#FFFFFF",
                            borderWidth: 3,
                            borderColor: "#FFFFFF",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            shadowColor: "#0F172A",
                            shadowOpacity: 0.12,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 5 },
                            elevation: 5,
                        }}
                    >
                        {data.profileImage ? (
                            <Image source={data.profileImage} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                        ) : (
                            <Ionicons name="person" size={ms(44)} color={ACCENT_DEEP} />
                        )}
                    </View>
                    {editing && (
                        <Pressable
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 5,
                                marginTop: 8,
                                backgroundColor: "#FFFFFF",
                                borderRadius: 999,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderWidth: 1,
                                borderColor: BORDER,
                            }}
                        >
                            <Ionicons name="camera-outline" size={ms(13)} color={INK} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: INK }}>Change Photo</Text>
                        </Pressable>
                    )}
                    <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: INK, marginTop: ms(10) }}>
                        {data.name}
                    </Text>
                    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4, borderWidth: 1, borderColor: BORDER }}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: ACCENT_DEEP }}>ID: {data.driverId}</Text>
                    </View>
                </View>

                {saved && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            backgroundColor: "#DCFCE7",
                            borderRadius: 14,
                            paddingVertical: ms(9),
                            marginTop: ms(14),
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={ms(15)} color={GREEN} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: GREEN }}>Profile updated</Text>
                    </View>
                )}

                <View style={{ marginTop: ms(18) }}>
                    <Field icon="person-outline" label="Driver Name" value={data.name} editing={editing} onChange={set("name")} />
                    <Field icon="call-outline" label="Phone Number" value={data.phone} editing={editing} onChange={set("phone")} keyboardType="phone-pad" />
                    <Field icon="mail-outline" label="Email" value={data.email} editing={editing} onChange={set("email")} keyboardType="email-address" />
                    <Field icon="card-outline" label="License Number" value={data.license} editing={editing} onChange={set("license")} />
                    <Field icon="ribbon-outline" label="Experience" value={data.experience} editing={editing} onChange={set("experience")} />
                    <Field icon="home-outline" label="Address" value={data.address} editing={editing} onChange={set("address")} />
                </View>
            </ScrollView>
        </View>
    );
}
