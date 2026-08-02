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
   Same setup as the login + forgot-password pages. Load once in App.tsx:

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

/* ─────────────────────────── Config ───────────────────────────
   Mirror these limits on your backend — client-side limits alone
   are NOT security, they're just good UX. */
const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_RESEND_REQUESTS = 3;
const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

/* ── DEMO ONLY — replace with your real "verify OTP" API call.
   "1234" succeeds; anything else shows the "Incorrect OTP" error. */
const DEMO_CORRECT_OTP = "1234";

type OtpVerificationProps = {
    /** Phone number the OTP was sent to — shown masked in the subtitle,
        e.g. pass it from the forgot-password screen */
    phoneNumber?: string;
    /** Back button — e.g. () => navigation.goBack() */
    onBack?: () => void;
    /** Called when the OTP is verified successfully,
        e.g. () => navigation.replace("ResetPassword") */
    onVerified?: () => void;
    /** Called when user taps resend — call your "send OTP" API again */
    onResend?: () => void;
};

export default function OtpVerification({
    phoneNumber = "9876543210",
    onBack,
    onVerified,
    onResend,
}: OtpVerificationProps) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    /* Responsive scale — same ms() as the other pages */
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

    const headerVideo = require("../../assets/expo.icon/Assets/otp-verification-animation-gif-download-15000370.mp4");

    const player = useVideoPlayer(headerVideo, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    /* Masked phone — "98XXX XX210" style */
    const maskedPhone =
        phoneNumber.length === 10
            ? `+91 ${phoneNumber.slice(0, 2)}XXX XX${phoneNumber.slice(8)}`
            : `+91 ${phoneNumber}`;

    /* ─────────────── OTP boxes state ─────────────── */
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const boxRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

    // One scale animation per box — pops when a digit lands
    const boxPops = useRef(
        Array.from({ length: OTP_LENGTH }, () => new Animated.Value(1))
    ).current;

    const popBox = (i: number) => {
        boxPops[i].setValue(0.8);
        Animated.spring(boxPops[i], { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start();
    };

    const otpValue = digits.join("");
    const otpComplete = otpValue.length === OTP_LENGTH;

    const otpShake = useRef(new Animated.Value(0)).current;
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

    /* ── Error state: wrong OTP / attempts exhausted / server errors ── */
    const [otpError, setOtpError] = useState<"wrong" | "attemptsLeft" | "serverError" | "noInternet" | null>(null);
    const [verifyAttempts, setVerifyAttempts] = useState(0);
    const errorAnim = useRef(new Animated.Value(0)).current;
    const attemptsExhausted = verifyAttempts >= MAX_VERIFY_ATTEMPTS;

    const showError = (type: "wrong" | "serverError" | "noInternet" = "wrong") => {
        setOtpError(type);
        Animated.spring(errorAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
    };
    const hideError = () => {
        Animated.timing(errorAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
            setOtpError(null);
        });
    };

    const handleDigitChange = (text: string, index: number) => {
        if (otpError) hideError();
        const cleaned = text.replace(/[^0-9]/g, "");

        // Paste support: full OTP pasted into any box
        if (cleaned.length >= OTP_LENGTH) {
            const next = cleaned.slice(0, OTP_LENGTH).split("");
            setDigits(next);
            next.forEach((_, i) => popBox(i));
            boxRefs.current[OTP_LENGTH - 1]?.focus();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            return;
        }

        const next = [...digits];

        if (cleaned.length === 0) {
            next[index] = "";
            setDigits(next);
            return;
        }

        // Take the last typed char (handles fast typing over a filled box)
        next[index] = cleaned[cleaned.length - 1];
        setDigits(next);
        popBox(index);
        Haptics.selectionAsync();

        // Auto-advance
        if (index < OTP_LENGTH - 1) {
            boxRefs.current[index + 1]?.focus();
        } else {
            Keyboard.dismiss();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && digits[index] === "" && index > 0) {
            const next = [...digits];
            next[index - 1] = "";
            setDigits(next);
            boxRefs.current[index - 1]?.focus();
        }
    };

    /* ─────────────── OTP expiry countdown ─────────────── */
    const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_SECONDS);
    const expiryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startExpiryTimer = () => {
        setExpirySeconds(OTP_EXPIRY_SECONDS);
        if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
        expiryTimerRef.current = setInterval(() => {
            setExpirySeconds((prev) => {
                if (prev <= 1) {
                    if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        startExpiryTimer();
        return () => {
            if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
        };
    }, []);

    const expired = expirySeconds === 0;
    const expiryLabel = `${Math.floor(expirySeconds / 60)}:${String(expirySeconds % 60).padStart(2, "0")}`;

    /* ─────────────── Resend cooldown + rate limit ─────────────── */
    const [resendCount, setResendCount] = useState(0);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
    const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const resendLimitReached = resendCount >= MAX_RESEND_REQUESTS;

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
        startCooldown();
        return () => {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
        };
    }, []);

    const handleResend = () => {
        if (cooldown > 0 || resendLimitReached) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setResendCount((c) => c + 1);
        setDigits(Array(OTP_LENGTH).fill(""));
        setVerifyAttempts(0);
        if (otpError) hideError();
        startCooldown();
        startExpiryTimer();
        boxRefs.current[0]?.focus();
        onResend?.(); // TODO: call your real "send OTP" API again here
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

    const resetButtonToIdle = () => {
        setBtnState("idle");
        Animated.parallel([
            Animated.timing(loadingOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(iconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(btnWidthAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.exp), useNativeDriver: false }),
            Animated.timing(textOpacity, { toValue: 1, duration: 250, delay: 150, useNativeDriver: true }),
        ]).start();
    };

    const handleVerify = () => {
        if (btnState !== "idle") return;
        if (otpError) hideError();

        if (expired) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        if (!otpComplete) {
            shake(otpShake);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const firstEmpty = digits.findIndex((d) => d === "");
            boxRefs.current[firstEmpty === -1 ? 0 : firstEmpty]?.focus();
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

        // TODO: replace this timeout with your real "verify OTP" API call.
        // On a real backend, 401/invalid-otp → wrong OTP flow below.
        successTimerRef.current = setTimeout(() => {
            if (otpValue !== DEMO_CORRECT_OTP) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setVerifyAttempts((a) => a + 1);
                resetButtonToIdle();
                shake(otpShake);
                setDigits(Array(OTP_LENGTH).fill(""));
                showError("wrong");
                boxRefs.current[0]?.focus();
                return;
            }

            setBtnState("success");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Animated.parallel([
                Animated.timing(loadingOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
                Animated.timing(iconOpacity, { toValue: 1, duration: 280, delay: 100, useNativeDriver: true }),
            ]).start();

            successTimerRef.current = setTimeout(() => {
                onVerified?.(); // e.g. navigation.replace("ResetPassword")
            }, 900);
        }, 1600);
    };

    const btnWidth = btnWidthAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [64, containerWidth || 1],
    });
    const btnRadius = btnWidthAnim.interpolate({ inputRange: [0, 1], outputRange: [32, 20] });

    const BOX_SIZE = Math.min((width - ms(24) * 2 - ms(10) * (OTP_LENGTH - 1)) / OTP_LENGTH, ms(52));
    const attemptsLeft = MAX_VERIFY_ATTEMPTS - verifyAttempts;
    const btnDisabled = !otpComplete || expired || attemptsExhausted;

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
                                    fontSize: BLOB_SIZE * 0.36,
                                    fontFamily: FONT.displayHeavy,
                                    color: "#F3F4F6",
                                    letterSpacing: ms(5),
                                    transform: [{ rotate: "-4deg" }],
                                }}
                            >
                                VERIFY
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

                            {/* Organic blob — video FILLS the curved shape (cover),
                                so its own background/aspect never leaves gaps */}
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

                            {/* Floating accent ring + dot for depth */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    top: 6,
                                    right: width * 0.16,
                                    width: ms(22),
                                    height: ms(22),
                                    borderRadius: ms(11),
                                    borderWidth: 3,
                                    borderColor: ACCENT,
                                }}
                            />
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    bottom: 10,
                                    left: width * 0.14,
                                    width: ms(12),
                                    height: ms(12),
                                    borderRadius: ms(6),
                                    backgroundColor: ACCENT,
                                }}
                            />
                        </Animated.View>

                        <Animated.View style={{ alignItems: "center", transform: [{ scale: titleSize }] }}>
                            {/* Title with curved accent sweep BEHIND the text */}
                            <View style={{ marginTop: ms(10), alignItems: "center", justifyContent: "center" }}>
                                {/* Curved brush-stroke highlight behind "OTP" */}
                                <View
                                    pointerEvents="none"
                                    style={{
                                        position: "absolute",
                                        bottom: ms(2),
                                        left: -ms(4),
                                        width: ms(76),
                                        height: ms(14),
                                        backgroundColor: ACCENT,
                                        opacity: 0.85,
                                        borderTopLeftRadius: ms(4),
                                        borderTopRightRadius: ms(14),
                                        borderBottomRightRadius: ms(4),
                                        borderBottomLeftRadius: ms(14),
                                        transform: [{ rotate: "1.5deg" }],
                                    }}
                                />
                                {/* Soft curved echo behind the title for depth */}
                                <View
                                    pointerEvents="none"
                                    style={{
                                        position: "absolute",
                                        top: -ms(6),
                                        right: -ms(18),
                                        width: ms(44),
                                        height: ms(44),
                                        borderRadius: ms(22),
                                        backgroundColor: ACCENT_SOFT,
                                        opacity: 0.9,
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: ms(28),
                                        color: INK,
                                        fontFamily: FONT.displayHeavy,
                                        letterSpacing: -0.8,
                                    }}
                                >
                                    OTP Verification
                                </Text>
                            </View>

                            {/* Curved accent underline — tapered wave feel */}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, marginBottom: 4 }}>
                                <View style={{ width: ms(10), height: 5, borderRadius: 3, backgroundColor: ACCENT_SOFT }} />
                                <View style={{ width: ms(46), height: 5, borderRadius: 3, backgroundColor: ACCENT }} />
                                <View style={{ width: ms(10), height: 5, borderRadius: 3, backgroundColor: ACCENT_SOFT }} />
                            </View>
                        </Animated.View>

                        <Animated.View style={{ height: subHeight, opacity: headerOpacity, overflow: "hidden" }}>
                            <Text style={{ textAlign: "center", color: MUTED, fontFamily: FONT.light, fontSize: ms(13.5), lineHeight: ms(19) }}>
                                {`Enter the ${OTP_LENGTH}-digit code we sent to `}
                                <Text style={{ fontFamily: FONT.semibold, color: INK }}>{maskedPhone}</Text>
                            </Text>
                        </Animated.View>
                    </Animated.View>

                    {/* ── OTP expiry chip ── */}
                    <View style={{ alignItems: "center", marginBottom: ms(14) }}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                                backgroundColor: expired ? "#FEF2F2" : ACCENT_SOFT,
                                borderWidth: 1,
                                borderColor: expired ? "#FECACA" : "#F5E6A3",
                                borderRadius: 999,
                                paddingHorizontal: ms(14),
                                paddingVertical: 6,
                            }}
                        >
                            <Ionicons
                                name={expired ? "alert-circle-outline" : "time-outline"}
                                size={ms(13)}
                                color={expired ? DANGER : ACCENT_DEEP}
                            />
                            <Text
                                style={{
                                    fontSize: ms(12),
                                    color: expired ? "#B91C1C" : "#8A7100",
                                    fontFamily: FONT.semibold,
                                    letterSpacing: 0.4,
                                }}
                            >
                                {expired ? "OTP expired — request a new one" : `Code expires in ${expiryLabel}`}
                            </Text>
                        </View>
                    </View>

                    {/* ── OTP boxes ── */}
                    <Animated.View
                        style={{
                            flexDirection: "row",
                            justifyContent: "center",
                            gap: ms(10),
                            transform: [
                                {
                                    translateX: otpShake.interpolate({
                                        inputRange: [-1, 1],
                                        outputRange: [-8, 8],
                                    }),
                                },
                            ],
                        }}
                    >
                        {digits.map((digit, i) => {
                            const isFocused = focusedIndex === i;
                            const hasError = otpError === "wrong";
                            return (
                                <Animated.View key={i} style={{ transform: [{ scale: boxPops[i] }] }}>
                                    <TextInput
                                        ref={(r) => {
                                            boxRefs.current[i] = r;
                                        }}
                                        value={digit}
                                        onChangeText={(t) => handleDigitChange(t, i)}
                                        onKeyPress={(e) => handleKeyPress(e, i)}
                                        onFocus={() => setFocusedIndex(i)}
                                        onBlur={() => setFocusedIndex(null)}
                                        keyboardType="number-pad"
                                        textContentType="oneTimeCode"
                                        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
                                        maxLength={i === 0 ? OTP_LENGTH : 1}
                                        selectTextOnFocus
                                        accessibilityLabel={`OTP digit ${i + 1} of ${OTP_LENGTH}`}
                                        style={{
                                            width: BOX_SIZE,
                                            height: BOX_SIZE * 1.12,
                                            borderRadius: 16,
                                            borderWidth: 1.5,
                                            borderColor: hasError ? DANGER : isFocused ? ACCENT : digit ? "#E3E5E9" : BORDER_IDLE,
                                            backgroundColor: hasError ? "#FEF2F2" : isFocused || digit ? "#FFFFFF" : BG_IDLE,
                                            textAlign: "center",
                                            fontSize: ms(20),
                                            fontFamily: FONT.display,
                                            color: INK,
                                            shadowColor: "#0F172A",
                                            shadowOpacity: isFocused ? 0.08 : 0.03,
                                            shadowRadius: 10,
                                            shadowOffset: { width: 0, height: 5 },
                                            elevation: isFocused ? 3 : 1,
                                        }}
                                    />
                                </Animated.View>
                            );
                        })}
                    </Animated.View>

                    {/* ── Error banner ── */}
                    {otpError && (
                        <Animated.View
                            accessibilityRole="alert"
                            style={{
                                opacity: errorAnim,
                                transform: [
                                    {
                                        translateY: errorAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
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
                                        otpError === "noInternet" ? "wifi-outline" :
                                            otpError === "serverError" ? "server-outline" : "close-circle-outline"
                                    }
                                    size={ms(17)}
                                    color={DANGER}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: "#991B1B", fontFamily: FONT.semibold, fontSize: ms(13.5) }}>
                                    {otpError === "noInternet" ? "No internet connection" :
                                        otpError === "serverError" ? "Server error" :
                                            attemptsExhausted ? "Too many wrong attempts" : "Incorrect OTP"}
                                </Text>
                                <Text style={{ color: "#B91C1C", fontFamily: FONT.regular, fontSize: ms(12.5), lineHeight: ms(18), marginTop: 2 }}>
                                    {otpError === "noInternet"
                                        ? "Please check your network connection and try again."
                                        : otpError === "serverError"
                                            ? "Something went wrong on our end. Please try again later."
                                            : attemptsExhausted
                                                ? "You've used all verification attempts. Please request a new OTP."
                                                : `The code you entered is wrong. ${attemptsLeft} ${attemptsLeft === 1 ? "attempt" : "attempts"} left.`}
                                </Text>
                            </View>
                            <Pressable hitSlop={10} onPress={hideError} accessibilityLabel="Dismiss error">
                                <Ionicons name="close" size={ms(16)} color="#B91C1C" />
                            </Pressable>
                        </Animated.View>
                    )}

                    {/* ── Verify Button (morphing pill) ── */}
                    <View
                        style={{ alignItems: "center", justifyContent: "center", marginTop: ms(18) }}
                        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                    >
                        <Animated.View style={{ transform: [{ scale: btnPress }] }}>
                            <Pressable
                                onPress={handleVerify}
                                onPressIn={() => {
                                    if (btnState === "idle" && !btnDisabled) {
                                        Animated.spring(btnPress, { toValue: 0.96, friction: 5, tension: 300, useNativeDriver: true }).start();
                                    }
                                }}
                                onPressOut={() => {
                                    Animated.spring(btnPress, { toValue: 1, friction: 5, tension: 300, useNativeDriver: true }).start();
                                }}
                                disabled={btnState !== "idle"}
                                accessibilityRole="button"
                                accessibilityLabel="Verify OTP"
                            >
                                <Animated.View
                                    style={{
                                        width: btnWidth,
                                        height: 64,
                                        borderRadius: btnRadius,
                                        backgroundColor:
                                            btnState === "success" ? SUCCESS : btnDisabled && btnState === "idle" ? "#F1F2F4" : ACCENT,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        shadowColor: btnState === "success" ? SUCCESS : ACCENT,
                                        shadowOpacity: btnDisabled && btnState === "idle" ? 0 : 0.35,
                                        shadowRadius: 14,
                                        shadowOffset: { width: 0, height: 8 },
                                        elevation: btnDisabled && btnState === "idle" ? 0 : 6,
                                    }}
                                >
                                    <Animated.View
                                        style={{
                                            opacity: textOpacity,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 8,
                                            position: "absolute",
                                        }}
                                    >
                                        <Ionicons
                                            name="shield-checkmark-outline"
                                            size={ms(17)}
                                            color={btnDisabled ? FAINT : INK}
                                        />
                                        <Text
                                            style={{
                                                fontSize: ms(16),
                                                fontFamily: FONT.display,
                                                letterSpacing: 0.4,
                                                color: btnDisabled ? FAINT : INK,
                                            }}
                                        >
                                            Verify OTP
                                        </Text>
                                    </Animated.View>

                                    <Animated.View style={{ opacity: loadingOpacity, position: "absolute" }}>
                                        <ActivityIndicator color={INK} />
                                    </Animated.View>

                                    <Animated.View style={{ opacity: iconOpacity, position: "absolute" }}>
                                        <Ionicons name="checkmark" size={30} color="#FFFFFF" />
                                    </Animated.View>
                                </Animated.View>
                            </Pressable>
                        </Animated.View>
                    </View>

                    {/* ── Resend row with rate limit ── */}
                    <View style={{ alignItems: "center", marginTop: ms(16) }}>
                        {resendLimitReached ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                <Ionicons name="alert-circle-outline" size={ms(13)} color={DANGER} />
                                <Text style={{ color: DANGER, fontFamily: FONT.semibold, fontSize: ms(12.5) }}>
                                    Resend limit reached. Try again after 15 minutes.
                                </Text>
                            </View>
                        ) : cooldown > 0 ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                <Ionicons name="time-outline" size={ms(13)} color={FAINT} />
                                <Text style={{ color: FAINT, fontFamily: FONT.regular, fontSize: ms(13) }}>
                                    {"Didn't get the code? Resend in "}
                                    <Text style={{ fontFamily: FONT.semibold, color: MUTED }}>{cooldown}s</Text>
                                </Text>
                            </View>
                        ) : (
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{ color: MUTED, fontFamily: FONT.regular, fontSize: ms(13.5) }}>
                                    {"Didn't get the code? "}
                                </Text>
                                <Pressable
                                    hitSlop={10}
                                    onPress={handleResend}
                                    accessibilityRole="button"
                                    accessibilityLabel="Resend OTP"
                                    style={{ alignItems: "center" }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                        <Text style={{ color: INK, fontFamily: FONT.display, fontSize: ms(13.5) }}>
                                            Resend OTP
                                        </Text>
                                        <Ionicons name="refresh" size={ms(13)} color={INK} />
                                    </View>
                                    {/* Curved accent underline under the link */}
                                    <View style={{ width: "86%", height: 3, borderRadius: 2, backgroundColor: ACCENT, marginTop: 2 }} />
                                </Pressable>
                            </View>
                        )}
                        {!resendLimitReached && (
                            <Text style={{ color: FAINT, fontFamily: FONT.light, fontSize: ms(11.5), marginTop: 6 }}>
                                {`${MAX_RESEND_REQUESTS - resendCount} of ${MAX_RESEND_REQUESTS} resends left`}
                            </Text>
                        )}
                    </View>

                    {/* ── Divider ── */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: ms(14), gap: 10 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: BORDER_IDLE }} />
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <Ionicons name="lock-closed-outline" size={ms(12)} color={FAINT} />
                            <Text style={{ color: FAINT, fontFamily: FONT.regular, fontSize: ms(11), letterSpacing: 1.2 }}>
                                SECURE VERIFICATION
                            </Text>
                        </View>
                        <View style={{ flex: 1, height: 1, backgroundColor: BORDER_IDLE }} />
                    </View>

                    {/* ── Change number link ── */}
                    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: ms(12) }}>
                        <Text style={{ color: FAINT, fontFamily: FONT.light, fontSize: ms(12) }}>
                            Wrong number?
                        </Text>
                        <Pressable hitSlop={8} onPress={onBack}>
                            <Text style={{ color: "#1F2937", fontFamily: FONT.semibold, marginLeft: 4, fontSize: ms(12), textDecorationLine: "underline" }}>
                                Change it
                            </Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}
