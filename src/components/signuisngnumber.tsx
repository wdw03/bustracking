import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator,
    Platform,
    Keyboard,
    ScrollView,
    useWindowDimensions,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    interpolate,
    interpolateColor,
    Extrapolation,
    runOnJS,
    Easing,
    type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { VideoView, useVideoPlayer } from "expo-video";
import { SignupRole } from "./signupmethod";
import TermsAndConditionsModal from "./termsandconditions";
import { useAuth } from "@/contexts/AuthContext";

/* ─────────────────────────── Design Tokens ─────────────────────────── */
const ACCENT = "#FFD60A";
const ACCENT_SOFT = "#FFF6CC";
const ACCENT_DEEP = "#E6BC00";
const INK = "#101010";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER_IDLE = "#ECEDF0";
const BG_IDLE = "#F7F8FA";
const DANGER = "#EF4444";
const DANGER_SOFT = "#FEF2F2";
const DANGER_BORDER = "#FECACA";
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
const HERO_VIDEO = require("../../assets/expo.icon/Assets/signnumberregieter.mp4");

/* ─────────────────────────── Authorization ───────────────────────────
   Phone authorization is checked via the Supabase register-user Edge Function.
   The server verifies phone is in the authorized_contacts table.
   NEVER trust client-side checks alone — these are just for UX. */

export type ExceptionType =
    | "empty"
    | "invalidLength"
    | "driverNotAssigned"
    | "parentNotAssigned"
    | "alreadyRegistered"
    | "server"
    | "noInternet";

type RegisterNumberPageProps = {
    role?: SignupRole | null;
    onBack?: () => void;
    onSubmit?: (phone: string) => void;
    onOtpSent?: (phone: string) => void;
    onLogin?: () => void;
};

