import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, View, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    Card, Chip, DStudent, FONT, InfoRow, PageHeader, Press,
    SectionTitle, SkeletonItem, ms, useSchoolData, useTheme
} from "../common";

type FormState = Pick<DStudent, "name" | "admissionNo" | "rollNo" | "klass" | "section" | "gender" | "dob" | "parentName" | "parentPhone" | "busId">;

const emptyForm: FormState = {
    name: "", admissionNo: "", rollNo: "", klass: "", section: "", gender: "Male", dob: "",
    parentName: "", parentPhone: "", busId: null,
};

export default function StudentManagementPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const { buses, students, addStudent, updateStudent, removeStudent, isLoading } = useSchoolData();
    const [selected, setSelected] = useState<DStudent | null>(null);
    const [formStudent, setFormStudent] = useState<DStudent | null | undefined>(undefined);
    const [query, setQuery] = useState("");
    const [form, setForm] = useState<FormState>(emptyForm);
    const { INK, PAGE_BG, CARD_BG, BORDER, ACCENT, ACCENT_DEEP, ACCENT_SOFT, MUTED, FAINT, BLUE, BLUE_SOFT, GREEN, GREEN_SOFT, RED, RED_SOFT, PURPLE, PURPLE_SOFT, ORANGE, ORANGE_SOFT, isDark } = useTheme();

    const list = useMemo(() => students.filter((student) => {
        const needle = query.trim().toLowerCase();
        return !needle || student.name.toLowerCase().includes(needle) || student.admissionNo.toLowerCase().includes(needle) || `${student.klass}-${student.section}`.toLowerCase().includes(needle);
    }), [students, query]);

    const openForm = (student?: DStudent) => {
        setFormStudent(student ?? null);
        setForm(student ? {
            name: student.name, admissionNo: student.admissionNo, rollNo: student.rollNo, klass: student.klass,
            section: student.section, gender: student.gender, dob: student.dob, parentName: student.parentName,
            parentPhone: student.parentPhone, busId: student.busId,
        } : emptyForm);
    };

    React.useEffect(() => {
        const onHardwareBack = () => {
            if (formStudent !== undefined) { setFormStudent(undefined); return true; }
            if (selected) { setSelected(null); return true; }
            return false;
        };
        const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
        return () => sub.remove();
    }, [formStudent, selected]);

    const [isSaving, setIsSaving] = useState(false);

    const update = (key: keyof FormState, value: string | null) => setForm((current) => ({ ...current, [key]: value }));

    const saveStudent = async () => {
        if (!form.name.trim() || !form.admissionNo.trim() || !form.klass.trim() || !form.section.trim() || !form.parentName.trim() || !form.parentPhone.trim()) {
            Alert.alert("Missing details", "Student name, admission number, class, section, father/guardian and phone are required.");
            return;
        }

        setIsSaving(true);
        const student: DStudent = {
            id: formStudent ? formStudent.id : `st-${Date.now()}`,
            studentId: formStudent?.studentId ?? `STU-${String(students.length + 101).padStart(3, "0")}`,
            ...form,
            name: form.name.trim(), admissionNo: form.admissionNo.trim(), rollNo: form.rollNo.trim() || "—",
            klass: form.klass.trim(), section: form.section.trim().toUpperCase(), dob: form.dob.trim() || "Not added",
            parentName: form.parentName.trim(), parentPhone: form.parentPhone.trim(),
        };

        try {
            if (formStudent) {
                const res = await updateStudent(student);
                if (res && !res.success) {
                    Alert.alert("Update Error", res.error || "Failed to update student in database.");
                    setIsSaving(false);
                    return;
                }
                setSelected(student);
            } else {
                const res = await addStudent(student);
                if (res && !res.success) {
                    Alert.alert("Add Error", res.error || "Failed to add student to database.");
                    setIsSaving(false);
                    return;
                }
                if (res?.data) setSelected(res.data);
                else setSelected(student);
            }
            setFormStudent(undefined);
            Alert.alert(formStudent ? "Student updated" : "Student added", `${student.name} is now saved in database.`);
        } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to save student.");
        } finally {
            setIsSaving(false);
        }
    };

    const requestDelete = (student: DStudent) => Alert.alert(
        "Delete student?",
        `${student.name} will be removed from the school database.`,
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    await removeStudent(student.id);
                    setSelected(null);
                },
            },
        ],
    );

    if (formStudent !== undefined) {
        const editing = Boolean(formStudent);
        return (
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: PAGE_BG }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={insets.top}>
                <PageHeader title={editing ? "Edit Student" : "Add Student"} subtitle="Student, parent and bus details" onBack={() => setFormStudent(undefined)} topInset={insets.top} />
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: ms(16), paddingBottom: ms(42) + insets.bottom }} showsVerticalScrollIndicator={false}>
                    <View style={{ backgroundColor: ACCENT_SOFT, borderRadius: ms(18), padding: ms(13), flexDirection: "row", gap: ms(10), marginBottom: ms(16) }}>
                        <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" }}><Ionicons name="school" size={ms(18)} color={INK} /></View>
                        <View style={{ flex: 1 }}><Text style={{ fontFamily: FONT.semibold, color: INK, fontSize: ms(13) }}>No address needed</Text><Text style={{ fontFamily: FONT.regular, color: ACCENT_DEEP, fontSize: ms(11.5), marginTop: 2 }}>Add the school details and choose a bus below.</Text></View>
                    </View>
                    <SectionTitle icon="person" title="Student details" />
                    <Card style={{ gap: ms(12) }}>
                        <Field icon="person" label="Student name *" value={form.name} onChangeText={(value) => update("name", value)} placeholder="e.g. Aarav Sharma" autoCapitalize="words" />
                        <Field icon="document-text" label="Admission number *" value={form.admissionNo} onChangeText={(value) => update("admissionNo", value)} placeholder="e.g. ADM-2026-0107" autoCapitalize="characters" />
                        <View style={{ flexDirection: "row", gap: ms(10) }}>
                            <View style={{ flex: 1 }}><Field icon="list" label="Roll no." value={form.rollNo} onChangeText={(value) => update("rollNo", value)} placeholder="e.g. 12" keyboardType="number-pad" /></View>
                            <View style={{ flex: 1 }}><Field icon="calendar" label="Date of birth" value={form.dob} onChangeText={(value) => update("dob", value)} placeholder="DD Mon YYYY" /></View>
                        </View>
                        <View style={{ flexDirection: "row", gap: ms(10) }}>
                            <View style={{ flex: 1 }}><Field icon="book" label="Class *" value={form.klass} onChangeText={(value) => update("klass", value)} placeholder="e.g. V" autoCapitalize="characters" /></View>
                            <View style={{ flex: 1 }}><Field icon="albums" label="Section *" value={form.section} onChangeText={(value) => update("section", value)} placeholder="e.g. A" autoCapitalize="characters" /></View>
                        </View>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>Gender</Text>
                        <View style={{ flexDirection: "row", gap: ms(8) }}>{["Male", "Female", "Other"].map((gender) => <Press key={gender} onPress={() => update("gender", gender)} style={{ flex: 1, paddingVertical: ms(10), borderRadius: ms(13), backgroundColor: form.gender === gender ? ACCENT : PAGE_BG, borderWidth: 1, borderColor: form.gender === gender ? ACCENT : BORDER, alignItems: "center" }}><Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: INK }}>{gender}</Text></Press>)}</View>
                    </Card>
                    <SectionTitle icon="people" title="Parent / guardian" />
                    <Card style={{ gap: ms(12) }}>
                        <Field icon="man" label="Father / guardian name *" value={form.parentName} onChangeText={(value) => update("parentName", value)} placeholder="e.g. Rohit Sharma" autoCapitalize="words" />
                        <Field icon="call" label="Parent phone number *" value={form.parentPhone} onChangeText={(value) => update("parentPhone", value)} placeholder="10-digit mobile number" keyboardType="phone-pad" />
                    </Card>
                    <SectionTitle icon="bus" title="Select bus" right={<Chip text={form.busId ? "Selected" : "Optional"} color={form.busId ? GREEN : MUTED} soft={form.busId ? GREEN_SOFT : PAGE_BG} />} />
                    <View style={{ gap: ms(8) }}>
                        <Press onPress={() => update("busId", null)} style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: form.busId === null ? RED_SOFT : CARD_BG, borderWidth: 1.5, borderColor: form.busId === null ? RED : BORDER, borderRadius: ms(15), padding: ms(12) }}><Ionicons name="close-circle" size={ms(18)} color={RED} /><Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>No bus assigned yet</Text>{form.busId === null && <Ionicons name="checkmark-circle" size={ms(20)} color={RED} />}</Press>
                        {buses.map((bus) => <Press key={bus.id} onPress={() => update("busId", bus.id)} style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: form.busId === bus.id ? BLUE_SOFT : CARD_BG, borderWidth: 1.5, borderColor: form.busId === bus.id ? BLUE : BORDER, borderRadius: ms(15), padding: ms(12) }}><View style={{ width: ms(35), height: ms(35), borderRadius: ms(12), backgroundColor: bus.color + "1A", alignItems: "center", justifyContent: "center" }}><Ionicons name="bus" size={ms(17)} color={bus.color} /></View><View style={{ flex: 1 }}><Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>{bus.number} · {bus.vehicleNumber}</Text><Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED }}>{bus.route} · {bus.status}</Text></View>{form.busId === bus.id && <Ionicons name="checkmark-circle" size={ms(20)} color={BLUE} />}</Press>)}
                    </View>
                    <Press onPress={isSaving ? undefined : saveStudent} style={{ marginTop: ms(22), height: ms(56), borderRadius: ms(18), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: isSaving ? 0.7 : 1 }}>
                        <Ionicons name={isSaving ? "hourglass" : "checkmark-circle"} size={ms(19)} color={INK} />
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>
                            {isSaving ? "Saving to database..." : (editing ? "Save student changes" : "Add student")}
                        </Text>
                    </Press>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    if (selected) {
        const bus = buses.find((item) => item.id === selected.busId);
        return <View style={{ flex: 1, backgroundColor: PAGE_BG }}><PageHeader title={selected.name} subtitle={`Class ${selected.klass}-${selected.section} · Roll ${selected.rollNo}`} onBack={() => setSelected(null)} topInset={insets.top} /><ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}><Card><InfoRow icon="document-text" label="Admission number" value={selected.admissionNo} color={BLUE} soft={BLUE_SOFT} /><InfoRow icon="finger-print" label="Student ID" value={selected.studentId} color={PURPLE} soft={PURPLE_SOFT} /><InfoRow icon="male-female" label="Gender · Date of birth" value={`${selected.gender} · ${selected.dob}`} color={ORANGE} soft={ORANGE_SOFT} /><InfoRow icon="man" label="Father / guardian" value={selected.parentName} color={GREEN} soft={GREEN_SOFT} /><InfoRow icon="call" label="Parent phone" value={selected.parentPhone} color={GREEN} soft={GREEN_SOFT} /><InfoRow icon="bus" label="Assigned bus" value={bus ? `${bus.number} · ${bus.vehicleNumber} · ${bus.route}` : "Not assigned"} /></Card><SectionTitle icon="options" title="Actions" /><View style={{ flexDirection: "row", gap: ms(10) }}><Press onPress={() => Linking.openURL(`tel:${selected.parentPhone.replace(/\s/g, "")}`)} style={{ height: ms(52), width: ms(52), borderRadius: ms(17), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}><Ionicons name="call" size={ms(17)} color={GREEN} /></Press><Press onPress={() => openForm(selected)} style={{ flex: 1, height: ms(52), borderRadius: ms(17), backgroundColor: INK, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }}><Ionicons name="create" size={ms(16)} color={ACCENT} /><Text style={{ fontFamily: FONT.semibold, color: "#FFFFFF" }}>Edit student</Text></Press><Press onPress={() => requestDelete(selected)} style={{ height: ms(52), width: ms(52), borderRadius: ms(17), backgroundColor: RED_SOFT, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FECACA" }}><Ionicons name="trash" size={ms(16)} color={RED} /></Press></View></ScrollView></View>;
    }

    return <View style={{ flex: 1, backgroundColor: PAGE_BG }}><PageHeader title="Student Management" subtitle={`${students.length} active student${students.length === 1 ? "" : "s"}`} onBack={onBack} topInset={insets.top} right={<Press onPress={() => openForm()} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: INK, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8) }}><Ionicons name="add" size={ms(15)} color={ACCENT} /><Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#FFFFFF" }}>Add</Text></Press>} /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}><View style={{ backgroundColor: INK, borderRadius: ms(20), padding: ms(16), marginBottom: ms(14), overflow: "hidden" }}><View style={{ position: "absolute", width: ms(150), height: ms(150), borderRadius: ms(75), backgroundColor: ACCENT, opacity: 0.12, right: -ms(38), top: -ms(58) }} /><Text style={{ fontFamily: FONT.display, fontSize: ms(18), color: "#FFFFFF" }}>Students travel smarter.</Text><Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: "#D1D5DB", marginTop: 4 }}>Add details, assign a bus, and manage everything from one place.</Text></View><View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(14) }}><View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(50), gap: 8 }}><Ionicons name="search" size={ms(16)} color={FAINT} /><TextInput value={query} onChangeText={setQuery} placeholder="Search student, admission no. or class" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }} /></View><Press onPress={() => setQuery(query.trim())} style={{ width: ms(50), height: ms(50), borderRadius: ms(16), backgroundColor: INK, alignItems: "center", justifyContent: "center" }}><Ionicons name="search" size={ms(17)} color={ACCENT} /></Press></View>{isLoading ? Array.from({ length: 4 }).map((_, i) => <View key={i} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(11) }}><SkeletonItem height={ms(44)} width={ms(44)} borderRadius={ms(15)} /><View style={{ flex: 1 }}><SkeletonItem height={ms(14)} width="60%" /><SkeletonItem height={ms(11)} width="85%" style={{ marginTop: ms(4) }} /></View><SkeletonItem height={ms(24)} width={ms(60)} borderRadius={999} /></View>) : list.map((student) => { const bus = buses.find((item) => item.id === student.busId); return <Press key={student.id} onPress={() => setSelected(student)} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(11) }}><View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}><Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(15), color: ORANGE }}>{student.name.charAt(0)}</Text></View><View style={{ flex: 1, minWidth: 0 }}><Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: INK }}>{student.name}</Text><Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>Class {student.klass}-{student.section} · Roll {student.rollNo} · {student.parentName}</Text></View><Chip text={bus ? bus.number : "No Bus"} color={bus ? BLUE : RED} soft={bus ? BLUE_SOFT : RED_SOFT} /></Press>; })}{!isLoading && list.length === 0 && <View style={{ alignItems: "center", paddingVertical: ms(42) }}><Ionicons name="school-outline" size={ms(36)} color={FAINT} /><Text style={{ fontFamily: FONT.semibold, color: MUTED, marginTop: 8 }}>No students found</Text></View>}</ScrollView></View>;
}

function Field({ icon, label, value, onChangeText, placeholder, keyboardType, autoCapitalize }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "phone-pad" | "number-pad"; autoCapitalize?: "none" | "words" | "characters" }) {
    const { INK, FAINT, BORDER, isDark } = useTheme();
    return (
        <View>
            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 6 }}>{label}</Text>
            <View style={{ height: ms(48), borderRadius: ms(14), borderWidth: 1, borderColor: BORDER, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FCFCFD", flexDirection: "row", alignItems: "center", paddingHorizontal: ms(12), gap: 8 }}>
                <Ionicons name={icon} size={ms(16)} color={FAINT} />
                <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={FAINT} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }} />
            </View>
        </View>
    );
}
