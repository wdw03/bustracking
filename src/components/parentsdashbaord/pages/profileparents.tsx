/* ============================================================================
   PARENT PORTAL — PROFILE (student + parent + contact + settings + logout)
   Copy to: src/components/parentsdashbaord/pages/profileparents.tsx
   ========================================================================== */

import React, { useState } from "react";
import { Alert, Linking, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
    BUS, Chip, FONT, PARENT, Press, STUDENT, SectionTitle, SkeletonItem, VIDEOS, VideoHero,
    ms, useParentData, useSettings, useSubscription, useTheme,
} from "../common";
import { getLiveGPSCoordinates, requestDeviceLocationPermission, requestNotificationPermission } from "../../../services/locationService";

export default function ProfileParentsPage({
    onOpenSubscription,
    onOpenMap,
    onLogout,
}: {
    onOpenSubscription: () => void;
    onOpenMap: () => void;
    onLogout: () => void;
}) {
    const { INK, MUTED, FAINT, BORDER, CARD_BG, PAGE_BG, ACCENT, ACCENT_DEEP, ACCENT_SOFT, GREEN, GREEN_SOFT, BLUE, BLUE_SOFT, RED, RED_SOFT, PURPLE, PURPLE_SOFT, ORANGE, ORANGE_SOFT, isDark } = useTheme();
    const settings = useSettings();
    const sub = useSubscription();
    const { homeAddress, setHomeAddress, setHomeCoordinate, isLoading } = useParentData();
    const [addressDraft, setAddressDraft] = useState(homeAddress);
    const [addressSaved, setAddressSaved] = useState(true);
    const [locating, setLocating] = useState(false);
    const suggestions = [
        { label: "Green Valley Apartments, Sector 62", address: "B-204, Green Valley Apartments, Sector 62, Noida", coordinate: [77.379, 28.6178] as [number, number] },
        { label: "Sector 62 Metro, Noida", address: "Sector 62 Metro Station, Noida", coordinate: [77.374, 28.620] as [number, number] },
        { label: "Fortune School Road, Noida", address: "Fortune School Road, Sector 62, Noida", coordinate: [77.370, 28.623] as [number, number] },
    ];

    const saveAddress = () => {
        const value = addressDraft.trim();
        if (!value) { Alert.alert("Home address required", "Search or type your child's home address first."); return; }
        setHomeAddress(value);
        setAddressSaved(true);
        Alert.alert("Home location saved", "Bus arrival alerts will use this saved location.");
    };

    const useCurrentLocation = async () => {
        setLocating(true);
        try {
            const allowed = await requestDeviceLocationPermission();
            if (!allowed) { Alert.alert("Location permission needed", "Allow location access to set your exact home stop from the map."); return; }
            const location = await getLiveGPSCoordinates();
            setHomeCoordinate([location.longitude, location.latitude]);
            const label = `Current location (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`;
            setAddressDraft(label);
            setHomeAddress(label);
            setAddressSaved(true);
            Alert.alert("Current location saved", "Your child's home stop is now set to this location.");
        } finally {
            setLocating(false);
        }
    };

    const toggleParentNotifications = async () => {
        if (settings.notificationsEnabled) { settings.setNotificationsEnabled(false); return; }
        const granted = await requestNotificationPermission();
        if (granted) settings.setNotificationsEnabled(true);
        else Alert.alert("Notifications permission required", "Allow notifications in system settings for bus arrival alerts.");
    };

    const openPermissionCenter = async () => {
        const location = await requestDeviceLocationPermission();
        const notifications = await requestNotificationPermission();
        Alert.alert("Permission status", `Location: ${location ? "Allowed" : "Not allowed"}\nNotifications: ${notifications ? "Allowed" : "Not allowed"}`, [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Done" }]);
    };

    const callDriver = () => Linking.openURL(`tel:${BUS.driverPhone.replace(/\s/g, "")}`).catch(() => Alert.alert("Call Driver", BUS.driverPhone));
    const info = (title: string, body: string) => Alert.alert(title, body, [{ text: "OK" }]);

    const InfoRow = ({ label, value }: { label: string; value: string }) => (
        <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: ms(7) }}>
            <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(12), color: MUTED }}>{label}</Text>
            <Text numberOfLines={1} style={{ flex: 1.4, fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK, textAlign: "right" }}>{value}</Text>
        </View>
    );

    const SettingRow = ({ icon, color, soft, label, right, onPress }: {
        icon: keyof typeof Ionicons.glyphMap; color: string; soft: string; label: string;
        right?: React.ReactNode; onPress?: () => void;
    }) => (
        <Press onPress={onPress} haptic={!!onPress} style={{ flexDirection: "row", alignItems: "center", gap: ms(11), paddingVertical: ms(10) }}>
            <View style={{ width: ms(36), height: ms(36), borderRadius: ms(13), backgroundColor: soft, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={icon} size={ms(17)} color={color} />
            </View>
            <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>{label}</Text>
            {right ?? <Ionicons name="chevron-forward" size={ms(15)} color={FAINT} />}
        </Press>
    );

    return (
        <ScrollView style={{ flex: 1, backgroundColor: PAGE_BG }} contentContainerStyle={{ padding: ms(16), paddingBottom: ms(110) }} showsVerticalScrollIndicator={false}>
            {/* Video hero with overlay text */}
            <VideoHero
                source={VIDEOS.profile}
                height={150}
                title={isLoading ? "Loading…" : PARENT.name}
                subtitle={isLoading ? "Fetching your profile…" : `${PARENT.relation} of ${STUDENT.name} · ${STUDENT.school}`}
                badge={
                    <Chip
                        text={sub.status === "active" ? `${sub.planName} Plan` : sub.status === "trial" ? `Trial · ${sub.trialDaysLeft}d` : "Expired"}
                        color={sub.status === "expired" ? RED : sub.status === "active" ? GREEN : ACCENT_DEEP}
                        soft={sub.status === "expired" ? RED_SOFT : sub.status === "active" ? GREEN_SOFT : ACCENT_SOFT}
                    />
                }
            />

            {/* Student profile */}
            <SectionTitle icon="school" title="Student Profile" />
            {isLoading ? (
                <View style={{ backgroundColor: CARD_BG, borderRadius: ms(20), borderWidth: 1, borderColor: BORDER, padding: ms(14), gap: ms(10) }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12), marginBottom: ms(4) }}>
                        <SkeletonItem width={ms(52)} height={ms(52)} borderRadius={ms(17)} />
                        <View style={{ flex: 1, gap: ms(6) }}>
                            <SkeletonItem width="60%" height={ms(15)} borderRadius={ms(6)} />
                            <SkeletonItem width="40%" height={ms(11)} borderRadius={ms(4)} />
                        </View>
                    </View>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: ms(5) }}>
                            <SkeletonItem width="35%" height={ms(12)} borderRadius={ms(4)} />
                            <View style={{ flex: 1 }} />
                            <SkeletonItem width="45%" height={ms(12)} borderRadius={ms(4)} />
                        </View>
                    ))}
                </View>
            ) : (
                <View style={{ backgroundColor: CARD_BG, borderRadius: ms(20), borderWidth: 1, borderColor: BORDER, padding: ms(14) }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12), marginBottom: ms(8) }}>
                        <View style={{ width: ms(52), height: ms(52), borderRadius: ms(17), backgroundColor: STUDENT.photoBg, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: "#111827" }}>
                                {STUDENT.name.split(" ").map((n) => n[0]).join("")}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>{STUDENT.name}</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 1 }}>Admission No. {STUDENT.admissionNo}</Text>
                        </View>
                    </View>
                    <InfoRow label="Class / Section" value={`${STUDENT.className} · ${STUDENT.section}`} />
                    <InfoRow label="Roll No." value={STUDENT.rollNo} />
                    <InfoRow label="School" value={STUDENT.school} />
                    <InfoRow label="Assigned Bus" value={`${BUS.number} · ${BUS.vehicleNumber}`} />
                    <InfoRow label="Assigned Driver" value={BUS.driver} />
                    <InfoRow label="Blood Group" value={STUDENT.bloodGroup} />
                </View>
            )}

            {/* Parent info */}
            <SectionTitle icon="person" title="Parent Information" />
            {isLoading ? (
                <View style={{ backgroundColor: CARD_BG, borderRadius: ms(20), borderWidth: 1, borderColor: BORDER, padding: ms(14), gap: ms(10) }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: ms(5) }}>
                            <SkeletonItem width="30%" height={ms(12)} borderRadius={ms(4)} />
                            <View style={{ flex: 1 }} />
                            <SkeletonItem width="50%" height={ms(12)} borderRadius={ms(4)} />
                        </View>
                    ))}
                </View>
            ) : (
                <View style={{ backgroundColor: CARD_BG, borderRadius: ms(20), borderWidth: 1, borderColor: BORDER, padding: ms(14) }}>
                    <InfoRow label="Name" value={PARENT.name} />
                    <InfoRow label="Relation" value={PARENT.relation} />
                    <InfoRow label="Phone" value={PARENT.phone} />
                    <InfoRow label="Email" value={PARENT.email} />
                    <InfoRow label="Home Stop" value={homeAddress} />
                </View>
            )}

            <SectionTitle icon="location" title="Child's Home Location" />
            <View style={{ backgroundColor: CARD_BG, borderRadius: ms(20), borderWidth: 1, borderColor: BORDER, padding: ms(14) }}>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, lineHeight: ms(17), marginBottom: ms(10) }}>
                    Save the exact home stop so the app can show the nearest bus and alert you when it reaches 1 km.
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: ms(8), borderWidth: 1, borderColor: addressSaved ? BORDER : ACCENT_DEEP, borderRadius: ms(14), paddingHorizontal: ms(11), minHeight: ms(46), backgroundColor: isDark ? "#111827" : "#FFFFFF" }}>
                    <Ionicons name="search" size={ms(17)} color={FAINT} />
                    <TextInput
                        value={addressDraft}
                        onChangeText={(value) => { setAddressDraft(value); setAddressSaved(false); }}
                        placeholder="Search home address or landmark"
                        placeholderTextColor={FAINT}
                        style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(12.5), color: INK, paddingVertical: ms(10) }}
                    />
                    {addressDraft.length > 0 ? <Press onPress={() => setAddressDraft("")}><Ionicons name="close-circle" size={ms(17)} color={FAINT} /></Press> : null}
                </View>
                {addressDraft.length > 0 && !addressSaved ? (
                    <View style={{ marginTop: ms(8), gap: ms(6) }}>
                        {suggestions.filter((item) => item.label.toLowerCase().includes(addressDraft.toLowerCase()) || item.address.toLowerCase().includes(addressDraft.toLowerCase())).map((item) => (
                            <Press key={item.label} onPress={() => { setAddressDraft(item.address); setHomeCoordinate(item.coordinate); setAddressSaved(false); }} style={{ flexDirection: "row", alignItems: "center", gap: ms(8), paddingVertical: ms(7) }}>
                                <Ionicons name="location-outline" size={ms(16)} color={BLUE} />
                                <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(11.5), color: INK }}>{item.label}</Text>
                            </Press>
                        ))}
                    </View>
                ) : null}
                <View style={{ flexDirection: "row", gap: ms(8), marginTop: ms(10) }}>
                    <Press onPress={useCurrentLocation} disabled={locating} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: ms(6), borderRadius: ms(13), backgroundColor: BLUE_SOFT, paddingVertical: ms(10), opacity: locating ? 0.6 : 1 }}>
                        <Ionicons name="navigate" size={ms(15)} color={BLUE} />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: BLUE }}>{locating ? "Locating…" : "Use current location"}</Text>
                    </Press>
                    <Press onPress={saveAddress} style={{ flex: 0.72, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: ms(6), borderRadius: ms(13), backgroundColor: ACCENT, paddingVertical: ms(10) }}>
                        <Ionicons name="checkmark" size={ms(15)} color="#111827" />
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: "#111827" }}>Save</Text>
                    </Press>
                </View>
                <Press onPress={onOpenMap} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: ms(7), marginTop: ms(8), borderRadius: ms(13), borderWidth: 1, borderColor: BORDER, paddingVertical: ms(10) }}>
                    <Ionicons name="map" size={ms(15)} color={BLUE} />
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: BLUE }}>Choose exact point on map</Text>
                </Press>
                {addressSaved ? <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: GREEN, marginTop: ms(8) }}>✓ Saved for bus proximity alerts</Text> : null}
            </View>

            {/* Contact center */}
            <SectionTitle icon="call" title="Contact Center" />
            <View style={{ backgroundColor: CARD_BG, borderRadius: ms(20), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), paddingVertical: ms(4) }}>
                <SettingRow icon="call" color={GREEN} soft={GREEN_SOFT} label={`Call Driver · ${BUS.driver}`} onPress={callDriver} />
                <SettingRow icon="business" color={PURPLE} soft={PURPLE_SOFT} label="School Transport Office" onPress={() => info("Transport Office", "+91 120 400 8899\nMon–Sat, 7 AM – 4 PM")} />
                <SettingRow icon="alert-circle" color={RED} soft={RED_SOFT} label="Emergency Contact" onPress={() => info("Emergency", "School emergency helpline:\n+91 120 400 8800 (24x7)")} />
                <SettingRow icon="help-buoy" color={BLUE} soft={BLUE_SOFT} label="Help & Support" onPress={() => info("Help & Support", "support@bustracker.app\nWe reply within 24 hours.")} />
            </View>

            {/* Settings */}
            <SectionTitle icon="settings" title="Settings" />
            <View style={{ backgroundColor: CARD_BG, borderRadius: ms(20), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(14), paddingVertical: ms(4) }}>
                <SettingRow icon="card" color={ACCENT_DEEP} soft={ACCENT_SOFT} label="Manage Subscription" onPress={onOpenSubscription} />
                <SettingRow
                    icon="moon" color={PURPLE} soft={PURPLE_SOFT} label="Dark Mode"
                    right={<Switch value={settings.isDarkMode} onValueChange={settings.setIsDarkMode} trackColor={{ true: ACCENT, false: undefined }} thumbColor="#FFFFFF" />}
                />
                <SettingRow
                    icon="notifications" color={ORANGE} soft={ORANGE_SOFT} label="Notifications"
                    right={<Switch value={settings.notificationsEnabled} onValueChange={toggleParentNotifications} trackColor={{ true: ACCENT, false: undefined }} thumbColor="#FFFFFF" />}
                />
                <SettingRow icon="shield-checkmark" color={GREEN} soft={GREEN_SOFT} label="Permission Center" onPress={openPermissionCenter} />
                <SettingRow icon="key" color={BLUE} soft={BLUE_SOFT} label="Change Password" onPress={() => info("Change Password", "You can update your password from the secure account flow.")} />
                <SettingRow icon="shield-checkmark" color={GREEN} soft={GREEN_SOFT} label="Privacy & Security" onPress={() => info("Privacy & Security", "Your location data is only shared with your school.")} />
                <SettingRow icon="information-circle" color={MUTED} soft={isDark ? "#1F2937" : "#F3F4F6"} label="About App" onPress={() => info("BusTracker", "Version 1.0.0 · Parent Portal")} />
            </View>

            {/* Account Actions */}
            <View style={{ gap: ms(12), marginTop: ms(24) }}>
                {/* Logout */}
                <Press onPress={onLogout} style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: ms(8), backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER,
                    borderRadius: ms(16), paddingVertical: ms(14),
                }}>
                    <Ionicons name="log-out" size={ms(17)} color={INK} />
                    <Text style={{ fontFamily: FONT.display, fontSize: ms(14.5), color: INK }}>Logout</Text>
                </Press>

                {/* Delete Account */}
                <Press onPress={() => Alert.alert(
                    "Delete Account", 
                    "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => { Alert.alert("Request Submitted", "Your account deletion request has been submitted. You will be logged out."); onLogout(); } }
                    ]
                )} style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: ms(8), backgroundColor: RED_SOFT, borderWidth: 1, borderColor: "rgba(220,38,38,0.3)",
                    borderRadius: ms(16), paddingVertical: ms(14),
                }}>
                    <Ionicons name="trash" size={ms(17)} color={RED} />
                    <Text style={{ fontFamily: FONT.display, fontSize: ms(14.5), color: RED }}>Delete Account</Text>
                </Press>
            </View>
        </ScrollView>
    );
}
