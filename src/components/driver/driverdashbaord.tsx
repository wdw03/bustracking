/* ============================================================================
   DRIVER DASHBOARD — BusTracker
   Copy to: src/components/driver/driverdashbaord.tsx

   DEMO ACCOUNT (use on the login page):
     Phone    : 9876543210
     Password : 1234
     Driver   : Rajesh Kumar (DRV001)

   MEDIA PLACEHOLDERS — replace these paths with your real assets:
     PROFILE IMAGE : assets/expo.icon/Assets/driverprofile.png
     BUS IMAGE     : assets/expo.icon/Assets/busimage.png
     MAP PREVIEW   : assets/expo.icon/Assets/mappreview.png

   Fonts: Sora (display) + Inter (body) — same as the auth pages.

   Wire navigation via props:
     <DriverDashboard
        onOpenPersonalDetails={() => navigation.navigate("PersonalDetail")}
        onOpenSchoolDetails={() => navigation.navigate("SchoolDetails")}
        onOpenBusDetails={() => navigation.navigate("BusDetails")}
        onOpenAccountSettings={() => navigation.navigate("AccountSettings")}
        onOpenNotificationSettings={() => navigation.navigate("NotificationSettings")}
        onLogout={() => navigation.replace("Login")}
     />
   ========================================================================== */

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ─────────────────────────── Theme ─────────────────────────── */
const ACCENT = "#FFD500";
const ACCENT_SOFT = "#FFF7CC";
const ACCENT_DEEP = "#B99700";
const INK = "#111827";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER = "#E5E7EB";
const CARD_BG = "#FFFFFF";
const PAGE_BG = "#F8F9FB";
const GREEN = "#16A34A";
const GREEN_SOFT = "#DCFCE7";
const RED = "#DC2626";
const RED_SOFT = "#FEE2E2";
const BLUE = "#2563EB";
const BLUE_SOFT = "#DBEAFE";

const FONT = {
    light: "Inter-Light",
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
    display: "Sora-Bold",
    displayHeavy: "Sora-ExtraBold",
};

const { width } = Dimensions.get("window");
const BASE_WIDTH = 390;
const ms = (size: number) => Math.round((width / BASE_WIDTH) * size);

/* ─────────────────────────── Demo Data ─────────────────────────── */
const DRIVER = {
    name: "Rajesh Kumar",
    driverId: "DRV001",
    phone: "+91 98765 43210",
    school: "Green Valley School",
    // PLACEHOLDER — replace with require("../../assets/expo.icon/Assets/driverprofile.png")
    profileImage: null as any,
};

const BUSES = [
    {
        id: "1",
        number: "DL01AB1234",
        route: "Route A",
        school: "Green Valley School",
        stops: 12,
        students: 34,
        assigned: true,
    },
    {
        id: "2",
        number: "DL01CD5678",
        route: "Route B (backup)",
        school: "Green Valley School",
        stops: 9,
        students: 28,
        assigned: false,
    },
];

/* ─────────────────────────── Props ─────────────────────────── */
type Props = {
    onOpenPersonalDetails?: () => void;
    onOpenSchoolDetails?: () => void;
    onOpenBusDetails?: () => void;
    onOpenAccountSettings?: () => void;
    onOpenNotificationSettings?: () => void;
    onLogout?: () => void;
};

type Tab = "home" | "route" | "notifications" | "profile";

/* ─────────────────────────── Small building blocks ─────────────────────────── */

