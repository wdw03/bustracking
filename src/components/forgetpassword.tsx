import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    Animated,
    ActivityIndicator,
    Easing,
    Platform,
    Keyboard,
    ScrollView,
    useWindowDimensions,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

/* ─────────────────────────── Design Tokens ─────────────────────────── */
const ACCENT = "#FFD60A";
const ACCENT_SOFT = "#FFF6CC";
const ACCENT_DEEP = "#B08900";
const INK = "#101010";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER_IDLE = "#ECEDF0";
const BG_IDLE = "#F7F8FA";
const DANGER = "#EF4444";
const SUCCESS = "#16A34A";
const SUCCESS_SOFT = "#F0FDF4";
const SUCCESS_BORDER = "#BBF7D0";

/* ─────────────────────────── Fonts ───────────────────────────
   PREMIUM PAIRING — Sora (display headings) + Inter (body).
   Same setup as the login page. Load once in your root App.tsx:

   npx expo install @expo-google-fonts/sora @expo-google-fonts/inter expo-font

   import { Sora_700Bold, Sora_800ExtraBold } from "@expo-google-fonts/sora";
   import { useFonts, Inter_300Light, Inter_400Regular,
            Inter_600SemiBold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
   useFonts({
     "Sora-Bold": Sora_700Bold,
     "Sora-ExtraBold": Sora_800ExtraBold,
     "Inter-Light": Inter_300Light,
     "Inter-Regular": Inter_400Regular,
     "Inter-SemiBold": Inter_600SemiBold,
     "Inter-Bold": Inter_800ExtraBold,
   }); */
const FONT = {
    light: "Inter-Light",
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
    display: "Sora-Bold",
    displayHeavy: "Sora-ExtraBold",
};

/* ─────────────────────────── Rate Limit Config ───────────────────────────
   Resend cooldown + max OTP requests. Mirror these limits on your backend —
   client-side limits alone are NOT security, they're just good UX. */
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_OTP_REQUESTS = 3;

/* ── DEMO ONLY — same demo account as the login page.
   OTP is only "sent" to registered numbers; any other number shows
   the "account not found" error. Replace with your real API check. */
const DEMO_REGISTERED_NUMBERS = ["9876543210"];

type ForgetPasswordProps = {
    /** Back button — e.g. () => navigation.goBack() */
    onBack?: () => void;
    /** Called after OTP sent, so you can move to the verify screen,
        e.g. (phone) => navigation.navigate("VerifyOtp", { phone }) */
    onOtpSent?: (phone: string) => void;
    /** Kept for backwards compatibility with the old prop name */
    onResetSuccess?: () => void;
};

