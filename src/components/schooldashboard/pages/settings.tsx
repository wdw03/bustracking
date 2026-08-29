import React, { useState } from "react";
import { Alert, Linking, Modal, ScrollView, Text, TextInput, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import { requestDeviceLocationPermission, requestNotificationPermission } from "../../../services/locationService";

import {
    Card, FONT, InfoRow, PageHeader, Press,
    SCHOOL, SectionTitle, ms, useTheme, useSettings, useSchoolData
} from "../common";

const SCHOOL_VIDEO = require("../../../../assets/expo.icon/Assets/school-animation-gif-download-7813556.mp4");

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    const { ACCENT } = useTheme();
    return (
        <Press haptic onPress={onToggle} style={{ width: ms(46), height: ms(27), borderRadius: 999, backgroundColor: on ? ACCENT : "#E5E7EB", padding: 3, alignItems: on ? "flex-end" : "flex-start", justifyContent: "center" }}>
            <View style={{ width: ms(21), height: ms(21), borderRadius: 999, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} />
        </Press>
    );
}

export default function SettingsPage({ onBack, onLogout, onOpenLocationPicker }: { onBack: () => void; onLogout?: () => void; onOpenLocationPicker?: () => void }) {
    const insets = useSafeAreaInsets();
    const { isDarkMode, setIsDarkMode, gpsEnabled, setGpsEnabled, notificationsEnabled, setNotificationsEnabled, schoolAddress, setSchoolAddress } = useSettings();
    const { INK, PAGE_BG, MUTED, ACCENT_SOFT, ACCENT_DEEP, BLUE, BLUE_SOFT, GREEN, GREEN_SOFT, ORANGE, ORANGE_SOFT, RED, RED_SOFT, PURPLE, PURPLE_SOFT, FAINT, BORDER, CARD_BG } = useTheme();
    const { schoolProfile, updateSchoolProfile } = useSchoolData();

    // Edit modal states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editName, setEditName] = useState(schoolProfile.name || SCHOOL.name);
    const [editPrincipal, setEditPrincipal] = useState(schoolProfile.principal || SCHOOL.principal);
    const [editEmail, setEditEmail] = useState(schoolProfile.email || SCHOOL.email);
    const [editAddress, setEditAddress] = useState(schoolProfile.address || schoolAddress);
    const [editCity, setEditCity] = useState(schoolProfile.city || "");
    const [editState, setEditState] = useState(schoolProfile.state || "");
    const [editPincode, setEditPincode] = useState(schoolProfile.pincode || "");
    const [editGst, setEditGst] = useState(schoolProfile.gstNumber || "");
    const [editWebsite, setEditWebsite] = useState(schoolProfile.website || "");

    const player = useVideoPlayer(SCHOOL_VIDEO, (p) => { p.loop = true; p.muted = true; p.play(); });
    const act = (label: string) => Alert.alert(label, "Your school settings have been updated.", [{ text: "OK" }]);

    const openEditModal = () => {
        setEditName(schoolProfile.name || SCHOOL.name);
        setEditPrincipal(schoolProfile.principal || SCHOOL.principal);
        setEditEmail(schoolProfile.email || SCHOOL.email);
        setEditAddress(schoolProfile.address || schoolAddress);
        setEditCity(schoolProfile.city || "");
        setEditState(schoolProfile.state || "");
        setEditPincode(schoolProfile.pincode || "");
        setEditGst(schoolProfile.gstNumber || "");
        setEditWebsite(schoolProfile.website || "");
        setIsEditOpen(true);
    };

    const handleSaveSchoolDetails = async () => {
        if (!editName.trim()) {
            Alert.alert("Required Field", "Please enter school name.");
            return;
        }
        setIsSaving(true);
        try {
            const res = await updateSchoolProfile({
                name: editName.trim(),
                principal: editPrincipal.trim(),
                email: editEmail.trim(),
                address: editAddress.trim(),
                city: editCity.trim(),
                state: editState.trim(),
                pincode: editPincode.trim(),
                gstNumber: editGst.trim(),
                website: editWebsite.trim(),
            });

            if (res.success) {
                if (editAddress.trim()) setSchoolAddress(editAddress.trim());
                setIsEditOpen(false);
                Alert.alert("Success ✅", "School details updated successfully!");
            } else {
                Alert.alert("Update Failed", res.error || "Failed to save changes. Please try again.");
            }
        } catch (e: any) {
            Alert.alert("Error", e?.message || "An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleNotifications = async () => {
        if (notificationsEnabled) { setNotificationsEnabled(false); return; }
        const granted = await requestNotificationPermission();
        if (granted) setNotificationsEnabled(true);
        else Alert.alert("Notifications permission required", "Allow notifications in system settings to receive bus and emergency alerts.", [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Cancel", style: "cancel" }]);
    };

    const toggleGPS = async () => {
        if (gpsEnabled) { setGpsEnabled(false); return; }
        const granted = await requestDeviceLocationPermission();
        if (granted) setGpsEnabled(true);
        else Alert.alert("Location permission required", "Allow precise location access to monitor live bus locations.", [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Cancel", style: "cancel" }]);
    };

    const openPermissions = async () => {
        const location = await requestDeviceLocationPermission();
        const notifications = await requestNotificationPermission();
        Alert.alert("Permission status", `Location: ${location ? "Allowed" : "Not allowed"}\nNotifications: ${notifications ? "Allowed" : "Not allowed"}`, [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Done" }]);
    };

    const logout = () =>
        Alert.alert("Logout?", "You will need to log in again.", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: () => onLogout?.() },
        ]);

    const deleteAccount = () =>
        Alert.alert("Delete Account?", "This permanently deletes the school account and ALL data — buses, drivers, students, parents. This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Continue",
                style: "destructive",
                onPress: () =>
                    Alert.alert("Are you absolutely sure?", 'Tap "Delete Forever" to confirm this action.', [
                        { text: "Keep Account", style: "cancel" },
                        { text: "Delete Forever", style: "destructive", onPress: () => act("Account Deletion Requested") },
                    ]),
            },
        ]);

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Settings" subtitle="School profile & preferences" onBack={onBack} topInset={insets.top} />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                {/* School profile card */}
                <Card style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                    <View style={{ width: ms(60), height: ms(60), borderRadius: ms(20), overflow: "hidden", backgroundColor: ACCENT_SOFT }}>
                        <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls={false} contentFit="cover" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>{schoolProfile.name || SCHOOL.name}</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{schoolProfile.code || SCHOOL.code}</Text>
                    </View>
                    <Press onPress={() => act("Change Logo")} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: ACCENT_SOFT, borderRadius: 999, paddingHorizontal: ms(11), paddingVertical: ms(7) }}>
                        <Ionicons name="camera" size={ms(13)} color={ACCENT_DEEP} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: ACCENT_DEEP }}>Logo</Text>
                    </Press>
                </Card>

                <SectionTitle icon="business" title="School Details" right={
                    <Press onPress={openEditModal}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: ACCENT_DEEP }}>Edit Details</Text>
                    </Press>
                } />
                <Card>
                    <InfoRow icon="school" label="School Name" value={schoolProfile.name || SCHOOL.name} color={PURPLE} soft={PURPLE_SOFT} />
                    <InfoRow icon="person" label="Principal Name" value={schoolProfile.principal || SCHOOL.principal} color={BLUE} soft={BLUE_SOFT} />
                    <InfoRow icon="call" label="Phone" value={schoolProfile.phone || SCHOOL.phone} color={GREEN} soft={GREEN_SOFT} />
                    <InfoRow icon="mail" label="Email" value={schoolProfile.email || SCHOOL.email} color={ORANGE} soft={ORANGE_SOFT} />
                    <InfoRow icon="location" label="Address" value={schoolProfile.address && schoolProfile.address !== "—" ? schoolProfile.address : schoolAddress} color={RED} soft={RED_SOFT} />
                    {schoolProfile.city && schoolProfile.city !== "—" ? <InfoRow icon="business" label="City / State" value={`${schoolProfile.city}${schoolProfile.state ? `, ${schoolProfile.state}` : ""}`} color={BLUE} soft={BLUE_SOFT} /> : null}
                    <Press onPress={onOpenLocationPicker} style={{ marginTop: ms(8), height: ms(44), borderRadius: ms(14), backgroundColor: BLUE_SOFT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: ms(7) }}><Ionicons name="map" size={ms(16)} color={BLUE} /><Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: BLUE }}>Choose exact school point on map</Text></Press>
                </Card>

                <SectionTitle icon="options" title="Preferences" />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    {[
                        { icon: "moon" as const, label: "Dark Mode", desc: "Enable dark theme", color: PURPLE, soft: PURPLE_SOFT, right: <Toggle on={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} /> },
                        { icon: "notifications" as const, label: "Notifications", desc: "Push alerts & emails", color: RED, soft: RED_SOFT, right: <Toggle on={notificationsEnabled} onToggle={toggleNotifications} /> },
                        { icon: "locate" as const, label: "GPS Settings", desc: "Live tracking for all buses", color: BLUE, soft: BLUE_SOFT, right: <Toggle on={gpsEnabled} onToggle={toggleGPS} /> },
                        { icon: "language" as const, label: "Language", desc: "English (India)", color: GREEN, soft: GREEN_SOFT, right: <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />, fn: () => act("Language") },
                        { icon: "shield-checkmark" as const, label: "Permissions", desc: "Location, notifications, contacts", color: ORANGE, soft: ORANGE_SOFT, right: <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />, fn: openPermissions },
                        { icon: "key" as const, label: "Change Password", desc: "Update your admin password", color: ACCENT_DEEP, soft: ACCENT_SOFT, right: <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />, fn: () => act("Change Password") },
                    ].map((r, i) => (
                        <Press key={r.label} onPress={r.fn ?? (() => { })} style={{ flexDirection: "row", alignItems: "center", gap: ms(11), padding: ms(13), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER }}>
                            <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: r.soft, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={r.icon} size={ms(16)} color={r.color} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>{r.label}</Text>
                                <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED }}>{r.desc}</Text>
                            </View>
                            {r.right}
                        </Press>
                    ))}
                </Card>

                <SectionTitle icon="alert-circle" title="Account" />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    <Press onPress={logout} style={{ flexDirection: "row", alignItems: "center", gap: ms(11), padding: ms(13) }}>
                        <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="log-out" size={ms(16)} color={ORANGE} />
                        </View>
                        <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>Logout</Text>
                        <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />
                    </Press>
                    <Press onPress={deleteAccount} style={{ flexDirection: "row", alignItems: "center", gap: ms(11), padding: ms(13), borderTopWidth: 1, borderTopColor: BORDER }}>
                        <View style={{ width: ms(36), height: ms(36), borderRadius: ms(12), backgroundColor: RED_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="trash" size={ms(16)} color={RED} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: RED }}>Delete Account</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED }}>Permanently remove school & all data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />
                    </Press>
                </Card>

                <Text style={{ textAlign: "center", fontFamily: FONT.regular, fontSize: ms(11), color: FAINT, marginTop: ms(18) }}>
                    BusTracker · Version 1.0.0
                </Text>
            </ScrollView>

            {/* Edit School Details Modal */}
            <Modal visible={isEditOpen} transparent animationType="slide" onRequestClose={() => setIsEditOpen(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
                    <View style={{ backgroundColor: CARD_BG, borderTopLeftRadius: ms(26), borderTopRightRadius: ms(26), padding: ms(20), maxHeight: "90%", paddingBottom: Math.max(insets.bottom, ms(20)) }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: ms(14) }}>
                            <View>
                                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: INK }}>Edit School Details</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: MUTED }}>Update school information</Text>
                            </View>
                            <Press onPress={() => setIsEditOpen(false)} style={{ width: ms(32), height: ms(32), borderRadius: 99, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="close" size={ms(18)} color={INK} />
                            </Press>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: ms(12), paddingBottom: ms(16) }}>
                            {/* LOCKED Phone Field */}
                            <View style={{ backgroundColor: "#F8FAFC", borderRadius: ms(14), padding: ms(12), borderWidth: 1, borderColor: BORDER }}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>Registered Contact Number</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: GREEN_SOFT, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 }}>
                                        <Ionicons name="lock-closed" size={10} color={GREEN} />
                                        <Text style={{ fontFamily: FONT.semibold, fontSize: 10, color: GREEN }}>Locked & Verified</Text>
                                    </View>
                                </View>
                                <Text style={{ fontFamily: FONT.display, fontSize: ms(14), color: INK, marginTop: 4 }}>{schoolProfile.phone || SCHOOL.phone}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(10), color: MUTED, marginTop: 2 }}>
                                    Your registered contact mobile number cannot be changed as it is linked to your authentication.
                                </Text>
                            </View>

                            {/* School Name */}
                            <View>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 4 }}>School Name *</Text>
                                <TextInput
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Enter school name"
                                    placeholderTextColor={FAINT}
                                    style={{ backgroundColor: "#F9FAFB", borderRadius: ms(12), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), height: ms(44), fontFamily: FONT.regular, fontSize: ms(13), color: INK }}
                                />
                            </View>

                            {/* Principal Name */}
                            <View>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 4 }}>Principal / Administrator Name</Text>
                                <TextInput
                                    value={editPrincipal}
                                    onChangeText={setEditPrincipal}
                                    placeholder="Enter principal full name"
                                    placeholderTextColor={FAINT}
                                    style={{ backgroundColor: "#F9FAFB", borderRadius: ms(12), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), height: ms(44), fontFamily: FONT.regular, fontSize: ms(13), color: INK }}
                                />
                            </View>

                            {/* School Email */}
                            <View>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 4 }}>Official Email</Text>
                                <TextInput
                                    value={editEmail}
                                    onChangeText={setEditEmail}
                                    placeholder="school@example.com"
                                    placeholderTextColor={FAINT}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={{ backgroundColor: "#F9FAFB", borderRadius: ms(12), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), height: ms(44), fontFamily: FONT.regular, fontSize: ms(13), color: INK }}
                                />
                            </View>

                            {/* Campus Address */}
                            <View>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 4 }}>Campus Address</Text>
                                <TextInput
                                    value={editAddress}
                                    onChangeText={setEditAddress}
                                    placeholder="Street, locality, landmark"
                                    placeholderTextColor={FAINT}
                                    style={{ backgroundColor: "#F9FAFB", borderRadius: ms(12), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), height: ms(44), fontFamily: FONT.regular, fontSize: ms(13), color: INK }}
                                />
                            </View>

                            {/* City & State */}
                            <View style={{ flexDirection: "row", gap: ms(10) }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 4 }}>City</Text>
                                    <TextInput
                                        value={editCity}
                                        onChangeText={setEditCity}
                                        placeholder="City"
                                        placeholderTextColor={FAINT}
                                        style={{ backgroundColor: "#F9FAFB", borderRadius: ms(12), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), height: ms(44), fontFamily: FONT.regular, fontSize: ms(13), color: INK }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 4 }}>State</Text>
                                    <TextInput
                                        value={editState}
                                        onChangeText={setEditState}
                                        placeholder="State"
                                        placeholderTextColor={FAINT}
                                        style={{ backgroundColor: "#F9FAFB", borderRadius: ms(12), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), height: ms(44), fontFamily: FONT.regular, fontSize: ms(13), color: INK }}
                                    />
                                </View>
                            </View>

                            {/* Pincode & GST */}
                            <View style={{ flexDirection: "row", gap: ms(10) }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 4 }}>Postal Pincode</Text>
                                    <TextInput
                                        value={editPincode}
                                        onChangeText={setEditPincode}
                                        placeholder="6-digit PIN"
                                        placeholderTextColor={FAINT}
                                        keyboardType="numeric"
                                        maxLength={6}
                                        style={{ backgroundColor: "#F9FAFB", borderRadius: ms(12), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), height: ms(44), fontFamily: FONT.regular, fontSize: ms(13), color: INK }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 4 }}>GST / Affiliation</Text>
                                    <TextInput
                                        value={editGst}
                                        onChangeText={setEditGst}
                                        placeholder="GSTIN or Affiliation"
                                        placeholderTextColor={FAINT}
                                        style={{ backgroundColor: "#F9FAFB", borderRadius: ms(12), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), height: ms(44), fontFamily: FONT.regular, fontSize: ms(13), color: INK }}
                                    />
                                </View>
                            </View>

                            {/* Website */}
                            <View>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 4 }}>Website</Text>
                                <TextInput
                                    value={editWebsite}
                                    onChangeText={setEditWebsite}
                                    placeholder="https://myschool.edu.in"
                                    placeholderTextColor={FAINT}
                                    keyboardType="url"
                                    autoCapitalize="none"
                                    style={{ backgroundColor: "#F9FAFB", borderRadius: ms(12), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), height: ms(44), fontFamily: FONT.regular, fontSize: ms(13), color: INK }}
                                />
                            </View>

                            {/* Action Buttons */}
                            <View style={{ flexDirection: "row", gap: ms(10), marginTop: ms(10) }}>
                                <Press
                                    onPress={() => setIsEditOpen(false)}
                                    style={{ flex: 1, height: ms(46), borderRadius: ms(14), borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}
                                >
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: MUTED }}>Cancel</Text>
                                </Press>
                                <Press
                                    disabled={isSaving}
                                    onPress={handleSaveSchoolDetails}
                                    style={{ flex: 1.6, height: ms(46), borderRadius: ms(14), backgroundColor: "#FFD500", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}
                                >
                                    {isSaving ? <ActivityIndicator size="small" color="#111827" /> : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={ms(17)} color="#111827" />
                                            <Text style={{ fontFamily: FONT.display, fontSize: ms(13), color: "#111827" }}>Save Changes</Text>
                                        </>
                                    )}
                                </Press>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
