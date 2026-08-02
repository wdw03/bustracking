import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    Pressable,
    ScrollView,
    Image,
    useWindowDimensions,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    withSequence,
    withRepeat,
    interpolate,
    interpolateColor,
    Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { VideoView, useVideoPlayer } from "expo-video";

/* ─────────────────────────── Design Tokens ─────────────────────────── */
const ACCENT = "#FFD60A";
const ACCENT_SOFT = "#FFF6CC";
const ACCENT_GLOW = "#FFFBEB";
const ACCENT_DEEP = "#E6BC00";
const INK = "#101010";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER_IDLE = "#EAECEF";
const BG_CARD_IDLE = "#FAFAFC";
const SUCCESS = "#16A34A";

/* ─────────────────────────── Fonts ─────────────────────────── */
const FONT = {
    light: "Inter-Light",
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
    display: "Sora-Bold",
    displayHeavy: "Sora-ExtraBold",
};

/* ─────────────────────────── Assets ─────────────────────────── */
const HERO_VIDEO = require("../../assets/expo.icon/Assets/man-stands-near-signpost-and-chooses-travel-route-in-mountains-animation-gif-download-7382412.mp4");
const PARENT_ICON = require("../../assets/expo.icon/Assets/parentsicons.png");
const DRIVER_ICON = require("../../assets/expo.icon/Assets/schoolbusdriverimg.png");
const SCHOOL_ICON = require("../../assets/expo.icon/Assets/schoolicons.png");

/* ─────────────────────────── Roles Data ─────────────────────────── */
export type SignupRole = "parent" | "driver" | "school";

const ROLES: {
    key: SignupRole;
    title: string;
    subtitle: string;
    icon: any;
    badgeIcon: keyof typeof Ionicons.glyphMap;
    badgeLabel: string;
}[] = [
        {
            key: "parent",
            title: "Parent",
            subtitle: "Track your child's bus in real-time & get instant arrival alerts",
            icon: PARENT_ICON,
            badgeIcon: "heart",
            badgeLabel: "Family Safety",
        },
        {
            key: "driver",
            title: "Driver",
            subtitle: "Share live route location & manage student pickups effortlessly",
            icon: DRIVER_ICON,
            badgeIcon: "navigate",
            badgeLabel: "Live Route",
        },
        {
            key: "school",
            title: "School Admin",
            subtitle: "Centralized fleet management, driver logs & student tracking",
            icon: SCHOOL_ICON,
            badgeIcon: "school",
            badgeLabel: "Dashboard",
        },
    ];

type SignupRolePageProps = {
    onSelectRole?: (role: SignupRole) => void;
    onLogin?: () => void;
};

