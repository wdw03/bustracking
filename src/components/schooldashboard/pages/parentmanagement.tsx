import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, View, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import {
    Card, Chip, DParent, FONT,
    InfoRow, PageHeader, Press,
    SectionTitle, SkeletonItem, ms, useSchoolData, useTheme
} from "../common";

const FAMILY_VIDEO = require("../../../../assets/expo.icon/Assets/happy-family-animation-gif-download-5804610.mp4");

export default function ParentManagementPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<DParent | null>(null);
    const [adding, setAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [query, setQuery] = useState("");
    const [form, setForm] = useState({ name: "", phone: "", studentId: null as string | null });

    const { parents, students, buses, addParent, removeParent, isLoading } = useSchoolData();
    const { INK, PAGE_BG, CARD_BG, BORDER, ACCENT, ACCENT_DEEP, ACCENT_SOFT, MUTED, FAINT, BLUE, BLUE_SOFT, GREEN, GREEN_SOFT, RED, RED_SOFT, PURPLE, PURPLE_SOFT, ORANGE, ORANGE_SOFT, isDark } = useTheme();

    React.useEffect(() => {
        const onHardwareBack = () => {
            if (adding) { setAdding(false); return true; }
            if (selected) { setSelected(null); return true; }
            return false;
        };
        const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
        return () => sub.remove();
    }, [adding, selected]);

    const player = useVideoPlayer(FAMILY_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });

    const list = parents.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.phone.includes(query));

    const handleSaveParent = async () => {
        if (!form.name.trim() || !form.phone.trim()) {
            Alert.alert("Missing details", "Parent name and mobile number are required.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await addParent({
                name: form.name.trim(),
                phone: form.phone.trim(),
                studentId: form.studentId,
            });

            if (res && !res.success) {
                Alert.alert("Error", res.error || "Failed to add parent.");
                setIsSaving(false);
                return;
            }

            setAdding(false);
            setForm({ name: "", phone: "", studentId: null });
            if (res?.data) setSelected(res.data);
            Alert.alert("Parent Authorized", `${form.name.trim()} is now authorized and will automatically link upon registration.`);
        } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to add parent.");
        } finally {
            setIsSaving(false);
        }
    };

    /* ── ADD PARENT FORM ── */
    if (adding) {
        return (
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: PAGE_BG }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={insets.top}>
                <PageHeader title="Add Parent / Guardian" subtitle="Authorize parent mobile for login" onBack={() => setAdding(false)} topInset={insets.top} />
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) + insets.bottom }}>
                    <Card style={{ gap: ms(13) }}>
                        <View>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 6 }}>Parent / Guardian Name *</Text>
                            <View style={{ height: ms(50), borderRadius: ms(14), borderWidth: 1, borderColor: BORDER, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FCFCFD", flexDirection: "row", alignItems: "center", paddingHorizontal: ms(11), gap: 8 }}>
                                <Ionicons name="person" size={ms(16)} color={FAINT} />
                                <TextInput value={form.name} onChangeText={(name) => setForm(f => ({ ...f, name }))} placeholder="e.g. Rajesh Sharma" placeholderTextColor={FAINT} autoCapitalize="words" style={{ flex: 1, fontFamily: FONT.regular, color: INK, fontSize: ms(13) }} />
                            </View>
                        </View>
                        <View>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 6 }}>Mobile Number *</Text>
                            <View style={{ height: ms(50), borderRadius: ms(14), borderWidth: 1, borderColor: BORDER, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FCFCFD", flexDirection: "row", alignItems: "center", paddingHorizontal: ms(11), gap: 8 }}>
                                <Ionicons name="call" size={ms(16)} color={FAINT} />
                                <TextInput value={form.phone} onChangeText={(phone) => setForm(f => ({ ...f, phone }))} placeholder="10-digit mobile number" placeholderTextColor={FAINT} keyboardType="phone-pad" style={{ flex: 1, fontFamily: FONT.regular, color: INK, fontSize: ms(13) }} />
                            </View>
                        </View>
                    </Card>

                    <SectionTitle icon="school" title="Link Student" right={<Chip text={form.studentId ? "Selected" : "Optional"} color={form.studentId ? GREEN : MUTED} soft={form.studentId ? GREEN_SOFT : PAGE_BG} />} />
                    <View style={{ gap: ms(8) }}>
                        <Press onPress={() => setForm(f => ({ ...f, studentId: null }))} style={{ padding: ms(12), borderRadius: ms(15), borderWidth: 1.5, borderColor: form.studentId === null ? RED : BORDER, backgroundColor: form.studentId === null ? RED_SOFT : CARD_BG, flexDirection: "row", alignItems: "center", gap: 9 }}>
                            <Ionicons name="close-circle" size={ms(18)} color={RED} />
                            <Text style={{ flex: 1, fontFamily: FONT.semibold, color: INK }}>Link student later</Text>
                            {form.studentId === null && <Ionicons name="checkmark-circle" size={ms(18)} color={RED} />}
                        </Press>
                        {students.map((student) => (
                            <Press key={student.id} onPress={() => setForm(f => ({ ...f, studentId: student.id }))} style={{ padding: ms(12), borderRadius: ms(15), borderWidth: 1.5, borderColor: form.studentId === student.id ? BLUE : BORDER, backgroundColor: form.studentId === student.id ? BLUE_SOFT : CARD_BG, flexDirection: "row", alignItems: "center", gap: 9 }}>
                                <View style={{ width: ms(34), height: ms(34), borderRadius: ms(11), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontFamily: FONT.displayHeavy, color: ORANGE, fontSize: ms(12) }}>{student.name.charAt(0)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: FONT.semibold, color: INK }}>{student.name}</Text>
                                    <Text style={{ fontFamily: FONT.regular, color: MUTED, fontSize: ms(11) }}>Class {student.klass}-{student.section} · Roll {student.rollNo}</Text>
                                </View>
                                {form.studentId === student.id && <Ionicons name="checkmark-circle" size={ms(18)} color={BLUE} />}
                            </Press>
                        ))}
                    </View>

                    <Press onPress={isSaving ? undefined : handleSaveParent} style={{ height: ms(54), borderRadius: ms(18), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: ms(22), opacity: isSaving ? 0.7 : 1 }}>
                        <Ionicons name={isSaving ? "hourglass" : "person-add"} size={ms(18)} color={INK} />
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>{isSaving ? "Saving to database..." : "Authorize Parent"}</Text>
                    </Press>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    /* ── PARENT DETAIL ── */
    if (selected) {
        const kids = selected.studentIds.map(id => students.find(s => s.id === id)).filter(Boolean);
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title={selected.name} subtitle={`${kids.length} linked student${kids.length !== 1 ? "s" : ""}`} onBack={() => setSelected(null)} topInset={insets.top}
                    right={<Chip text={selected.subscription} color={selected.subscription === "Active" ? GREEN : RED} soft={selected.subscription === "Active" ? GREEN_SOFT : RED_SOFT} />} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                    <Card>
                        <InfoRow icon="man" label="Father / Guardian" value={selected.father} color={BLUE} soft={BLUE_SOFT} />
                        <InfoRow icon="call" label="Mobile Number" value={selected.phone} color={GREEN} soft={GREEN_SOFT} />
                        <InfoRow icon="mail" label="Email" value={selected.email} color={ORANGE} soft={ORANGE_SOFT} />
                        <InfoRow icon="home" label="Address" value={selected.address} color={RED} soft={RED_SOFT} />
                    </Card>

                    <SectionTitle icon="school" title="Linked Students" />
                    <Card style={{ padding: 0, overflow: "hidden" }}>
                        {kids.length === 0 ? (
                            <View style={{ padding: ms(16), alignItems: "center" }}>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED }}>No student currently linked</Text>
                            </View>
                        ) : kids.map((k, i) => {
                            const bus = buses.find(b => b.id === k!.busId);
                            return (
                                <View key={k!.id} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(12), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                                    <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}>
                                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(13), color: ORANGE }}>{k!.name.charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>{k!.name}</Text>
                                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED }}>Class {k!.klass}-{k!.section} · Roll {k!.rollNo}</Text>
                                    </View>
                                    <Chip text={bus ? bus.number : "No Bus"} color={bus ? BLUE : RED} soft={bus ? BLUE_SOFT : RED_SOFT} />
                                </View>
                            );
                        })}
                    </Card>

                    <SectionTitle icon="options" title="Actions" />
                    <View style={{ flexDirection: "row", gap: ms(10) }}>
                        <Press onPress={() => Linking.openURL(`tel:${selected.phone.replace(/\s/g, "")}`)} style={{ flex: 1, height: ms(52), borderRadius: ms(17), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }}>
                            <Ionicons name="call" size={ms(18)} color={GREEN} />
                            <Text style={{ fontFamily: FONT.semibold, color: GREEN }}>Call Parent</Text>
                        </Press>
                        <Press onPress={() => Alert.alert("Remove Parent?", "This parent's authorization will be removed from the school database.", [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: async () => { await removeParent(selected.id); setSelected(null); } }])} style={{ width: ms(52), height: ms(52), borderRadius: ms(17), backgroundColor: RED_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="trash" size={ms(17)} color={RED} />
                        </Press>
                    </View>
                </ScrollView>
            </View>
        );
    }

    /* ── LIST ── */
    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Parent Management" subtitle={`${parents.length} registered parent${parents.length !== 1 ? "s" : ""}`} onBack={onBack} topInset={insets.top}
                right={
                    <Press onPress={() => { setForm({ name: "", phone: "", studentId: null }); setAdding(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: INK, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8) }}>
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
                                    {p.phone} · {p.studentIds.length} student{p.studentIds.length !== 1 ? "s" : ""}
                                </Text>
                            </View>
                            <Press onPress={() => Linking.openURL(`tel:${p.phone.replace(/\s/g, "")}`)} style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="call" size={ms(15)} color={GREEN} />
                            </Press>
                            <Chip text={p.subscription} color={p.subscription === "Active" ? GREEN : RED} soft={p.subscription === "Active" ? GREEN_SOFT : RED_SOFT} />
                        </Press>
                    ))
                )}
                {!isLoading && list.length === 0 && (
                    <View style={{ alignItems: "center", paddingVertical: ms(42) }}>
                        <Ionicons name="people-outline" size={ms(36)} color={FAINT} />
                        <Text style={{ fontFamily: FONT.semibold, color: MUTED, marginTop: 8 }}>No parents found</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
