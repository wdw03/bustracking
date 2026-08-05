/* ============================================================================
   PARENT MANAGEMENT — School Admin
   Copy to: src/components/schooldashboard/pages/parentmanagement.tsx
   Add / Edit / Remove / Search / Call / Notify / Bus Change / Multi-link.
   ========================================================================== */

import React, { useState } from "react";
import { Alert, Linking, ScrollView, Text, TextInput, View, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import {
    Card, Chip, DParent, FONT,
    InfoRow, PARENTS, PageHeader, Press,
    SectionTitle, SkeletonItem, busById, ms, studentById, useSchoolData, useTheme
} from "../common";

const FAMILY_VIDEO = require("../../../../assets/expo.icon/Assets/happy-family-animation-gif-download-5804610.mp4");

export default function ParentManagementPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<DParent | null>(null);
    const [query, setQuery] = useState("");
    const { parents, isLoading } = useSchoolData();
    const { INK, PAGE_BG, CARD_BG, BORDER, ACCENT, ACCENT_DEEP, ACCENT_SOFT, MUTED, FAINT, BLUE, BLUE_SOFT, GREEN, GREEN_SOFT, RED, RED_SOFT, PURPLE, PURPLE_SOFT, ORANGE, ORANGE_SOFT } = useTheme();

    React.useEffect(() => {
        const onHardwareBack = () => {
            if (selected) { setSelected(null); return true; }
            return false;
        };
        const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
        return () => sub.remove();
    }, [selected]);

    const player = useVideoPlayer(FAMILY_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });
    const act = (label: string) => Alert.alert(label, "The requested parent action has been completed.", [{ text: "OK" }]);

    const list = parents.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.phone.includes(query));

    /* ── PARENT DETAIL ── */
    if (selected) {
        const kids = selected.studentIds.map(studentById).filter(Boolean);
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title={selected.name} subtitle={`${kids.length} linked student${kids.length > 1 ? "s" : ""}`} onBack={() => setSelected(null)} topInset={insets.top}
                    right={<Chip text={selected.subscription} color={selected.subscription === "Active" ? GREEN : RED} soft={selected.subscription === "Active" ? GREEN_SOFT : RED_SOFT} />} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                    <Card>
                        <InfoRow icon="man" label="Father Name" value={selected.father} color={BLUE} soft={BLUE_SOFT} />
                        <InfoRow icon="woman" label="Mother Name" value={selected.mother} color={PURPLE} soft={PURPLE_SOFT} />
                        <InfoRow icon="call" label="Mobile Number" value={selected.phone} color={GREEN} soft={GREEN_SOFT} />
                        <InfoRow icon="mail" label="Email" value={selected.email} color={ORANGE} soft={ORANGE_SOFT} />
                        <InfoRow icon="home" label="Address" value={selected.address} color={RED} soft={RED_SOFT} />
                    </Card>

                    <SectionTitle icon="school" title="Linked Students" />
                    <Card style={{ padding: 0, overflow: "hidden" }}>
                        {kids.map((k, i) => {
                            const bus = busById(k!.busId);
                            return (
                                <View key={k!.id} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(12), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                                    <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}>
                                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(13), color: ORANGE }}>{k!.name.charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>{k!.name}</Text>
                                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED }}>Class {k!.klass}-{k!.section}</Text>
                                    </View>
                                    <Chip text={bus ? bus.number : "No Bus"} color={bus ? BLUE : RED} soft={bus ? BLUE_SOFT : RED_SOFT} />
                                </View>
                            );
                        })}
                    </Card>

                    <SectionTitle icon="options" title="Actions" />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ms(10) }}>
                        {(
                            [
                                { icon: "call", label: "Call Parent", color: GREEN, soft: GREEN_SOFT, fn: () => Linking.openURL(`tel:${selected.phone.replace(/\s/g, "")}`) },
                                { icon: "notifications", label: "Send Notification", color: ACCENT_DEEP, soft: ACCENT_SOFT, fn: () => act("Notification Sent") },
                                { icon: "create", label: "Edit Parent", color: BLUE, soft: BLUE_SOFT, fn: () => act("Edit Parent") },
                                { icon: "swap-horizontal", label: "Change Bus", color: ORANGE, soft: ORANGE_SOFT, fn: () => act("Change Bus") },
                                { icon: "link", label: "Link Student", color: PURPLE, soft: PURPLE_SOFT, fn: () => act("Link Another Student") },
                                { icon: "trash", label: "Remove Parent", color: RED, soft: RED_SOFT, fn: () => Alert.alert("Remove Parent?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => act("Parent Removed") }]) },
                            ] as const
                        ).map((a) => (
                            <Press key={a.label} onPress={a.fn} style={{ flexBasis: "48%", flexGrow: 1, backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, padding: ms(13), flexDirection: "row", alignItems: "center", gap: 9 }}>
                                <View style={{ width: ms(34), height: ms(34), borderRadius: ms(12), backgroundColor: a.soft, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name={a.icon} size={ms(16)} color={a.color} />
                                </View>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK }}>{a.label}</Text>
                            </Press>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    }

    /* ── LIST ── */
    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Parent Management" subtitle={`${PARENTS.length * 78} parents`} onBack={onBack} topInset={insets.top}
                right={
                    <Press onPress={() => act("Add Parent")} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: INK, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8) }}>
                        <Ionicons name="add" size={ms(15)} color={ACCENT} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#FFFFFF" }}>Add</Text>
                    </Press>
                } />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                <View style={{ height: ms(120), borderRadius: ms(20), overflow: "hidden", marginBottom: ms(14), backgroundColor: ACCENT_SOFT }}>
                    <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls={false} contentFit="cover" />
                </View>

                <View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(14) }}>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(50), gap: 8 }}>
                        <Ionicons name="search" size={ms(16)} color={FAINT} />
                        <TextInput value={query} onChangeText={setQuery} placeholder="Search parent name or phone" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }} />
                    </View>
                    <Press onPress={() => setQuery(query.trim())} style={{ width: ms(50), height: ms(50), borderRadius: ms(16), backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="search" size={ms(17)} color={ACCENT} />
                    </Press>
                </View>

                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <View key={i} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(11) }}>
                            <SkeletonItem height={ms(44)} width={ms(44)} borderRadius={ms(15)} />
                            <View style={{ flex: 1 }}>
                                <SkeletonItem height={ms(14)} width="50%" />
                                <SkeletonItem height={ms(12)} width="70%" style={{ marginTop: ms(4) }} />
                            </View>
                            <SkeletonItem height={ms(24)} width={ms(60)} borderRadius={999} />
                        </View>
                    ))
                ) : (
                    list.map((p) => (
                        <Press key={p.id} onPress={() => setSelected(p)} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(11) }}>
                            <View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: PURPLE_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="people" size={ms(19)} color={PURPLE} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: INK }}>{p.name}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>
                                    {p.phone} · {p.studentIds.length} student{p.studentIds.length > 1 ? "s" : ""}
                                </Text>
                            </View>
                            <Press onPress={() => Linking.openURL(`tel:${p.phone.replace(/\s/g, "")}`)} style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="call" size={ms(15)} color={GREEN} />
                            </Press>
                            <Chip text={p.subscription} color={p.subscription === "Active" ? GREEN : RED} soft={p.subscription === "Active" ? GREEN_SOFT : RED_SOFT} />
                        </Press>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
