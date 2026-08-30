import React, { useState } from "react";
import { Dimensions, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

const FONT = {
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    display: "Sora-Bold",
    displayHeavy: "Sora-ExtraBold",
};

import { VideoView, useVideoPlayer } from "expo-video";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../services/supabase";

const { width } = Dimensions.get("window");
const ms = (s: number) => Math.round((width / 390) * s);

const PROFILE_VIDEO = require("../../../../assets/expo.icon/Assets/male-profile-animation-gif-download-10059464.mp4");

const INITIAL = {
    name: "Ramesh Singh",
    driverId: "DRV-001",
    phone: "+919102765934",
    email: "ramesh.driver@bustracker.com",
    license: "DL-0420200089123",
    experience: "7 years",
    address: "Haraya Faridabad, Haryana",
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
            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: ms(6), marginLeft: 2 }}>
                {label}
            </Text>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: ms(10),
                    backgroundColor: editing ? "#FFFFFF" : "#F7F8FA",
                    borderRadius: 19,
                    borderTopLeftRadius: ms(24),
                    borderWidth: 1.5,
                    borderColor: editing ? ACCENT : BORDER,
                    paddingHorizontal: ms(11),
                    height: ms(56),
                }}
            >
                <View
                    style={{
                        width: ms(36),
                        height: ms(36),
                        borderRadius: 13,
                        borderTopLeftRadius: ms(17),
                        backgroundColor: editing ? ACCENT_SOFT : "#FFFFFF",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "#F5E6A3",
                    }}
                >
                    <Ionicons name={icon} size={ms(17)} color={ACCENT_DEEP} />
                </View>
                {editing ? (
                    <TextInput
                        value={value}
                        onChangeText={onChange}
                        keyboardType={keyboardType}
                        style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(15), color: INK, paddingVertical: 0 }}
                    />
                ) : (
                    <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(15), color: INK }}>{value}</Text>
                )}
            </View>
        </View>
    );
}

export default function PersonalDetail({ onBack }: { onBack?: () => void }) {
    const insets = useSafeAreaInsets();
    const { profile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [data, setData] = useState(INITIAL);
    const [saved, setSaved] = useState(false);

    // Fetch live driver details from Supabase on mount
    React.useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const { getDriverDashboard } = await import("../../../services/driverService");
                const dash = await getDriverDashboard();
                if (isMounted && dash) {
                    setData((d) => ({
                        ...d,
                        name: dash.profile?.full_name || profile?.full_name || d.name,
                        phone: dash.profile?.phone || profile?.phone || d.phone,
                        email: (dash.profile as any)?.email || (dash.school as any)?.email || d.email,
                        license: dash.driver?.license_number || d.license,
                        experience: `${(dash.driver as any)?.experience_years || 7} years`,
                        address: (dash.school as any)?.address || d.address,
                        driverId: dash.driver?.id ? `DRV-${dash.driver.id.slice(0, 4).toUpperCase()}` : d.driverId,
                    }));
                }
            } catch (err) {
                console.warn("Personal details fetch fallback:", err);
            }
        })();
        return () => { isMounted = false; };
    }, [profile]);

    const profilePlayer = useVideoPlayer(PROFILE_VIDEO, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    const set = (k: keyof typeof INITIAL) => (v: string) => setData((d) => ({ ...d, [k]: v }));

    const toggleEdit = async () => {
        Haptics.selectionAsync();
        if (editing) {
            // Save updates to Supabase
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const cleanExp = parseInt(data.experience.replace(/\D/g, "")) || 0;
                    await supabase.from("profiles").update({
                        full_name: data.name.trim(),
                        updated_at: new Date().toISOString(),
                    }).eq("id", user.id);

                    await supabase.from("drivers").update({
                        license_number: data.license.trim(),
                        experience_years: cleanExp,
                        updated_at: new Date().toISOString(),
                    }).eq("user_id", user.id);
                }
            } catch (e) {
                console.warn("Save driver details error:", e);
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
        }
        setEditing((e) => !e);
    };

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            {/* Header backdrop sweep */}
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
                <Text style={{ flex: 1, fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK }}>Personal Details</Text>
                <Pressable
                    android_ripple={null}
                    onPress={toggleEdit}
                    accessibilityLabel={editing ? "Save" : "Edit"}
                    style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: editing ? INK : "#FFFFFF",
                        borderRadius: 999,
                        paddingHorizontal: ms(15),
                        paddingVertical: ms(8),
                        borderWidth: 1.5,
                        borderColor: editing ? INK : BORDER,
                        shadowColor: "#0F172A",
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 3,
                        opacity: pressed ? 0.85 : 1,
                    })}
                >
                    <Ionicons name={editing ? "checkmark" : "create-outline"} size={ms(15)} color={editing ? ACCENT : INK} />
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: editing ? "#FFFFFF" : INK }}>
                        {editing ? "Save" : "Edit"}
                    </Text>
                </Pressable>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: insets.bottom + ms(30) }}
            >
                {/* Avatar Card */}
                <View style={{ alignItems: "center", marginTop: ms(18) }}>
                    <View
                        style={{
                            width: ms(96),
                            height: ms(96),
                            borderRadius: ms(32),
                            borderTopLeftRadius: ms(38),
                            backgroundColor: "#FFFFFF",
                            borderWidth: 3,
                            borderColor: ACCENT,
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
                        <VideoView
                            player={profilePlayer}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            nativeControls={false}
                        />
                    </View>
                    {editing && (
                        <Pressable
                            android_ripple={null}
                            style={({ pressed }) => ({
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 5,
                                marginTop: ms(8),
                                backgroundColor: "#FFFFFF",
                                borderRadius: 999,
                                paddingHorizontal: ms(12),
                                paddingVertical: ms(6),
                                borderWidth: 1.5,
                                borderColor: BORDER,
                                opacity: pressed ? 0.85 : 1,
                            })}
                        >
                            <Ionicons name="camera-outline" size={ms(13)} color={INK} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: INK }}>Change Photo</Text>
                        </Pressable>
                    )}
                    <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: INK, marginTop: ms(10) }}>
                        {data.name}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <View style={{ backgroundColor: ACCENT_SOFT, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: "#F5E6A3" }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: ACCENT_DEEP }}>ID: {data.driverId}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#DCFCE7", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#BBF7D0" }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: GREEN }}>DL Valid 2029</Text>
                        </View>
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

                {/* Fields */}
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
