import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, View, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Chip, DDriver, FONT, InfoRow, PageHeader, Press, SectionTitle, SkeletonItem, ms, useSchoolData, useTheme } from "../common";

type DriverForm = { name: string; phone: string; license: string; experience: string; busId: string | null };
const emptyForm: DriverForm = { name: "", phone: "", license: "", experience: "", busId: null };

export default function DriverManagementPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const { buses, drivers, addDriver, removeDriver, isLoading } = useSchoolData();
    const [selected, setSelected] = useState<DDriver | null>(null);
    const [adding, setAdding] = useState(false);
    const [query, setQuery] = useState("");
    const [form, setForm] = useState<DriverForm>(emptyForm);
    const { INK, PAGE_BG, CARD_BG, BORDER, ACCENT, MUTED, FAINT, BLUE, BLUE_SOFT, GREEN, GREEN_SOFT, RED, RED_SOFT, PURPLE, PURPLE_SOFT } = useTheme();
    const list = useMemo(() => drivers.filter((driver) => !query.trim() || driver.name.toLowerCase().includes(query.trim().toLowerCase()) || driver.driverId.toLowerCase().includes(query.trim().toLowerCase()) || driver.phone.includes(query.trim())), [drivers, query]);
    const busFor = (id: string | null) => buses.find((bus) => bus.id === id);

    React.useEffect(() => {
        const onHardwareBack = () => {
            if (adding) { setAdding(false); return true; }
            if (selected) { setSelected(null); return true; }
            return false;
        };
        const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
        return () => sub.remove();
    }, [adding, selected]);

    const [isSaving, setIsSaving] = useState(false);

    const save = async () => {
        if (!form.name.trim() || !form.phone.trim() || !form.license.trim()) {
            return Alert.alert("Missing details", "Driver name, phone number and license number are required.");
        }
        setIsSaving(true);
        const driver: DDriver = {
            id: `d-${Date.now()}`,
            name: form.name.trim(),
            driverId: `DRV${String(drivers.length + 1).padStart(3, "0")}`,
            phone: form.phone.trim(),
            license: form.license.trim().toUpperCase(),
            busId: form.busId,
            status: "Active",
            experience: form.experience.trim() || "New",
            trips: 0,
            rating: 5,
        };

        try {
            const res = await addDriver(driver);
            if (res && !res.success) {
                Alert.alert("Error", res.error || "Failed to add driver to database.");
                setIsSaving(false);
                return;
            }
            setAdding(false);
            if (res?.data) setSelected(res.data);
            else setSelected(driver);
            Alert.alert("Driver added", `${driver.name} is saved and authorized for login.`);
        } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to save driver.");
        } finally {
            setIsSaving(false);
        }
    };

    if (adding) return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: PAGE_BG }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={insets.top}>
            <PageHeader title="Add Driver" subtitle="Driver details and bus assignment" onBack={() => setAdding(false)} topInset={insets.top} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) + insets.bottom }}>
                <Card style={{ gap: ms(13) }}>
                    <Input label="Driver name *" icon="person" value={form.name} onChangeText={(name) => setForm((old) => ({ ...old, name }))} placeholder="e.g. Rahul Verma" autoCapitalize="words" />
                    <Input label="Mobile number *" icon="call" value={form.phone} onChangeText={(phone) => setForm((old) => ({ ...old, phone }))} placeholder="10-digit mobile number" keyboardType="phone-pad" />
                    <Input label="Driving license *" icon="card" value={form.license} onChangeText={(license) => setForm((old) => ({ ...old, license }))} placeholder="e.g. DL-0420110149646" autoCapitalize="characters" />
                    <Input label="Experience" icon="ribbon" value={form.experience} onChangeText={(experience) => setForm((old) => ({ ...old, experience }))} placeholder="e.g. 5 yrs" />
                </Card>
                <SectionTitle icon="bus" title="Assign bus" right={<Chip text={form.busId ? "Selected" : "Optional"} color={form.busId ? GREEN : MUTED} soft={form.busId ? GREEN_SOFT : PAGE_BG} />} />
                <View style={{ gap: ms(8) }}>
                    <Press onPress={() => setForm((old) => ({ ...old, busId: null }))} style={{ padding: ms(12), borderRadius: ms(15), borderWidth: 1.5, borderColor: form.busId === null ? RED : BORDER, backgroundColor: form.busId === null ? RED_SOFT : CARD_BG, flexDirection: "row", alignItems: "center", gap: 9 }}>
                        <Ionicons name="close-circle" size={ms(18)} color={RED} />
                        <Text style={{ flex: 1, fontFamily: FONT.semibold, color: INK }}>Assign later</Text>
                        {form.busId === null && <Ionicons name="checkmark-circle" size={ms(18)} color={RED} />}
                    </Press>
                    {buses.map((bus) => (
                        <Press key={bus.id} onPress={() => setForm((old) => ({ ...old, busId: bus.id }))} style={{ padding: ms(12), borderRadius: ms(15), borderWidth: 1.5, borderColor: form.busId === bus.id ? BLUE : BORDER, backgroundColor: form.busId === bus.id ? BLUE_SOFT : CARD_BG, flexDirection: "row", alignItems: "center", gap: 9 }}>
                            <Ionicons name="bus" size={ms(18)} color={bus.color} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: FONT.semibold, color: INK }}>{bus.number} · {bus.vehicleNumber}</Text>
                                <Text style={{ fontFamily: FONT.regular, color: MUTED, fontSize: ms(11) }}>{bus.route}</Text>
                            </View>
                            {form.busId === bus.id && <Ionicons name="checkmark-circle" size={ms(18)} color={BLUE} />}
                        </Press>
                    ))}
                </View>
                <Press onPress={isSaving ? undefined : save} style={{ height: ms(54), borderRadius: ms(18), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: ms(22), opacity: isSaving ? 0.7 : 1 }}>
                    <Ionicons name={isSaving ? "hourglass" : "person-add"} size={ms(18)} color={INK} />
                    <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>{isSaving ? "Saving to database..." : "Add driver"}</Text>
                </Press>
            </ScrollView>
        </KeyboardAvoidingView>
    );

    if (selected) {
        const bus = busFor(selected.busId);
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title={selected.name} subtitle={selected.driverId} onBack={() => setSelected(null)} topInset={insets.top} right={<Chip text={selected.status} color={GREEN} soft={GREEN_SOFT} />} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }}>
                    <Card>
                        <InfoRow icon="call" label="Phone number" value={selected.phone} color={GREEN} soft={GREEN_SOFT} />
                        <InfoRow icon="card" label="Driving license" value={selected.license} color={BLUE} soft={BLUE_SOFT} />
                        <InfoRow icon="bus" label="Assigned bus" value={bus ? `${bus.number} · ${bus.vehicleNumber}` : "Not assigned"} />
                        <InfoRow icon="ribbon" label="Experience" value={`${selected.experience} · ${selected.trips} trips · ★ ${selected.rating}`} color={PURPLE} soft={PURPLE_SOFT} />
                    </Card>
                    <SectionTitle icon="options" title="Actions" />
                    <View style={{ flexDirection: "row", gap: ms(10) }}>
                        <Press onPress={() => Linking.openURL(`tel:${selected.phone.replace(/\s/g, "")}`)} style={{ width: ms(54), height: ms(54), borderRadius: ms(18), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="call" size={ms(18)} color={GREEN} />
                        </Press>
                        <Press onPress={() => Alert.alert("Live location", `${selected.name}'s assigned trip is being tracked.`)} style={{ flex: 1, height: ms(54), borderRadius: ms(18), backgroundColor: INK, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }}>
                            <Ionicons name="locate" size={ms(17)} color={ACCENT} />
                            <Text style={{ fontFamily: FONT.semibold, color: "#FFFFFF" }}>Live location</Text>
                        </Press>
                        <Press onPress={() => Alert.alert("Remove driver?", `${selected.name} will be removed from the school list.`, [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: async () => { await removeDriver(selected.id); setSelected(null); } }])} style={{ width: ms(54), height: ms(54), borderRadius: ms(18), backgroundColor: RED_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="trash" size={ms(17)} color={RED} />
                        </Press>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return <View style={{ flex: 1, backgroundColor: PAGE_BG }}><PageHeader title="Driver Management" subtitle={`${drivers.length} active drivers`} onBack={onBack} topInset={insets.top} right={<Press onPress={() => { setForm(emptyForm); setAdding(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: INK, borderRadius: 999, paddingHorizontal: ms(12), paddingVertical: ms(8) }}><Ionicons name="add" size={ms(15)} color={ACCENT} /><Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#FFFFFF" }}>Add</Text></Press>} /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }}><View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(14) }}><View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(50), gap: 8 }}><Ionicons name="search" size={ms(16)} color={FAINT} /><TextInput value={query} onChangeText={setQuery} placeholder="Search name, ID or phone" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }} /></View><Press onPress={() => setQuery(query.trim())} style={{ width: ms(50), height: ms(50), borderRadius: ms(16), backgroundColor: INK, alignItems: "center", justifyContent: "center" }}><Ionicons name="search" size={ms(17)} color={ACCENT} /></Press></View>{isLoading ? Array.from({ length: 4 }).map((_, i) => <View key={i} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(11) }}><SkeletonItem height={ms(44)} width={ms(44)} borderRadius={ms(15)} /><View style={{ flex: 1 }}><SkeletonItem height={ms(15)} width="60%" /><SkeletonItem height={ms(12)} width="80%" style={{ marginTop: ms(4) }} /></View><SkeletonItem height={ms(24)} width={ms(60)} borderRadius={999} /></View>) : list.map((driver) => { const bus = busFor(driver.busId); return <Press key={driver.id} onPress={() => setSelected(driver)} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: BORDER, padding: ms(13), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(11) }}><View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={ms(20)} color={GREEN} /></View><View style={{ flex: 1, minWidth: 0 }}><Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: INK }}>{driver.name}</Text><Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{driver.driverId} · {bus ? bus.number : "No bus"} · ★ {driver.rating}</Text></View><Chip text={driver.status} color={driver.status === "Active" ? GREEN : RED} soft={driver.status === "Active" ? GREEN_SOFT : RED_SOFT} /></Press>; })}</ScrollView></View>;
}

function Input({ label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize }: { label: string; icon: keyof typeof Ionicons.glyphMap; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "phone-pad"; autoCapitalize?: "none" | "words" | "characters" }) { const { INK, FAINT, BORDER, isDark } = useTheme(); return <View><Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 6 }}>{label}</Text><View style={{ height: ms(50), borderRadius: ms(14), borderWidth: 1, borderColor: BORDER, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FCFCFD", flexDirection: "row", alignItems: "center", paddingHorizontal: ms(11), gap: 8 }}><Ionicons name={icon} size={ms(16)} color={FAINT} /><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={FAINT} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={{ flex: 1, fontFamily: FONT.regular, color: INK, fontSize: ms(13), paddingVertical: 0 }} /></View></View>; }