/* ═══════════════════════════ Premium Role Card ═══════════════════════════ */
function RoleCard({
    role,
    index,
    selected,
    onPress,
    ms,
}: {
    role: (typeof ROLES)[number];
    index: number;
    selected: boolean;
    onPress: () => void;
    ms: (n: number, f?: number) => number;
}) {
    const press = useSharedValue(1);
    const enter = useSharedValue(0);
    const select = useSharedValue(0);

    useEffect(() => {
        enter.value = withDelay(
            220 + index * 120,
            withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
        );
    }, []);

    useEffect(() => {
        select.value = withTiming(selected ? 1 : 0, { duration: 240, easing: Easing.out(Easing.cubic) });
    }, [selected]);

    const cardStyle = useAnimatedStyle(() => ({
        opacity: enter.value,
        transform: [
            { translateY: interpolate(enter.value, [0, 1], [24, 0]) },
            { scale: press.value },
        ],
        borderColor: interpolateColor(select.value, [0, 1], [BORDER_IDLE, ACCENT]),
        backgroundColor: interpolateColor(select.value, [0, 1], [BG_CARD_IDLE, ACCENT_GLOW]),
        borderWidth: selected ? 2 : 1.5,
    }));

    const iconChipStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(select.value, [0, 1], [ACCENT_SOFT, ACCENT]),
        transform: [{ scale: interpolate(select.value, [0, 1], [1, 1.05]) }],
    }));

    const rightBadgeStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(select.value, [0, 1], ["#FFFFFF", ACCENT]),
        borderColor: interpolateColor(select.value, [0, 1], [BORDER_IDLE, ACCENT_DEEP]),
        transform: [{ scale: interpolate(select.value, [0, 1], [1, 1.1]) }],
    }));

    const checkIconStyle = useAnimatedStyle(() => ({
        opacity: select.value,
        transform: [{ scale: interpolate(select.value, [0, 1], [0.3, 1]) }],
    }));

    const roleIconStyle = useAnimatedStyle(() => ({
        opacity: interpolate(select.value, [0, 1], [1, 0]),
        transform: [{ scale: interpolate(select.value, [0, 1], [1, 0.3]) }],
    }));

    return (
        <Animated.View
            style={[
                cardStyle,
                {
                    borderRadius: ms(24),
                    // Soft floating depth shadow
                    shadowColor: selected ? ACCENT : "#0F172A",
                    shadowOpacity: selected ? 0.25 : 0.04,
                    shadowRadius: selected ? 14 : 10,
                    shadowOffset: { width: 0, height: selected ? 6 : 4 },
                    elevation: selected ? 5 : 2,
                },
            ]}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Sign up as ${role.title}`}
                accessibilityState={{ selected }}
                onPressIn={() => {
                    press.value = withSpring(0.97, { damping: 20, stiffness: 300 });
                }}
                onPressOut={() => {
                    press.value = withSpring(1, { damping: 16, stiffness: 240 });
                }}
                onPress={onPress}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: ms(16),
                    gap: ms(14),
                }}
            >
                {/* ── Left Image Chip ── */}
                <Animated.View
                    style={[
                        iconChipStyle,
                        {
                            width: ms(62),
                            height: ms(62),
                            borderRadius: ms(20),
                            borderTopLeftRadius: ms(26),
                            borderBottomRightRadius: ms(26),
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: "rgba(255, 214, 10, 0.4)",
                        },
                    ]}
                >
                    <Image
                        source={role.icon}
                        style={{ width: ms(44), height: ms(44) }}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                    />
                </Animated.View>

                {/* ── Middle Text (Title + Subtitle) ── */}
                <View style={{ flex: 1, justifyContent: "center" }}>
                    <Text
                        style={{
                            fontSize: ms(17),
                            color: INK,
                            fontFamily: FONT.display,
                            letterSpacing: -0.2,
                        }}
                    >
                        {role.title}
                    </Text>
                    <Text
                        style={{
                            fontSize: ms(12),
                            color: MUTED,
                            fontFamily: FONT.regular,
                            lineHeight: ms(17),
                            marginTop: ms(3),
                        }}
                    >
                        {role.subtitle}
                    </Text>
                </View>

                {/* ── Right Flexed Badge / Icon (Arrow REMOVED) ── */}
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                    <Animated.View
                        style={[
                            rightBadgeStyle,
                            {
                                width: ms(38),
                                height: ms(38),
                                borderRadius: ms(19),
                                borderWidth: 1.5,
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#000",
                                shadowOpacity: 0.04,
                                shadowRadius: 6,
                                elevation: 1,
                            },
                        ]}
                    >
                        {/* When Selected: Show Checkmark */}
                        <Animated.View style={[{ position: "absolute" }, checkIconStyle]}>
                            <Ionicons name="checkmark-sharp" size={ms(18)} color={INK} />
                        </Animated.View>

                        {/* When Idle: Show Badge Icon (Heart / Navigate / School) */}
                        <Animated.View style={[{ position: "absolute" }, roleIconStyle]}>
                            <Ionicons name={role.badgeIcon} size={ms(18)} color={ACCENT_DEEP} />
                        </Animated.View>
                    </Animated.View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

/* ═══════════════════════════ Main Page ═══════════════════════════ */
export default function SignupRolePage({ onSelectRole, onLogin }: SignupRolePageProps) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const ms = useCallback(
        (size: number, factor = 0.55) => {
            const scaled = (width / 375) * size;
            return Math.round(size + (scaled - size) * factor);
        },
        [width],
    );
    const isSmallScreen = height < 700;

    const IMAGE_SIZE = Math.min(width * (isSmallScreen ? 0.34 : 0.44), 168);
    const BLOB_SIZE = IMAGE_SIZE * 1.12;

    const player = useVideoPlayer(HERO_VIDEO, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    const [selectedRole, setSelectedRole] = useState<SignupRole | null>(null);

    const fade = useSharedValue(0);
    const slide = useSharedValue(24);
    const floatDot = useSharedValue(0);

    useEffect(() => {
        fade.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
        slide.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });

        floatDot.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
                withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
            ),
            -1,
        );
    }, []);

    const pageStyle = useAnimatedStyle(() => ({
        opacity: fade.value,
        transform: [{ translateY: slide.value }],
    }));

    const floatStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(floatDot.value, [0, 1], [0, -8]) }],
    }));

    const handleSelect = (role: SignupRole) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedRole(role);
        setTimeout(() => onSelectRole?.(role), 280);
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            {/* ── Top-right background organic curved sweep ── */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -width * 0.32,
                    right: -width * 0.3,
                    width: width * 0.88,
                    height: width * 0.88,
                    borderRadius: width * 0.44,
                    backgroundColor: ACCENT_SOFT,
                }}
            />
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -width * 0.18,
                    right: -width * 0.36,
                    width: width * 0.72,
                    height: width * 0.72,
                    borderRadius: width * 0.36,
                    borderWidth: 2,
                    borderColor: "#F5E6A3",
                }}
            />
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    bottom: -width * 0.22,
                    left: -width * 0.24,
                    width: width * 0.55,
                    height: width * 0.55,
                    borderRadius: width * 0.275,
                    backgroundColor: ACCENT_SOFT,
                    opacity: 0.5,
                }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "center",
                    paddingTop: insets.top + 8,
                    paddingBottom: Math.max(insets.bottom, 16),
                    paddingHorizontal: ms(24),
                }}
            >
                <Animated.View style={pageStyle}>
                    {/* ── Hero Video in Organic Blob ── */}
                    <View style={{ alignItems: "center" }}>
                        <View
                            style={{
                                width: BLOB_SIZE * 1.08,
                                height: BLOB_SIZE * 1.08,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {/* Watermark text */}
                            <Text
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    fontSize: BLOB_SIZE * 0.35,
                                    fontFamily: FONT.displayHeavy,
                                    color: "#F3F4F6",
                                    letterSpacing: ms(5),
                                    transform: [{ rotate: "-4deg" }],
                                }}
                            >
                                JOIN
                            </Text>

                            {/* Curved outer stroke */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    width: BLOB_SIZE * 1.06,
                                    height: BLOB_SIZE * 1.06,
                                    borderRadius: BLOB_SIZE * 0.53,
                                    borderWidth: 2,
                                    borderColor: "transparent",
                                    borderLeftColor: ACCENT,
                                    borderBottomColor: "#F5E6A3",
                                    transform: [{ rotate: "24deg" }],
                                }}
                            />

                            {/* Organic Blob Video Container */}
                            <View
                                style={{
                                    width: BLOB_SIZE,
                                    height: BLOB_SIZE,
                                    backgroundColor: "#FFFFFF",
                                    borderTopLeftRadius: BLOB_SIZE * 0.62,
                                    borderTopRightRadius: BLOB_SIZE * 0.44,
                                    borderBottomRightRadius: BLOB_SIZE * 0.58,
                                    borderBottomLeftRadius: BLOB_SIZE * 0.4,
                                    borderWidth: 2,
                                    borderColor: ACCENT_SOFT,
                                    overflow: "hidden",
                                }}
                            >
                                <VideoView
                                    player={player}
                                    style={{ width: "100%", height: "100%" }}
                                    nativeControls={false}
                                    contentFit="cover"
                                />
                            </View>

                            {/* Floating accent elements */}
                            <Animated.View
                                style={[
                                    floatStyle,
                                    {
                                        position: "absolute",
                                        top: ms(4),
                                        right: ms(2),
                                        width: ms(16),
                                        height: ms(16),
                                        borderRadius: 8,
                                        backgroundColor: ACCENT,
                                    },
                                ]}
                            />
                            <View
                                style={{
                                    position: "absolute",
                                    bottom: ms(8),
                                    left: ms(0),
                                    width: ms(22),
                                    height: ms(22),
                                    borderRadius: 11,
                                    borderWidth: 3,
                                    borderColor: ACCENT,
                                }}
                            />
                        </View>
                    </View>

                    {/* ── Title & Headings ── */}
                    <View style={{ alignItems: "center", marginTop: ms(10) }}>
                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                            {/* Brush highlight behind "Role" */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    bottom: ms(2),
                                    right: -ms(6),
                                    width: ms(86),
                                    height: ms(13),
                                    backgroundColor: ACCENT,
                                    opacity: 0.85,
                                    borderTopLeftRadius: ms(14),
                                    borderTopRightRadius: ms(4),
                                    borderBottomRightRadius: ms(14),
                                    borderBottomLeftRadius: ms(4),
                                    transform: [{ rotate: "-1.5deg" }],
                                }}
                            />
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    top: -ms(6),
                                    left: -ms(16),
                                    width: ms(40),
                                    height: ms(40),
                                    borderRadius: ms(20),
                                    backgroundColor: ACCENT_SOFT,
                                }}
                            />
                            <Text
                                style={{
                                    fontSize: ms(27),
                                    color: INK,
                                    fontFamily: FONT.displayHeavy,
                                    letterSpacing: -0.8,
                                }}
                            >
                                Choose Your Role
                            </Text>
                        </View>

                        {/* Curved underline wave */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }}>
                            <View style={{ width: ms(10), height: 5, borderRadius: 3, backgroundColor: ACCENT_SOFT }} />
                            <View style={{ width: ms(46), height: 5, borderRadius: 3, backgroundColor: ACCENT }} />
                            <View style={{ width: ms(10), height: 5, borderRadius: 3, backgroundColor: ACCENT_SOFT }} />
                        </View>

                        <Text
                            style={{
                                textAlign: "center",
                                color: MUTED,
                                fontFamily: FONT.light,
                                fontSize: ms(13.5),
                                lineHeight: ms(19),
                                marginTop: ms(8),
                                paddingHorizontal: ms(10),
                            }}
                        >
                            Select how you will be using BusTracker to get customized features
                        </Text>
                    </View>

                    {/* ── Role Selection Cards ── */}
                    <View style={{ gap: ms(14), marginTop: ms(20) }}>
                        {ROLES.map((role, i) => (
                            <RoleCard
                                key={role.key}
                                role={role}
                                index={i}
                                selected={selectedRole === role.key}
                                onPress={() => handleSelect(role.key)}
                                ms={ms}
                            />
                        ))}
                    </View>

                    {/* ── Security Trust Chip ── */}
                    <View style={{ flexDirection: "row", justifyContent: "center", marginTop: ms(18) }}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                                backgroundColor: BG_CARD_IDLE,
                                borderRadius: 999,
                                paddingHorizontal: ms(14),
                                paddingVertical: 7,
                                borderWidth: 1,
                                borderColor: BORDER_IDLE,
                            }}
                        >
                            <Ionicons name="shield-checkmark" size={ms(13)} color={SUCCESS} />
                            <Text style={{ color: MUTED, fontFamily: FONT.regular, fontSize: ms(11.5) }}>
                                Secure 256-bit encrypted registration
                            </Text>
                        </View>
                    </View>

                    {/* ── Footer: Login Link ── */}
                    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: ms(16) }}>
                        <Text style={{ color: MUTED, fontFamily: FONT.regular, fontSize: ms(13.5) }}>
                            Already have an account?{" "}
                        </Text>
                        <Pressable
                            hitSlop={10}
                            onPress={() => {
                                Haptics.selectionAsync();
                                onLogin?.();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Go to login"
                            style={{ alignItems: "center" }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Text style={{ color: INK, fontFamily: FONT.display, fontSize: ms(14.5) }}>
                                    Sign In
                                </Text>
                            </View>
                            <View style={{ width: "100%", height: 3, borderRadius: 2, backgroundColor: ACCENT, marginTop: 2 }} />
                        </Pressable>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}