function IconChip({
    name,
    bg,
    color,
    size = 17,
    box = 36,
}: {
    name: any;
    bg: string;
    color: string;
    size?: number;
    box?: number;
}) {
    return (
        <View
            style={{
                width: ms(box),
                height: ms(box),
                borderRadius: ms(box) * 0.38,
                backgroundColor: bg,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Ionicons name={name} size={ms(size)} color={color} />
        </View>
    );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
    return (
        <View
            style={[
                {
                    backgroundColor: CARD_BG,
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: BORDER,
                    padding: ms(16),
                    shadowColor: "#0F172A",
                    shadowOpacity: 0.05,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 2,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

/* ─────────────────────────── Component ─────────────────────────── */

export default function DriverDashboard({
    onOpenPersonalDetails,
    onOpenSchoolDetails,
    onOpenBusDetails,
    onOpenAccountSettings,
    onOpenNotificationSettings,
    onLogout,
}: Props) {
    const insets = useSafeAreaInsets();

    const [tab, setTab] = useState<Tab>("home");
    const [online, setOnline] = useState(true);
    const [tripActive, setTripActive] = useState(false);
    const [gpsSharing, setGpsSharing] = useState(false);

    /* Trip button pulse while active */
    const pulse = useRef(new Animated.Value(0)).current;
    const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

    const startPulse = useCallback(() => {
        pulseLoop.current = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
        );
        pulseLoop.current.start();
    }, [pulse]);

    const stopPulse = useCallback(() => {
        pulseLoop.current?.stop();
        pulse.setValue(0);
    }, [pulse]);

    const toggleTrip = () => {
        Haptics.notificationAsync(
            tripActive ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success,
        );
        if (tripActive) {
            setTripActive(false);
            setGpsSharing(false);
            stopPulse();
        } else {
            setTripActive(true);
            setGpsSharing(true);
            startPulse();
        }
    };

    const toggleGps = () => {
        Haptics.selectionAsync();
        setGpsSharing((s) => !s);
    };

    const toggleOnline = () => {
        Haptics.selectionAsync();
        setOnline((o) => !o);
    };

    /* Tab switch fade */
    const tabAnim = useRef(new Animated.Value(1)).current;
    const switchTab = (next: Tab) => {
        if (next === tab) return;
        Haptics.selectionAsync();
        Animated.timing(tabAnim, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
            setTab(next);
            Animated.timing(tabAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
        });
    };

    const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

    const notifications = useMemo(
        () => [
            { id: "1", icon: "megaphone-outline", color: BLUE, bg: BLUE_SOFT, title: "Route A timing updated", desc: "Morning pickup moved to 7:10 AM by Green Valley School.", time: "10 min ago" },
            { id: "2", icon: "checkmark-circle-outline", color: GREEN, bg: GREEN_SOFT, title: "Trip completed", desc: "Yesterday's evening trip completed successfully.", time: "1 day ago" },
            { id: "3", icon: "warning-outline", color: "#D97706", bg: "#FEF3C7", title: "Document expiring", desc: "Your license renewal is due in 30 days.", time: "2 days ago" },
        ],
        [],
    );

    /* ─────────────── Screens per tab ─────────────── */

    const renderHome = () => (
        <>
            {/* Assigned bus card */}
            <Card style={{ marginTop: ms(16) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <IconChip name="bus" bg={ACCENT_SOFT} color={ACCENT_DEEP} box={46} size={22} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(16), color: INK }}>{BUSES[0].number}</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(12.5), color: MUTED, marginTop: 2 }}>
                            {BUSES[0].school} · {BUSES[0].route}
                        </Text>
                    </View>
                    <Pressable
                        hitSlop={8}
                        onPress={onOpenBusDetails}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 3,
                            backgroundColor: PAGE_BG,
                            borderRadius: 999,
                            paddingHorizontal: ms(10),
                            paddingVertical: 6,
                            borderWidth: 1,
                            borderColor: BORDER,
                        }}
                    >
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: INK }}>Details</Text>
                        <Ionicons name="chevron-forward" size={ms(12)} color={INK} />
                    </Pressable>
                </View>

                {/* quick stats */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: ms(14) }}>
                    {[
                        { icon: "flag-outline", label: `${BUSES[0].stops} Stops` },
                        { icon: "people-outline", label: `${BUSES[0].students} Students` },
                        { icon: "time-outline", label: "7:10 AM" },
                    ].map((s) => (
                        <View
                            key={s.label}
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 5,
                                backgroundColor: PAGE_BG,
                                borderRadius: 14,
                                paddingVertical: ms(9),
                                borderWidth: 1,
                                borderColor: BORDER,
                            }}
                        >
                            <Ionicons name={s.icon as any} size={ms(13)} color={MUTED} />
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: INK }}>{s.label}</Text>
                        </View>
                    ))}
                </View>
            </Card>

            {/* Start / Stop trip */}
            <Animated.View style={{ transform: [{ scale: tripActive ? pulseScale : 1 }], marginTop: ms(16) }}>
                <Pressable
                    onPress={toggleTrip}
                    accessibilityRole="button"
                    accessibilityLabel={tripActive ? "Stop trip" : "Start trip"}
                    style={({ pressed }) => ({
                        height: ms(62),
                        borderRadius: 22,
                        backgroundColor: tripActive ? RED : ACCENT,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 10,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        shadowColor: tripActive ? RED : ACCENT_DEEP,
                        shadowOpacity: 0.35,
                        shadowRadius: 14,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: 5,
                    })}
                >
                    <View
                        style={{
                            width: ms(34),
                            height: ms(34),
                            borderRadius: 17,
                            backgroundColor: tripActive ? "#FFFFFF22" : "#11182722",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons name={tripActive ? "square" : "play"} size={ms(16)} color={tripActive ? "#FFFFFF" : INK} />
                    </View>
                    <Text
                        style={{
                            fontFamily: FONT.display,
                            fontSize: ms(17),
                            color: tripActive ? "#FFFFFF" : INK,
                            letterSpacing: 0.3,
                        }}
                    >
                        {tripActive ? "Stop Trip" : "Start Trip"}
                    </Text>
                </Pressable>
            </Animated.View>

            {/* Live GPS sharing */}
            <Card style={{ marginTop: ms(16) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <IconChip
                        name="location"
                        bg={gpsSharing ? GREEN_SOFT : PAGE_BG}
                        color={gpsSharing ? GREEN : FAINT}
                        box={44}
                        size={20}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14.5), color: INK }}>Live GPS Location Sharing</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: gpsSharing ? GREEN : MUTED, marginTop: 2 }}>
                            {gpsSharing ? "Sharing live location with parents & school" : "Location sharing is off"}
                        </Text>
                    </View>
                    {/* custom switch */}
                    <Pressable
                        onPress={toggleGps}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: gpsSharing }}
                        style={{
                            width: ms(52),
                            height: ms(30),
                            borderRadius: 15,
                            backgroundColor: gpsSharing ? GREEN : "#D1D5DB",
                            justifyContent: "center",
                            paddingHorizontal: 3,
                        }}
                    >
                        <View
                            style={{
                                width: ms(24),
                                height: ms(24),
                                borderRadius: 12,
                                backgroundColor: "#FFFFFF",
                                alignSelf: gpsSharing ? "flex-end" : "flex-start",
                                shadowColor: "#000",
                                shadowOpacity: 0.15,
                                shadowRadius: 3,
                                shadowOffset: { width: 0, height: 1 },
                                elevation: 2,
                            }}
                        />
                    </Pressable>
                </View>

                {/* Map preview placeholder */}
                <View
                    style={{
                        marginTop: ms(14),
                        height: ms(120),
                        borderRadius: 16,
                        backgroundColor: PAGE_BG,
                        borderWidth: 1,
                        borderColor: BORDER,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}
                >
                    {/* PLACEHOLDER — replace with your map preview image or live MapView:
                        <Image source={require("../../assets/expo.icon/Assets/mappreview.png")} style={{width:"100%",height:"100%"}} resizeMode="cover" /> */}
                    <Ionicons name="map-outline" size={ms(28)} color={FAINT} />
                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: FAINT, marginTop: 4 }}>
                        Map preview — add MapView or image here
                    </Text>
                </View>
            </Card>

            {/* My buses list */}
            <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: ms(20), marginBottom: ms(10) }}>
                My Buses
            </Text>
            {BUSES.map((bus) => (
                <Card key={bus.id} style={{ marginBottom: ms(10), padding: ms(13) }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <IconChip
                            name="bus-outline"
                            bg={bus.assigned ? ACCENT_SOFT : PAGE_BG}
                            color={bus.assigned ? ACCENT_DEEP : FAINT}
                            box={40}
                            size={18}
                        />
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color: INK }}>{bus.number}</Text>
                                {bus.assigned && (
                                    <View style={{ backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10), color: GREEN }}>ASSIGNED</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED, marginTop: 2 }}>
                                {bus.route} · {bus.stops} stops · {bus.students} students
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={ms(16)} color={FAINT} />
                    </View>
                </Card>
            ))}
        </>
    );

    const renderRoute = () => (
        <>
            <Card style={{ marginTop: ms(16) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <IconChip name="map" bg={BLUE_SOFT} color={BLUE} box={44} size={20} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>Route A — Morning</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED, marginTop: 2 }}>
                            {BUSES[0].number} · {BUSES[0].stops} stops
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        marginTop: ms(14),
                        height: ms(170),
                        borderRadius: 16,
                        backgroundColor: PAGE_BG,
                        borderWidth: 1,
                        borderColor: BORDER,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* PLACEHOLDER — put your MapView / route map image here */}
                    <Ionicons name="navigate-outline" size={ms(30)} color={FAINT} />
                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: FAINT, marginTop: 4 }}>
                        Route map — add MapView here
                    </Text>
                </View>
            </Card>

            <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: ms(20), marginBottom: ms(10) }}>
                Stops
            </Text>
            {[
                { name: "Sector 12 Market", time: "7:10 AM", done: true },
                { name: "Rose Garden Gate 2", time: "7:18 AM", done: true },
                { name: "Metro Station East", time: "7:26 AM", done: false },
                { name: "Lake View Apartments", time: "7:34 AM", done: false },
                { name: "Green Valley School", time: "7:50 AM", done: false },
            ].map((stop, i, arr) => (
                <View key={stop.name} style={{ flexDirection: "row", gap: 12 }}>
                    {/* timeline */}
                    <View style={{ alignItems: "center", width: ms(22) }}>
                        <View
                            style={{
                                width: ms(14),
                                height: ms(14),
                                borderRadius: 7,
                                backgroundColor: stop.done ? GREEN : "#FFFFFF",
                                borderWidth: 2,
                                borderColor: stop.done ? GREEN : BORDER,
                                marginTop: 4,
                            }}
                        />
                        {i < arr.length - 1 && (
                            <View style={{ width: 2, flex: 1, backgroundColor: stop.done ? GREEN : BORDER, marginVertical: 2 }} />
                        )}
                    </View>
                    <Card style={{ flex: 1, marginBottom: ms(10), padding: ms(12) }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>{stop.name}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED, marginTop: 1 }}>
                                    Pickup {stop.time}
                                </Text>
                            </View>
                            {stop.done ? (
                                <Ionicons name="checkmark-circle" size={ms(19)} color={GREEN} />
                            ) : (
                                <Ionicons name="ellipse-outline" size={ms(19)} color={FAINT} />
                            )}
                        </View>
                    </Card>
                </View>
            ))}
        </>
    );

    const renderNotifications = () => (
        <>
            <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK, marginTop: ms(16), marginBottom: ms(10) }}>
                Recent
            </Text>
            {notifications.map((n) => (
                <Card key={n.id} style={{ marginBottom: ms(10), padding: ms(13) }}>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        <IconChip name={n.icon} bg={n.bg} color={n.color} box={40} size={18} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: INK }}>{n.title}</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED, marginTop: 2, lineHeight: ms(17) }}>
                                {n.desc}
                            </Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT, marginTop: 4 }}>{n.time}</Text>
                        </View>
                    </View>
                </Card>
            ))}
            <Pressable
                onPress={onOpenNotificationSettings}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: ms(6) }}
            >
                <Ionicons name="options-outline" size={ms(14)} color={ACCENT_DEEP} />
                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: ACCENT_DEEP }}>Notification Settings</Text>
            </Pressable>
        </>
    );

    const profileMenu = [
        { icon: "person-outline", label: "Personal Details", onPress: onOpenPersonalDetails, bg: BLUE_SOFT, color: BLUE },
        { icon: "school-outline", label: "School Details", onPress: onOpenSchoolDetails, bg: "#FEF3C7", color: "#D97706" },
        { icon: "bus-outline", label: "Bus Details", onPress: onOpenBusDetails, bg: GREEN_SOFT, color: GREEN },
        { icon: "settings-outline", label: "Account Settings", onPress: onOpenAccountSettings, bg: "#F3E8FF", color: "#7C3AED" },
    ];

    const renderProfile = () => (
        <>
            {/* Profile header card */}
            <Card style={{ marginTop: ms(16), alignItems: "center", paddingVertical: ms(22) }}>
                <View
                    style={{
                        width: ms(88),
                        height: ms(88),
                        borderRadius: ms(30),
                        backgroundColor: ACCENT_SOFT,
                        borderWidth: 2,
                        borderColor: ACCENT,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}
                >
                    {DRIVER.profileImage ? (
                        <Image source={DRIVER.profileImage} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                        /* PLACEHOLDER — replace DRIVER.profileImage with require("...driverprofile.png") */
                        <Ionicons name="person" size={ms(40)} color={ACCENT_DEEP} />
                    )}
                </View>
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK, marginTop: ms(12) }}>
                    {DRIVER.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <View style={{ backgroundColor: ACCENT_SOFT, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: ACCENT_DEEP }}>Driver</Text>
                    </View>
                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED }}>{DRIVER.school}</Text>
                </View>
            </Card>

            {/* Menu */}
            <Card style={{ marginTop: ms(16), padding: ms(6) }}>
                {profileMenu.map((item, i) => (
                    <Pressable
                        key={item.label}
                        onPress={() => {
                            Haptics.selectionAsync();
                            item.onPress?.();
                        }}
                        accessibilityRole="button"
                        style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            paddingVertical: ms(13),
                            paddingHorizontal: ms(10),
                            backgroundColor: pressed ? PAGE_BG : "transparent",
                            borderRadius: 16,
                            borderBottomWidth: i < profileMenu.length - 1 ? 1 : 0,
                            borderBottomColor: "#F3F4F6",
                        })}
                    >
                        <IconChip name={item.icon} bg={item.bg} color={item.color} box={38} size={17} />
                        <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(14), color: INK }}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={ms(16)} color={FAINT} />
                    </Pressable>
                ))}
            </Card>

            <Text style={{ textAlign: "center", fontFamily: FONT.regular, fontSize: ms(11), color: FAINT, marginTop: ms(18) }}>
                Version 1.0.0
            </Text>
        </>
    );

    /* ─────────────── Header ─────────────── */
    const headerTitle =
        tab === "home" ? null : tab === "route" ? "Route" : tab === "notifications" ? "Notifications" : "Profile";

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            {/* Curved accent header backdrop */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -ms(120),
                    left: -ms(40),
                    right: -ms(40),
                    height: ms(260) + insets.top,
                    backgroundColor: ACCENT,
                    borderBottomLeftRadius: ms(90),
                    borderBottomRightRadius: ms(90),
                }}
            />
            {/* soft echo curve */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: ms(120) + insets.top,
                    right: -ms(30),
                    width: ms(90),
                    height: ms(90),
                    borderRadius: ms(45),
                    backgroundColor: ACCENT_SOFT,
                    opacity: 0.5,
                }}
            />

            {/* ── Header ── */}
            <View style={{ paddingTop: insets.top + ms(10), paddingHorizontal: ms(20) }}>
                {tab === "home" ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        {/* avatar */}
                        <View
                            style={{
                                width: ms(48),
                                height: ms(48),
                                borderRadius: ms(17),
                                backgroundColor: "#FFFFFF",
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 2,
                                borderColor: "#11182715",
                                overflow: "hidden",
                            }}
                        >
                            {DRIVER.profileImage ? (
                                <Image source={DRIVER.profileImage} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                            ) : (
                                <Ionicons name="person" size={ms(22)} color={ACCENT_DEEP} />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(17), color: INK }}>{DRIVER.name}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: "#7A6A00" }}>
                                    Driver ID: {DRIVER.driverId}
                                </Text>
                                {/* online pill */}
                                <Pressable
                                    onPress={toggleOnline}
                                    accessibilityRole="switch"
                                    accessibilityState={{ checked: online }}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 4,
                                        backgroundColor: online ? GREEN_SOFT : "#F3F4F6",
                                        borderRadius: 999,
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 7,
                                            height: 7,
                                            borderRadius: 4,
                                            backgroundColor: online ? GREEN : FAINT,
                                        }}
                                    />
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(10.5), color: online ? GREEN : MUTED }}>
                                        {online ? "Online" : "Offline"}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                        {/* bell */}
                        <Pressable
                            onPress={() => switchTab("notifications")}
                            accessibilityLabel="Notifications"
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
                            <Ionicons name="notifications-outline" size={ms(19)} color={INK} />
                            {/* badge */}
                            <View
                                style={{
                                    position: "absolute",
                                    top: ms(9),
                                    right: ms(10),
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: RED,
                                    borderWidth: 1.5,
                                    borderColor: "#FFFFFF",
                                }}
                            />
                        </Pressable>
                    </View>
                ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Pressable
                            onPress={() => switchTab("home")}
                            accessibilityLabel="Back to home"
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
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: INK }}>{headerTitle}</Text>
                    </View>
                )}
            </View>

            {/* ── Content ── */}
            <Animated.View style={{ flex: 1, opacity: tabAnim }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: ms(20),
                        paddingBottom: ms(100) + insets.bottom,
                        paddingTop: ms(6),
                    }}
                >
                    {tab === "home" && renderHome()}
                    {tab === "route" && renderRoute()}
                    {tab === "notifications" && renderNotifications()}
                    {tab === "profile" && renderProfile()}
                </ScrollView>
            </Animated.View>

            {/* ── Bottom navigation ── */}
            <View
                style={{
                    position: "absolute",
                    left: ms(16),
                    right: ms(16),
                    bottom: Math.max(insets.bottom, ms(12)),
                    backgroundColor: "#FFFFFF",
                    borderRadius: 26,
                    flexDirection: "row",
                    paddingVertical: ms(10),
                    paddingHorizontal: ms(8),
                    shadowColor: "#0F172A",
                    shadowOpacity: 0.12,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: "#F3F4F6",
                }}
            >
                {(
                    [
                        { key: "home", icon: "home", iconOutline: "home-outline", label: "Home" },
                        { key: "route", icon: "map", iconOutline: "map-outline", label: "Route" },
                        { key: "notifications", icon: "notifications", iconOutline: "notifications-outline", label: "Alerts" },
                        { key: "profile", icon: "person", iconOutline: "person-outline", label: "Profile" },
                    ] as { key: Tab; icon: any; iconOutline: any; label: string }[]
                ).map((t) => {
                    const active = tab === t.key;
                    return (
                        <Pressable
                            key={t.key}
                            onPress={() => switchTab(t.key)}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: active }}
                            style={{ flex: 1, alignItems: "center", gap: 3 }}
                        >
                            <View
                                style={{
                                    width: ms(44),
                                    height: ms(30),
                                    borderRadius: 999,
                                    backgroundColor: active ? ACCENT_SOFT : "transparent",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons
                                    name={active ? t.icon : t.iconOutline}
                                    size={ms(19)}
                                    color={active ? ACCENT_DEEP : FAINT}
                                />
                            </View>
                            <Text
                                style={{
                                    fontFamily: active ? FONT.semibold : FONT.regular,
                                    fontSize: ms(10.5),
                                    color: active ? INK : FAINT,
                                }}
                            >
                                {t.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