export default function ForgetPassword({ onBack, onOtpSent, onResetSuccess }: ForgetPasswordProps) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    /* Responsive scale — same ms() as the login page */
    const ms = useCallback(
        (size: number, factor = 0.55) => {
            const scaled = (width / 375) * size;
            return Math.round(size + (scaled - size) * factor);
        },
        [width]
    );
    const isSmallScreen = height < 700;

    // Compact so the whole screen fits WITHOUT scrolling
    const IMAGE_SIZE = Math.min(width * (isSmallScreen ? 0.34 : 0.42), 160);
    const BLOB_SIZE = IMAGE_SIZE * 1.12;

    const headerVideo = require("../../assets/expo.icon/Assets/man-forget-his-password-animation-gif-download-10003256.mp4");

    const player = useVideoPlayer(headerVideo, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    /* ─────────────── Form State ─────────────── */
    const [phoneNumber, setPhoneNumber] = useState("");
    const [touched, setTouched] = useState(false);

    const focusedRef = useRef<"phone" | null>(null);
    const phoneRef = useRef<TextInput>(null);
    const scrollRef = useRef<ScrollView>(null);

    const phoneFocusAnim = useRef(new Animated.Value(0)).current;

    const phoneBorderColor = phoneFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [BORDER_IDLE, ACCENT],
    });
    const phoneBg = phoneFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [BG_IDLE, "#FFFFFF"],
    });

    const phoneValid = /^[6-9]\d{9}$/.test(phoneNumber);

    const phoneShake = useRef(new Animated.Value(0)).current;

    const shake = (val: Animated.Value) => {
        val.setValue(0);
        Animated.sequence([
            Animated.timing(val, { toValue: 1, duration: 50, useNativeDriver: true }),
            Animated.timing(val, { toValue: -1, duration: 50, useNativeDriver: true }),
            Animated.timing(val, { toValue: 1, duration: 50, useNativeDriver: true }),
            Animated.timing(val, { toValue: -1, duration: 50, useNativeDriver: true }),
            Animated.timing(val, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    /* ─────────────── Entrance Animation ─────────────── */
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    /* ─────────────── Keyboard collapse header ─────────────── */
    const headerAnim = useRef(new Animated.Value(0)).current;
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const onShow = () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
                hideTimerRef.current = null;
            }
            Animated.spring(headerAnim, { toValue: 1, friction: 20, tension: 80, useNativeDriver: false }).start();
        };

        const onHide = () => {
            hideTimerRef.current = setTimeout(() => {
                Animated.spring(headerAnim, { toValue: 0, friction: 20, tension: 80, useNativeDriver: false }).start();
                hideTimerRef.current = null;
            }, 500);
        };

        const showSub = Keyboard.addListener(showEvt, onShow);
        const hideSub = Keyboard.addListener(hideEvt, onHide);

        return () => {
            showSub.remove();
            hideSub.remove();
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    const headerHeight = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [BLOB_SIZE + 4, 0] });
    const headerOpacity = headerAnim.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: "clamp" });
    const headerMargin = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [ms(14), 8] });
    const subHeight = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [ms(38), 0] });
    const titleSize = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] });

    /* ─────────────── Button morph state ─────────────── */
    const [btnState, setBtnState] = useState<"idle" | "loading" | "success">("idle");
    const btnWidthAnim = useRef(new Animated.Value(1)).current;
    const loadingOpacity = useRef(new Animated.Value(0)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(1)).current;
    const btnPress = useRef(new Animated.Value(1)).current;
    const [containerWidth, setContainerWidth] = useState(0);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, []);

    /* ─────────────── OTP sent + rate limit state ─────────────── */
    const [otpSent, setOtpSent] = useState(false);
    const [requestCount, setRequestCount] = useState(0);
    const [cooldown, setCooldown] = useState(0);
    const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sentBannerAnim = useRef(new Animated.Value(0)).current;

    const limitReached = requestCount >= MAX_OTP_REQUESTS;

    /* ── "Account not found" / "Server Error" / "No Internet" ── */
    const [errorType, setErrorType] = useState<"notFound" | "serverError" | "noInternet" | null>(null);
    const notFoundAnim = useRef(new Animated.Value(0)).current;

    const showError = (type: "notFound" | "serverError" | "noInternet") => {
        setErrorType(type);
        Animated.spring(notFoundAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
    };
    const hideError = () => {
        Animated.timing(notFoundAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
            setErrorType(null);
        });
    };

    const startCooldown = () => {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        return () => {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
        };
    }, []);

    // Morph the pill back into the full-width button (used for the resend state)
    const resetButtonToIdle = () => {
        setBtnState("idle");
        Animated.parallel([
            Animated.timing(loadingOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(iconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(btnWidthAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.exp), useNativeDriver: false }),
            Animated.timing(textOpacity, { toValue: 1, duration: 250, delay: 150, useNativeDriver: true }),
        ]).start();
    };

    const handleAction = () => {
        if (btnState !== "idle") return;
        if (errorType) hideError();
        if (cooldown > 0 || limitReached) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        if (!phoneValid) {
            setTouched(true);
            shake(phoneShake);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            phoneRef.current?.focus();
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setBtnState("loading");
        Keyboard.dismiss();

        Animated.timing(btnWidthAnim, { toValue: 0, duration: 320, easing: Easing.out(Easing.exp), useNativeDriver: false }).start();

        Animated.parallel([
            Animated.timing(textOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(loadingOpacity, { toValue: 1, duration: 280, delay: 100, useNativeDriver: true }),
        ]).start();

        successTimerRef.current = setTimeout(async () => {
            try {
                const { sendOtp } = await import("../services/authService");
                const otpRes = await sendOtp(phoneNumber);

                if (!otpRes.success) {
                    console.warn("OTP send notice:", otpRes.error);
                }

                setBtnState("success");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Animated.parallel([
                    Animated.timing(loadingOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
                    Animated.timing(iconOpacity, { toValue: 1, duration: 280, delay: 100, useNativeDriver: true }),
                ]).start();

                setOtpSent(true);
                setRequestCount((c) => c + 1);
                startCooldown();
                Animated.spring(sentBannerAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();

                // Morph back to idle so the user sees the Resend state
                successTimerRef.current = setTimeout(() => {
                    resetButtonToIdle();
                    onOtpSent?.(phoneNumber);
                }, 400);
            } catch (err) {
                console.error("Forget password error:", err);
                resetButtonToIdle();
                shake(phoneShake);
                showError("serverError");
            }
        }, 800);
    };

    const btnWidth = btnWidthAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [64, containerWidth || 1],
    });
    const btnRadius = btnWidthAnim.interpolate({ inputRange: [0, 1], outputRange: [32, 20] });

    const inputBase = {
        flexDirection: "row" as const,
        alignItems: "center" as const,
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

    const btnDisabled = !phoneValid || cooldown > 0 || limitReached;

    const btnLabel = limitReached
        ? "Limit Reached"
        : cooldown > 0
            ? `Resend OTP in ${cooldown}s`
            : otpSent
                ? "Resend OTP"
                : "Send OTP";

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}>
            {/* ── Back button ── */}
            {onBack && (
                <View style={{ position: "absolute", top: insets.top + 10, left: 20, zIndex: 10 }}>
                    <Pressable
                        onPress={onBack}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        style={({ pressed }) => ({
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: "#FFFFFF",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: BORDER_IDLE,
                            shadowColor: "#0F172A",
                            shadowOpacity: 0.06,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 3,
                            opacity: pressed ? 0.7 : 1,
                        })}
                    >
                        <Ionicons name="arrow-back" size={22} color={INK} />
                    </Pressable>
                </View>
            )}

            {/* ── Curved yellow backdrop sweep (top-right) ── */}
            <Animated.View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -width * 0.42,
                    right: -width * 0.32,
                    width: width * 0.95,
                    height: width * 0.95,
                    borderRadius: width * 0.475,
                    backgroundColor: ACCENT_SOFT,
                    opacity: headerOpacity,
                }}
            />
            {/* Thin curved ring echo on the sweep */}
            <Animated.View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -width * 0.34,
                    right: -width * 0.26,
                    width: width * 0.8,
                    height: width * 0.8,
                    borderRadius: width * 0.4,
                    borderWidth: 1.5,
                    borderColor: "#F5E6A3",
                    opacity: headerOpacity,
                }}
            />
            {/* Small curved accent dot bottom-left for balance */}
            <Animated.View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    bottom: height * 0.12,
                    left: -ms(30),
                    width: ms(90),
                    height: ms(90),
                    borderRadius: ms(45),
                    backgroundColor: ACCENT_SOFT,
                    opacity: headerOpacity,
                }}
            />

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "center",
                    paddingHorizontal: ms(24),
                    paddingTop: 8,
                    paddingBottom: Math.max(insets.bottom, 16),
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                bounces={false}
            >
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {/* ── Header: video inside organic curved blob ── */}
                    <Animated.View style={{ alignItems: "center", marginBottom: headerMargin }}>
                        <Animated.View
                            style={{
                                width: "100%",
                                height: headerHeight,
                                opacity: headerOpacity,
                                overflow: "hidden",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            {/* Giant watermark word behind the blob — premium editorial depth */}
                            <Text
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    fontSize: BLOB_SIZE * 0.38,
                                    fontFamily: FONT.displayHeavy,
                                    color: "#F3F4F6",
                                    letterSpacing: ms(5),
                                    transform: [{ rotate: "-4deg" }],
                                }}
                            >
                                RESET
                            </Text>

                            {/* Curved arc stroke hugging the blob's edge */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    width: BLOB_SIZE * 1.08,
                                    height: BLOB_SIZE * 1.08,
                                    borderRadius: BLOB_SIZE * 0.54,
                                    borderWidth: 2,
                                    borderColor: "transparent",
                                    borderLeftColor: ACCENT,
                                    borderBottomColor: "#F5E6A3",
                                    transform: [{ rotate: "24deg" }],
                                    opacity: 0.9,
                                }}
                            />

                            {/* Organic blob — asymmetric radii give a hand-drawn premium curve.
                                The video FILLS the whole curved blob (cover) so its own
                                background/aspect never leaves yellow gaps around it. */}
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

                            {/* Floating accent dot + tiny ring for depth */}
                            <View
                                style={{
                                    position: "absolute",
                                    bottom: BLOB_SIZE * 0.1,
                                    left: width / 2 - BLOB_SIZE / 2 - ms(8),
                                    width: ms(12),
                                    height: ms(12),
                                    borderRadius: 6,
                                    backgroundColor: ACCENT,
                                }}
                            />
                            <View
                                style={{
                                    position: "absolute",
                                    top: BLOB_SIZE * 0.06,
                                    right: width / 2 - BLOB_SIZE / 2 - ms(4),
                                    width: ms(18),
                                    height: ms(18),
                                    borderRadius: ms(9),
                                    borderWidth: 2.5,
                                    borderColor: ACCENT,
                                    opacity: 0.8,
                                }}
                            />
                        </Animated.View>

                        {/* ── Title with curved brush-stroke highlight ── */}
                        <Animated.View style={{ alignItems: "center", transform: [{ scale: titleSize }] }}>
                            <View style={{ marginTop: ms(10), alignItems: "center", justifyContent: "center" }}>
                                {/* Curved brush-stroke behind "Password?" */}
                                <View
                                    pointerEvents="none"
                                    style={{
                                        position: "absolute",
                                        bottom: ms(2),
                                        right: -ms(6),
                                        width: ms(104),
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
                                {/* Soft curved echo circle behind the title */}
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
                                        opacity: 0.9,
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: ms(26),
                                        color: INK,
                                        fontFamily: FONT.displayHeavy,
                                        letterSpacing: -0.8,
                                    }}
                                >
                                    Forgot Password?
                                </Text>
                            </View>

                            {/* Curved accent underline — tapered wave */}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, marginBottom: 4 }}>
                                <View style={{ width: ms(10), height: 5, borderRadius: 3, backgroundColor: ACCENT_SOFT }} />
                                <View style={{ width: ms(46), height: 5, borderRadius: 3, backgroundColor: ACCENT }} />
                                <View style={{ width: ms(10), height: 5, borderRadius: 3, backgroundColor: ACCENT_SOFT }} />
                            </View>

                            <Animated.View style={{ height: subHeight, opacity: headerOpacity, overflow: "hidden", paddingHorizontal: 10 }}>
                                <Text style={{ textAlign: "center", color: MUTED, fontFamily: FONT.light, fontSize: ms(13), lineHeight: ms(19) }}>
                                    {"Don't worry, it happens! Enter your registered\nmobile number and we'll send you an OTP to reset it."}
                                </Text>
                            </Animated.View>
                        </Animated.View>
                    </Animated.View>

                    {/* ── Mobile Number ── */}
                    <View style={{ marginBottom: ms(4) }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: ms(8), marginLeft: ms(4) }}>
                            {/* Icon chip like the login page */}
                            <View
                                style={{
                                    width: ms(22),
                                    height: ms(22),
                                    borderRadius: 8,
                                    backgroundColor: ACCENT_SOFT,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="call-outline" size={ms(12)} color={ACCENT_DEEP} />
                            </View>
                            <Text style={{ fontSize: ms(13), color: "#374151", fontFamily: FONT.semibold }}>
                                Registered Mobile Number
                            </Text>
                        </View>
                        <Animated.View style={{ transform: [{ translateX: Animated.multiply(phoneShake, 6) }] }}>
                            <Animated.View
                                style={{
                                    ...inputBase,
                                    borderColor: touched && !phoneValid ? DANGER : phoneBorderColor,
                                    backgroundColor: phoneBg,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: ms(16),
                                        fontFamily: FONT.semibold,
                                        color: "#1F2937",
                                        marginRight: ms(10),
                                        borderRightWidth: 1,
                                        borderRightColor: "#D1D5DB",
                                        paddingRight: ms(10),
                                    }}
                                >
                                    +91
                                </Text>
                                <TextInput
                                    ref={phoneRef}
                                    placeholder="Enter mobile number"
                                    keyboardType="number-pad"
                                    maxLength={10}
                                    value={phoneNumber}
                                    onChangeText={(t) => {
                                        setPhoneNumber(t.replace(/[^0-9]/g, ""));
                                        if (errorType) hideError();
                                    }}
                                    onFocus={() => {
                                        focusedRef.current = "phone";
                                        Animated.timing(phoneFocusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
                                    }}
                                    onBlur={() => {
                                        focusedRef.current = null;
                                        Animated.timing(phoneFocusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
                                        setTouched(true);
                                    }}
                                    returnKeyType="done"
                                    autoComplete="tel"
                                    textContentType="telephoneNumber"
                                    onSubmitEditing={handleAction}
                                    accessibilityLabel="Registered mobile number"
                                    style={{ flex: 1, fontSize: ms(16), fontFamily: FONT.regular, color: "#1F2937", letterSpacing: 0.5 }}
                                    placeholderTextColor="#9CA3AF"
                                />
                                {phoneValid ? (
                                    <Ionicons name="checkmark-circle" size={20} color={SUCCESS} />
                                ) : phoneNumber.length > 0 ? (
                                    <Pressable hitSlop={10} onPress={() => setPhoneNumber("")} accessibilityLabel="Clear number">
                                        <Ionicons name="close-circle" size={18} color="#D1D5DB" />
                                    </Pressable>
                                ) : null}
                            </Animated.View>
                        </Animated.View>
                        {touched && !phoneValid ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: ms(6), marginLeft: ms(4) }}>
                                <Ionicons name="alert-circle" size={ms(13)} color={DANGER} />
                                <Text style={{ color: DANGER, fontSize: ms(12), fontFamily: FONT.regular }}>
                                    Enter a valid 10-digit mobile number
                                </Text>
                            </View>
                        ) : (
                            <Text style={{ color: FAINT, fontSize: ms(11.5), marginTop: ms(6), marginLeft: ms(4), fontFamily: FONT.light }}>
                                We&apos;ll send a one-time password to this number
                            </Text>
                        )}
                    </View>

                    {/* ── Error banner ── */}
                    {errorType && (
                        <Animated.View
                            accessibilityRole="alert"
                            style={{
                                opacity: notFoundAnim,
                                transform: [
                                    {
                                        translateY: notFoundAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-8, 0],
                                        }),
                                    },
                                ],
                                marginTop: ms(14),
                                backgroundColor: "#FEF2F2",
                                borderWidth: 1,
                                borderColor: "#FECACA",
                                borderRadius: 18,
                                padding: ms(13),
                                flexDirection: "row",
                                alignItems: "flex-start",
                                gap: 10,
                            }}
                        >
                            <View
                                style={{
                                    width: ms(34),
                                    height: ms(34),
                                    borderRadius: 12,
                                    backgroundColor: "#FEE2E2",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons
                                    name={
                                        errorType === "notFound" ? "person-remove-outline" :
                                            errorType === "noInternet" ? "wifi-outline" :
                                                errorType === "serverError" ? "server-outline" : "alert-circle-outline"
                                    }
                                    size={ms(17)}
                                    color={DANGER}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: "#991B1B", fontFamily: FONT.semibold, fontSize: ms(13.5) }}>
                                    {errorType === "notFound" ? "Account not found" :
                                        errorType === "noInternet" ? "No internet connection" :
                                            errorType === "serverError" ? "Server error" : "Error"}
                                </Text>
                                <Text style={{ color: "#B91C1C", fontFamily: FONT.regular, fontSize: ms(12.5), lineHeight: ms(18), marginTop: 2 }}>
                                    {errorType === "notFound"
                                        ? "No account exists with this mobile number. Please check the number or sign up first."
                                        : errorType === "noInternet"
                                            ? "Please check your network connection and try again."
                                            : errorType === "serverError"
                                                ? "Something went wrong on our end. Please try again later."
                                                : ""}
                                </Text>
                            </View>
                            <Pressable hitSlop={10} onPress={hideError} accessibilityLabel="Dismiss error">
                                <Ionicons name="close" size={ms(16)} color="#B91C1C" />
                            </Pressable>
                        </Animated.View>
                    )}


                    {/* ── Send OTP Button (morphing pill) ── */}
                    <View
                        style={{ alignItems: "center", justifyContent: "center", marginTop: ms(16) }}
                        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                    >
                        <Pressable
                            onPress={handleAction}
                            onPressIn={() =>
                                btnState === "idle" &&
                                !btnDisabled &&
                                Animated.spring(btnPress, { toValue: 0.96, friction: 6, useNativeDriver: true }).start()
                            }
                            onPressOut={() =>
                                btnState === "idle" &&
                                Animated.spring(btnPress, { toValue: 1, friction: 6, useNativeDriver: true }).start()
                            }
                            disabled={btnState !== "idle"}
                            accessibilityRole="button"
                            accessibilityLabel={btnLabel}
                            style={{ width: "100%", alignItems: "center" }}
                        >
                            <Animated.View style={{ transform: [{ scale: btnPress }], alignItems: "center" }}>
                                <Animated.View
                                    style={{
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: !btnDisabled ? ACCENT : "#F3F4F6",
                                        width: btnWidth,
                                        height: ms(56),
                                        borderRadius: btnRadius,
                                        shadowColor: ACCENT,
                                        shadowOpacity: !btnDisabled ? 0.4 : 0,
                                        shadowRadius: 12,
                                        shadowOffset: { width: 0, height: 4 },
                                        elevation: !btnDisabled ? 6 : 0,
                                        flexDirection: "row",
                                    }}
                                >
                                    <Animated.View style={{ opacity: textOpacity, position: "absolute", flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Ionicons
                                            name={cooldown > 0 ? "time-outline" : "paper-plane-outline"}
                                            size={ms(16)}
                                            color={!btnDisabled ? INK : FAINT}
                                        />
                                        <Text
                                            style={{
                                                fontSize: ms(16),
                                                fontFamily: FONT.display,
                                                letterSpacing: 0.3,
                                                color: !btnDisabled ? INK : FAINT,
                                            }}
                                        >
                                            {btnLabel}
                                        </Text>
                                    </Animated.View>

                                    <Animated.View style={{ opacity: loadingOpacity, position: "absolute" }}>
                                        <ActivityIndicator color={INK} size="small" />
                                    </Animated.View>

                                    <Animated.View style={{ opacity: iconOpacity, position: "absolute", flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Ionicons name="checkmark-circle" size={24} color={INK} />
                                    </Animated.View>
                                </Animated.View>
                            </Animated.View>
                        </Pressable>
                    </View>


                    {/* ── Divider + back to login ── */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: ms(14), gap: 10 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: BORDER_IDLE }} />
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <Ionicons name="shield-checkmark-outline" size={ms(12)} color={FAINT} />
                            <Text style={{ color: FAINT, fontFamily: FONT.regular, fontSize: ms(10.5), letterSpacing: 1 }}>
                                SECURE VERIFICATION
                            </Text>
                        </View>
                        <View style={{ flex: 1, height: 1, backgroundColor: BORDER_IDLE }} />
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: ms(12) }}>
                        <Text style={{ color: MUTED, fontFamily: FONT.regular, fontSize: ms(13.5) }}>
                            Remembered your password?{" "}
                        </Text>
                        <Pressable
                            hitSlop={10}
                            onPress={() => {
                                Haptics.selectionAsync();
                                onBack?.();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Back to login"
                            style={{ alignItems: "center" }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                <Text style={{ color: INK, fontFamily: FONT.display, fontSize: ms(14) }}>
                                    Login
                                </Text>
                                <Ionicons name="arrow-forward" size={ms(13)} color={INK} />
                            </View>
                            {/* Curved accent underline under the link */}
                            <View style={{ width: "85%", height: 3, borderRadius: 2, backgroundColor: ACCENT, marginTop: 2 }} />
                        </Pressable>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}