export default function RegisterNumberPage({
    role = "parent",
    onBack,
    onSubmit,
    onOtpSent,
    onLogin,
}: RegisterNumberPageProps) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const { checkAuthorization } = useAuth();

    /* ── Responsive scale ── */
    const ms = useCallback(
        (size: number, factor = 0.55) => {
            const scaled = (width / 375) * size;
            return Math.round(size + (scaled - size) * factor);
        },
        [width],
    );
    const isSmallScreen = height < 700;

    const IMAGE_SIZE = Math.min(width * (isSmallScreen ? 0.36 : 0.44), 168);
    const BLOB_SIZE = IMAGE_SIZE * 1.12;

    const MS_14 = ms(14);
    const MS_20 = ms(20);

    /* ── Video Player ── */
    const player = useVideoPlayer(HERO_VIDEO, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    /* ── Form & Exception State ── */
    const [phoneNumber, setPhoneNumber] = useState("");
    const [touched, setTouched] = useState(false);
    const [btnState, setBtnState] = useState<"idle" | "loading" | "success">("idle");
    const [exception, setException] = useState<ExceptionType | null>(null);
    const [termsVisible, setTermsVisible] = useState(false);
    const [termsTab, setTermsTab] = useState<"terms" | "privacy">("terms");
    const [termsAccepted, setTermsAccepted] = useState(false);

    const phoneRef = useRef<TextInput>(null);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── Role display titles ── */
    const roleTitleMap: Record<string, string> = {
        parent: "Parent Account",
        driver: "Driver Account",
        school: "School Admin",
    };
    const activeRoleTitle = role ? roleTitleMap[role] || "New Account" : "New Account";

    /* ═══════════════════════ Reanimated Shared Values ═══════════════════════ */
    const phoneFocusAnim = useSharedValue(0);
    const phoneShake = useSharedValue(0);
    const fadeAnim = useSharedValue(0);
    const slideAnim = useSharedValue(30);
    const headerAnim = useSharedValue(0);
    const btnWidthAnim = useSharedValue(1);
    const textOpacity = useSharedValue(1);
    const loadingOpacity = useSharedValue(0);
    const iconOpacity = useSharedValue(0);
    const btnPress = useSharedValue(1);
    const errorBannerAnim = useSharedValue(0);
    const containerWidthSV = useSharedValue(0);
    const isPhoneDanger = useSharedValue(0);

    /* ── Validation ── */
    const phoneValid = /^[6-9]\d{9}$/.test(phoneNumber);

    useEffect(() => {
        isPhoneDanger.value = (touched && !phoneValid) || exception !== null ? 1 : 0;
    }, [touched, phoneValid, exception]);

    /* ═══════════════════════ Animated Styles ═══════════════════════ */
    const entranceStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ translateY: slideAnim.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(headerAnim.value, [0, 0.3], [1, 0], Extrapolation.CLAMP),
    }));

    const heroContainerStyle = useAnimatedStyle(() => ({
        height: interpolate(headerAnim.value, [0, 1], [BLOB_SIZE + 4, 0]),
        opacity: interpolate(headerAnim.value, [0, 0.3], [1, 0], Extrapolation.CLAMP),
    }));

    const headerMarginStyle = useAnimatedStyle(() => ({
        marginBottom: interpolate(headerAnim.value, [0, 1], [MS_14, 8]),
    }));

    const titleScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(headerAnim.value, [0, 1], [1, 0.88]) }],
    }));

    const subtitleStyle = useAnimatedStyle(() => ({
        height: interpolate(headerAnim.value, [0, 1], [MS_20, 0]),
        opacity: interpolate(headerAnim.value, [0, 0.3], [1, 0], Extrapolation.CLAMP),
    }));

    const phoneFocusStyle = useAnimatedStyle(() => {
        'worklet';
        const focusBorder = interpolateColor(phoneFocusAnim.value, [0, 1], [BORDER_IDLE, ACCENT]);
        return {
            borderColor: isPhoneDanger.value ? DANGER : focusBorder,
            backgroundColor: interpolateColor(phoneFocusAnim.value, [0, 1], [BG_IDLE, "#FFFFFF"]),
        };
    });

    const phoneChipStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(phoneFocusAnim.value, [0, 1], ["#EFF1F4", ACCENT_SOFT]),
    }));

    const phoneShakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: phoneShake.value * 6 }],
    }));

    const errorBannerStyle = useAnimatedStyle(() => ({
        opacity: errorBannerAnim.value,
        transform: [{ translateY: interpolate(errorBannerAnim.value, [0, 1], [-10, 0]) }],
    }));

    const btnScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: btnPress.value }],
    }));

    const btnInnerStyle = useAnimatedStyle(() => ({
        width: interpolate(btnWidthAnim.value, [0, 1], [64, containerWidthSV.value || 1]),
        borderRadius: interpolate(btnWidthAnim.value, [0, 1], [32, 20]),
    }));

    const btnTextStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    const btnLoadingStyle = useAnimatedStyle(() => ({
        opacity: loadingOpacity.value,
    }));

    const btnIconStyle = useAnimatedStyle(() => ({
        opacity: iconOpacity.value,
    }));

    /* ═══════════════════════ Effects ═══════════════════════ */
    useEffect(() => {
        fadeAnim.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
        slideAnim.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
    }, []);

    const collapseHeader = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
        headerAnim.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    }, []);

    const expandHeader = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            hideTimerRef.current = null;
            headerAnim.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
        }, 80);
    }, []);

    useEffect(() => {
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvt, collapseHeader);
        const hideSub = Keyboard.addListener(hideEvt, expandHeader);
        return () => {
            showSub.remove();
            hideSub.remove();
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [collapseHeader, expandHeader]);

    useEffect(() => () => {
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
    }, []);

    /* ═══════════════════════ Exception Handlers ═══════════════════════ */
    const shake = (sv: SharedValue<number>) => {
        sv.value = withSequence(
            withTiming(1, { duration: 50 }),
            withTiming(-1, { duration: 50 }),
            withTiming(1, { duration: 50 }),
            withTiming(-1, { duration: 50 }),
            withTiming(0, { duration: 50 }),
        );
    };

    const triggerException = (type: ExceptionType) => {
        setException(type);
        errorBannerAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    const hideException = () => {
        errorBannerAnim.value = withTiming(0, { duration: 180 }, (finished) => {
            if (finished) runOnJS(setException)(null);
        });
    };

    const resetButtonToIdle = () => {
        setBtnState("idle");
        loadingOpacity.value = withTiming(0, { duration: 150 });
        iconOpacity.value = withTiming(0, { duration: 150 });
        btnWidthAnim.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.exp) });
        textOpacity.value = withDelay(150, withTiming(1, { duration: 250 }));
    };

    /* ═══════════════════════ Submit Handler ═══════════════════════ */
    const handleSubmit = () => {
        if (btnState !== "idle") return;
        if (exception) hideException();

        // 1. Empty input check
        if (!phoneNumber.trim()) {
            setTouched(true);
            shake(phoneShake);
            triggerException("empty");
            phoneRef.current?.focus();
            return;
        }

        // 2. Length & digit check
        if (!phoneValid) {
            setTouched(true);
            shake(phoneShake);
            triggerException("invalidLength");
            phoneRef.current?.focus();
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setBtnState("loading");
        Keyboard.dismiss();

        btnWidthAnim.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.exp) });
        textOpacity.value = withTiming(0, { duration: 180 });
        loadingOpacity.value = withDelay(100, withTiming(1, { duration: 280 }));

        // Call Supabase Edge Function to check authorization & duplicate phone
        successTimerRef.current = setTimeout(async () => {
            try {
                const contactType = role === "school" ? "school" : role === "driver" ? "driver" : "parent";
                const authResult = await checkAuthorization(phoneNumber, contactType);

                if (!authResult.success || !authResult.authorized) {
                    resetButtonToIdle();
                    shake(phoneShake);

                    if (authResult.code === "ALREADY_REGISTERED" || authResult.error?.toLowerCase().includes("already registered")) {
                        triggerException("alreadyRegistered");
                    } else if (role === "driver") {
                        triggerException("driverNotAssigned");
                    } else if (role === "parent") {
                        triggerException("parentNotAssigned");
                    } else {
                        triggerException("alreadyRegistered");
                    }
                    return;
                }

                // Phone is authorized & available! Proceed to next step.
                setBtnState("success");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                loadingOpacity.value = withTiming(0, { duration: 180 });
                iconOpacity.value = withDelay(100, withTiming(1, { duration: 280 }));

                setTimeout(() => {
                    onSubmit?.(phoneNumber);
                    onOtpSent?.(phoneNumber);
                    resetButtonToIdle();
                }, 1000);
            } catch (err) {
                console.error("Authorization check error:", err);
                resetButtonToIdle();
                shake(phoneShake);
                triggerException("server");
            }
        }, 800);
    };

    /* ── Static input base styles ── */
    const inputBase = {
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === "ios" ? 12 : 10,
        borderWidth: 1.5,
        shadowColor: "#0F172A",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 1,
    };
    const iconChip = {
        width: ms(38),
        height: ms(38),
        borderRadius: 13,
        marginRight: 10,
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}>
            {/* ── Top Bar with Back Button & Role Chip ── */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: ms(20),
                    paddingVertical: ms(10),
                    zIndex: 10,
                }}
            >
                <Pressable
                    hitSlop={12}
                    onPress={() => {
                        Haptics.selectionAsync();
                        onBack?.();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    style={{
                        width: ms(40),
                        height: ms(40),
                        borderRadius: ms(20),
                        backgroundColor: BG_IDLE,
                        borderWidth: 1,
                        borderColor: BORDER_IDLE,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name="arrow-back" size={ms(20)} color={INK} />
                </Pressable>

                {/* Role Pill Badge */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: ACCENT_SOFT,
                        borderRadius: 999,
                        paddingHorizontal: ms(12),
                        paddingVertical: 5,
                        borderWidth: 1,
                        borderColor: "rgba(255, 214, 10, 0.4)",
                    }}
                >
                    <Ionicons
                        name={role === "driver" ? "navigate" : role === "school" ? "school" : "heart"}
                        size={ms(12)}
                        color={ACCENT_DEEP}
                    />
                    <Text style={{ fontSize: ms(12), color: INK, fontFamily: FONT.semibold }}>
                        {activeRoleTitle}
                    </Text>
                </View>

                <View style={{ width: ms(40) }} />
            </View>

            {/* ── Decorative top-right background curve ── */}
            <Animated.View
                pointerEvents="none"
                style={[
                    {
                        position: "absolute",
                        top: -width * 0.42,
                        right: -width * 0.32,
                        width: width * 0.95,
                        height: width * 0.95,
                        borderRadius: width * 0.475,
                        backgroundColor: ACCENT_SOFT,
                    },
                    backdropStyle,
                ]}
            />
            <Animated.View
                pointerEvents="none"
                style={[
                    {
                        position: "absolute",
                        top: width * 0.12,
                        left: -width * 0.2,
                        width: width * 0.42,
                        height: width * 0.42,
                        borderRadius: width * 0.21,
                        borderWidth: ms(22),
                        borderColor: ACCENT_SOFT,
                    },
                    backdropStyle,
                ]}
            />

            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "center",
                    paddingHorizontal: ms(24),
                    paddingTop: 4,
                    paddingBottom: Math.max(insets.bottom, 16),
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                bounces={false}
            >
                <Animated.View style={entranceStyle}>
                    {/* ── Header: Video in organic blob ── */}
                    <Animated.View className="items-center" style={headerMarginStyle}>
                        <Animated.View
                            className="w-full items-center justify-center overflow-hidden"
                            style={heroContainerStyle}
                        >
                            {/* Watermark */}
                            <Text
                                pointerEvents="none"
                                className="absolute"
                                style={{
                                    fontSize: BLOB_SIZE * 0.38,
                                    fontFamily: FONT.displayHeavy,
                                    color: "#F3F4F6",
                                    letterSpacing: ms(5),
                                    transform: [{ rotate: "-4deg" }],
                                }}
                            >
                                REGISTER
                            </Text>

                            {/* Curved arc stroke */}
                            <View
                                pointerEvents="none"
                                className="absolute border-2 border-transparent"
                                style={{
                                    width: BLOB_SIZE * 1.08,
                                    height: BLOB_SIZE * 1.08,
                                    borderRadius: BLOB_SIZE * 0.54,
                                    borderLeftColor: ACCENT,
                                    borderBottomColor: "#F5E6A3",
                                    transform: [{ rotate: "24deg" }],
                                    opacity: 0.9,
                                }}
                            />

                            {/* Organic Blob Video Container */}
                            <View
                                className="items-center justify-center"
                                style={{
                                    width: BLOB_SIZE,
                                    height: BLOB_SIZE,
                                    backgroundColor: ACCENT_SOFT,
                                    borderTopLeftRadius: BLOB_SIZE * 0.62,
                                    borderTopRightRadius: BLOB_SIZE * 0.44,
                                    borderBottomRightRadius: BLOB_SIZE * 0.58,
                                    borderBottomLeftRadius: BLOB_SIZE * 0.4,
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

                            {/* Floating accent ring + dot */}
                            <View
                                className="absolute rounded-full border-4"
                                style={{
                                    top: BLOB_SIZE * 0.06,
                                    right: width / 2 - BLOB_SIZE / 2 - ms(14),
                                    width: ms(26),
                                    height: ms(26),
                                    borderColor: ACCENT,
                                }}
                            />
                            <View
                                className="absolute rounded-full"
                                style={{
                                    bottom: BLOB_SIZE * 0.1,
                                    left: width / 2 - BLOB_SIZE / 2 - ms(8),
                                    width: ms(12),
                                    height: ms(12),
                                    backgroundColor: ACCENT,
                                }}
                            />
                        </Animated.View>

                        <Animated.View className="items-center" style={titleScaleStyle}>
                            <View className="items-center justify-center" style={{ marginTop: ms(8) }}>
                                {/* Brush stroke behind title */}
                                <View
                                    pointerEvents="none"
                                    className="absolute"
                                    style={{
                                        bottom: ms(2),
                                        right: -ms(6),
                                        width: ms(115),
                                        height: ms(14),
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
                                    className="absolute rounded-full"
                                    style={{
                                        top: -ms(6),
                                        left: -ms(18),
                                        width: ms(44),
                                        height: ms(44),
                                        backgroundColor: ACCENT_SOFT,
                                        opacity: 0.9,
                                    }}
                                />
                                <Text
                                    className="text-neutral-900"
                                    style={{
                                        fontSize: ms(26),
                                        color: INK,
                                        fontFamily: FONT.displayHeavy,
                                        letterSpacing: -0.8,
                                    }}
                                >
                                    Enter Mobile Number
                                </Text>
                            </View>

                            {/* Curved wave underline */}
                            <View className="flex-row items-center gap-[5px] mt-2 mb-1">
                                <View className="h-[5px] rounded-[3px]" style={{ width: ms(10), backgroundColor: ACCENT_SOFT }} />
                                <View className="h-[5px] rounded-[3px]" style={{ width: ms(46), backgroundColor: ACCENT }} />
                                <View className="h-[5px] rounded-[3px]" style={{ width: ms(10), backgroundColor: ACCENT_SOFT }} />
                            </View>
                        </Animated.View>

                        <Animated.View className="overflow-hidden" style={subtitleStyle}>
                            <Text
                                className="text-center"
                                style={{ color: MUTED, fontFamily: FONT.light, fontSize: ms(13.5), lineHeight: ms(19) }}
                            >
                                {role === "driver"
                                    ? "Enter your assigned driver mobile number"
                                    : role === "parent"
                                        ? "Enter your mobile number linked with the school"
                                        : "Enter your 10-digit mobile number to proceed"}
                            </Text>
                        </Animated.View>
                    </Animated.View>

                    {/* ── Mobile Input Field ── */}
                    <View style={{ marginBottom: ms(12) }}>
                        <Text
                            className="mb-2 ml-1"
                            style={{ fontSize: ms(13), color: "#374151", fontFamily: FONT.semibold }}
                        >
                            Mobile Number
                        </Text>
                        <Animated.View style={phoneShakeStyle}>
                            <Animated.View
                                className="flex-row items-center"
                                style={[inputBase, phoneFocusStyle]}
                            >
                                <Animated.View className="items-center justify-center" style={[iconChip, phoneChipStyle]}>
                                    <Ionicons name="call-outline" size={ms(18)} color={INK} />
                                </Animated.View>
                                <Text
                                    className="mr-2.5 border-r border-gray-300 pr-2.5"
                                    style={{ fontSize: ms(16), fontFamily: FONT.semibold, color: "#1F2937" }}
                                >
                                    +91
                                </Text>
                                <TextInput
                                    ref={phoneRef}
                                    placeholder="98765 43210"
                                    keyboardType="number-pad"
                                    maxLength={10}
                                    value={phoneNumber}
                                    onChangeText={(t) => {
                                        setPhoneNumber(t.replace(/[^0-9]/g, ""));
                                        if (exception) hideException();
                                    }}
                                    onFocus={() => {
                                        phoneFocusAnim.value = withTiming(1, { duration: 200 });
                                        collapseHeader();
                                    }}
                                    onBlur={() => {
                                        phoneFocusAnim.value = withTiming(0, { duration: 200 });
                                        setTouched(true);
                                    }}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSubmit}
                                    autoComplete="tel"
                                    textContentType="telephoneNumber"
                                    accessibilityLabel="Mobile number"
                                    className="flex-1 py-1.5"
                                    style={{ fontSize: ms(16), fontFamily: FONT.regular, color: "#1F2937", letterSpacing: 0.5 }}
                                    placeholderTextColor={FAINT}
                                />
                                {phoneValid ? (
                                    <Ionicons name="checkmark-circle" size={ms(20)} color={SUCCESS} />
                                ) : phoneNumber.length > 0 ? (
                                    <Pressable hitSlop={10} onPress={() => setPhoneNumber("")} accessibilityLabel="Clear mobile number">
                                        <Ionicons name="close-circle" size={ms(18)} color="#D1D5DB" />
                                    </Pressable>
                                ) : null}
                            </Animated.View>
                        </Animated.View>

                        {/* Subtext info */}
                        <Text style={{ color: FAINT, fontSize: ms(11.5), marginTop: ms(6), marginLeft: ms(4), fontFamily: FONT.light }}>
                            {role === "driver"
                                ? "Note: Your school admin must pre-register your number."
                                : role === "parent"
                                    ? "Note: Your number must be registered with your child's school."
                                    : "Enter your valid 10-digit mobile number to proceed"}
                        </Text>
                    </View>

                    {/* ═══════════════════════ Rich Exception Card ═══════════════════════ */}
                    {exception && (
                        <Animated.View
                            accessibilityRole="alert"
                            style={[
                                {
                                    marginTop: ms(12),
                                    padding: ms(15),
                                    borderRadius: ms(20),
                                    backgroundColor: DANGER_SOFT,
                                    borderWidth: 1.5,
                                    borderColor: DANGER_BORDER,
                                    shadowColor: DANGER,
                                    shadowOpacity: 0.08,
                                    shadowRadius: 12,
                                    elevation: 3,
                                },
                                errorBannerStyle,
                            ]}
                        >
                            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: ms(12) }}>
                                {/* Icon Chip */}
                                <View
                                    style={{
                                        width: ms(40),
                                        height: ms(40),
                                        borderRadius: ms(14),
                                        backgroundColor: "#FEE2E2",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 1,
                                        borderColor: "#FCA5A5",
                                    }}
                                >
                                    <Ionicons
                                        name={
                                            exception === "driverNotAssigned"
                                                ? "bus-outline"
                                                : exception === "parentNotAssigned"
                                                    ? "school-outline"
                                                    : exception === "alreadyRegistered"
                                                        ? "person-circle-outline"
                                                        : "alert-circle-outline"
                                        }
                                        size={ms(22)}
                                        color={DANGER}
                                    />
                                </View>

                                {/* Exception Details */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: "#7F1D1D" }}>
                                        {exception === "driverNotAssigned"
                                            ? "Driver Not Registered"
                                            : exception === "parentNotAssigned"
                                                ? "Parent Record Not Found"
                                                : exception === "alreadyRegistered"
                                                    ? "Account Already Exists"
                                                    : exception === "empty"
                                                        ? "Mobile Number Required"
                                                        : exception === "invalidLength"
                                                            ? "Invalid Mobile Number"
                                                            : "System Notice"}
                                    </Text>
                                    <Text
                                        style={{
                                            fontFamily: FONT.regular,
                                            fontSize: ms(12.5),
                                            color: "#991B1B",
                                            lineHeight: ms(18),
                                            marginTop: ms(4),
                                        }}
                                    >
                                        {exception === "driverNotAssigned"
                                            ? "Drivers cannot self-register directly. Your mobile number has not been added by any School Administrator yet. Please contact your school admin to register your driver account."
                                            : exception === "parentNotAssigned"
                                                ? "Your mobile number is not linked to any student profile. Please contact your child's school administration to add your number to the bus system."
                                                : exception === "alreadyRegistered"
                                                    ? "This mobile number is already registered in BusTracker. Please log in directly with your password."
                                                    : exception === "empty"
                                                        ? "Please enter your 10-digit mobile number to continue."
                                                        : exception === "invalidLength"
                                                            ? "Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9."
                                                            : "Unable to verify your account right now. Please check your connection and try again."}
                                    </Text>

                                    {/* Exception Action Buttons */}
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(8), marginTop: ms(10) }}>
                                        {exception === "alreadyRegistered" ? (
                                            <Pressable
                                                hitSlop={8}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    onLogin?.();
                                                }}
                                                style={{
                                                    backgroundColor: DANGER,
                                                    borderRadius: 999,
                                                    paddingHorizontal: ms(14),
                                                    paddingVertical: 7,
                                                }}
                                            >
                                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#FFFFFF" }}>
                                                    Go to Login
                                                </Text>
                                            </Pressable>
                                        ) : exception === "driverNotAssigned" || exception === "parentNotAssigned" ? (
                                            <Pressable
                                                hitSlop={8}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    // Action helper
                                                }}
                                                style={{
                                                    backgroundColor: DANGER,
                                                    borderRadius: 999,
                                                    paddingHorizontal: ms(14),
                                                    paddingVertical: 7,
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    gap: 4,
                                                }}
                                            >
                                                <Ionicons name="call" size={ms(12)} color="#FFFFFF" />
                                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#FFFFFF" }}>
                                                    Contact School Admin
                                                </Text>
                                            </Pressable>
                                        ) : null}

                                        <Pressable
                                            hitSlop={8}
                                            onPress={hideException}
                                            style={{
                                                backgroundColor: "#FFFFFF",
                                                borderRadius: 999,
                                                paddingHorizontal: ms(12),
                                                paddingVertical: 7,
                                                borderWidth: 1,
                                                borderColor: DANGER_BORDER,
                                            }}
                                        >
                                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: "#7F1D1D" }}>
                                                Try Another Number
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Close Dismiss Icon */}
                                <Pressable hitSlop={10} onPress={hideException} accessibilityLabel="Dismiss error">
                                    <Ionicons name="close-circle" size={ms(20)} color="#B91C1C" />
                                </Pressable>
                            </View>
                        </Animated.View>
                    )}

                    {/* ── Submit Button (Morphing Pill) ── */}
                    <View
                        className="items-center justify-center"
                        style={{ marginTop: ms(16) }}
                        onLayout={(e) => {
                            containerWidthSV.value = e.nativeEvent.layout.width;
                        }}
                    >
                        <Pressable
                            onPress={handleSubmit}
                            onPressIn={() => {
                                if (btnState === "idle") {
                                    btnPress.value = withSpring(0.96, { damping: 12, stiffness: 180 });
                                }
                            }}
                            onPressOut={() => {
                                if (btnState === "idle") {
                                    btnPress.value = withSpring(1, { damping: 12, stiffness: 180 });
                                }
                            }}
                            disabled={btnState !== "idle"}
                            accessibilityRole="button"
                            accessibilityLabel="Submit"
                            className="w-full items-center"
                        >
                            <Animated.View className="items-center" style={btnScaleStyle}>
                                <Animated.View
                                    className="flex-row items-center justify-center"
                                    style={[
                                        {
                                            backgroundColor: btnState === "success" ? SUCCESS : phoneValid ? ACCENT : "#F3F4F6",
                                            height: ms(58),
                                            shadowColor: ACCENT,
                                            shadowOpacity: phoneValid ? 0.45 : 0,
                                            shadowRadius: 14,
                                            shadowOffset: { width: 0, height: 6 },
                                            elevation: phoneValid ? 8 : 0,
                                        },
                                        btnInnerStyle,
                                    ]}
                                >
                                    <Animated.View className="absolute flex-row items-center gap-2" style={btnTextStyle}>
                                        <Text
                                            style={{
                                                fontSize: ms(16),
                                                fontFamily: FONT.display,
                                                letterSpacing: 0.4,
                                                color: phoneValid ? INK : FAINT,
                                            }}
                                        >
                                            Submit
                                        </Text>
                                        <Ionicons name="arrow-forward" size={ms(18)} color={phoneValid ? INK : FAINT} />
                                    </Animated.View>

                                    <Animated.View className="absolute" style={btnLoadingStyle}>
                                        <ActivityIndicator color={INK} size="small" />
                                    </Animated.View>

                                    <Animated.View className="absolute" style={btnIconStyle}>
                                        <Ionicons name="checkmark" size={28} color={INK} />
                                    </Animated.View>
                                </Animated.View>
                            </Animated.View>
                        </Pressable>
                    </View>

                    {/* ── Footer: Back to Login ── */}
                    <View className="flex-row justify-center items-center" style={{ marginTop: ms(18) }}>
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
                            accessibilityLabel="Log in"
                            className="items-center"
                        >
                            <View className="flex-row items-center gap-[3px]">
                                <Text style={{ color: INK, fontFamily: FONT.display, fontSize: ms(14.5) }}>
                                    Login Now
                                </Text>
                                <Ionicons name="arrow-forward" size={ms(14)} color={INK} />
                            </View>
                            <View className="w-[88%] h-[3px] rounded-sm mt-0.5" style={{ backgroundColor: ACCENT }} />
                        </Pressable>
                    </View>

                    {/* ── Terms & Privacy ── */}
                    <View className="flex-row justify-center items-center" style={{ marginTop: ms(14) }}>
                        <Text style={{ color: FAINT, fontFamily: FONT.light, fontSize: ms(11.5) }}>
                            By registering, you agree to our
                        </Text>
                        <Pressable
                            hitSlop={8}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setTermsTab("terms");
                                setTermsVisible(true);
                            }}
                        >
                            <Text
                                className="ml-1 underline"
                                style={{ color: "#1F2937", fontFamily: FONT.semibold, fontSize: ms(11.5) }}
                            >
                                Terms
                            </Text>
                        </Pressable>
                        <Text style={{ color: FAINT, fontFamily: FONT.light, fontSize: ms(11.5) }}>
                            {" & "}
                        </Text>
                        <Pressable
                            hitSlop={8}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setTermsTab("privacy");
                                setTermsVisible(true);
                            }}
                        >
                            <Text
                                className="underline"
                                style={{ color: "#1F2937", fontFamily: FONT.semibold, fontSize: ms(11.5) }}
                            >
                                Privacy Policy
                            </Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </ScrollView>

            <TermsAndConditionsModal
                visible={termsVisible}
                onClose={() => setTermsVisible(false)}
                initialTab={termsTab}
                accepted={termsAccepted}
                onAccept={() => setTermsAccepted(true)}
            />
        </View>
    );
}
