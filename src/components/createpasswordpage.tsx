import React, { useState, useRef, useCallback, useEffect } from "react";
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
    KeyboardAvoidingView,
    useWindowDimensions,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { supabase } from "../services/supabase";

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

/* ─────────────────────────── Fonts ───────────────────────────
   PREMIUM PAIRING — Sora (display headings) + Inter (body).
   Same setup as the login / forgot-password / OTP pages:

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

const MIN_PASSWORD_LENGTH = 6;

/* ── All error messages in one place ── */
const ERRORS = {
    empty: {
        title: "Please enter a new password.",
        desc: "Enter a new password to continue.",
        icon: "lock-open-outline" as const,
    },
    tooShort: {
        title: "Password is too short.",
        desc: `Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
        icon: "resize-outline" as const,
    },
    mismatch: {
        title: "Passwords do not match.",
        desc: "The new password and confirm password must be the same.",
        icon: "swap-horizontal-outline" as const,
    },
    server: {
        title: "Server error.",
        desc: "Something went wrong on our end. Please try again later.",
        icon: "cloud-offline-outline" as const,
    },
    network: {
        title: "No internet connection.",
        desc: "Please check your network connection and try again.",
        icon: "wifi-outline" as const,
    },
};
type ErrorKey = keyof typeof ERRORS;

type CreatePasswordProps = {
    phone?: string;
    onBack?: () => void;
    /** Called after the password is updated successfully.
        Navigate to your success page here — nothing is shown on this screen.
        e.g. () => navigation.replace("PasswordSuccess") */
    onSuccess?: () => void;
};

export default function CreatePasswordPage({ phone, onBack, onSuccess }: CreatePasswordProps) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    /* ── Responsive scale — same system as the other auth pages ── */
    const ms = useCallback(
        (size: number, factor = 0.55) => {
            const scaled = (width / 375) * size;
            return Math.round(size + (scaled - size) * factor);
        },
        [width]
    );
    const isSmallScreen = height < 700;

    // Hero video: compact so everything fits WITHOUT scrolling
    const IMAGE_SIZE = Math.min(width * (isSmallScreen ? 0.32 : 0.4), 150);
    const BLOB_SIZE = IMAGE_SIZE * 1.12;

    const headerVideo = require("../../assets/expo.icon/Assets/girl-looking-website-locked-animation-gif-download-15071844.mp4");

    const player = useVideoPlayer(headerVideo, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    /* ── Form state ── */
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<"password" | "confirm" | null>(null);

    const [btnState, setBtnState] = useState<"idle" | "loading" | "success">("idle");
    const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);

    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    /* ── Animations ── */
    const btnWidthAnim = useRef(new Animated.Value(1)).current;
    const btnPressAnim = useRef(new Animated.Value(1)).current;
    const textOpacity = useRef(new Animated.Value(1)).current;
    const loadingOpacity = useRef(new Animated.Value(0)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;
    const errorAnim = useRef(new Animated.Value(0)).current;
    const passShake = useRef(new Animated.Value(0)).current;
    const confirmShake = useRef(new Animated.Value(0)).current;
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [containerWidth, setContainerWidth] = useState(width - ms(48));

    /* ── Keyboard-aware header collapse (same as the other auth pages) ──
       Keyboard opens → the hero video collapses away and inputs slide up,
       so both password fields stay comfortably visible while typing. */
    const headerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const showSub = Keyboard.addListener(showEvt, () => {
            Animated.timing(headerAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
        });
        const hideSub = Keyboard.addListener(hideEvt, () => {
            Animated.timing(headerAnim, { toValue: 0, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
        });
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [headerAnim]);

    const heroHeight = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [BLOB_SIZE * 1.1 + ms(6), 0] });
    const heroOpacity = headerAnim.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: "clamp" });
    const subHeight = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [ms(40), 0] });

    useEffect(() => {
        return () => {
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, []);

    const shake = (anim: Animated.Value) => {
        anim.setValue(0);
        Animated.sequence([
            Animated.timing(anim, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(anim, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
            Animated.timing(anim, { toValue: -6, duration: 50, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const showError = (key: ErrorKey, shakeTarget?: Animated.Value) => {
        setErrorKey(key);
        // Restart the pop animation even if a banner is already visible,
        // so tapping submit again re-emphasizes the error instead of hiding it.
        errorAnim.setValue(0);
        Animated.spring(errorAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
        if (shakeTarget) shake(shakeTarget);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    const hideError = () => {
        Animated.timing(errorAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
            setErrorKey(null);
        });
    };

    const resetButtonToIdle = () => {
        setBtnState("idle");
        Animated.parallel([
            Animated.timing(loadingOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(iconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(btnWidthAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.exp), useNativeDriver: false }),
            Animated.timing(textOpacity, { toValue: 1, duration: 250, delay: 150, useNativeDriver: true }),
        ]).start();
    };

    /* ── Password strength (live meter) ── */
    const strength = (() => {
        if (!password) return 0;
        let s = 0;
        if (password.length >= MIN_PASSWORD_LENGTH) s++;
        if (password.length >= 10) s++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
        if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) s++;
        return s; // 0-4
    })();
    const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
    const strengthColor = ["transparent", DANGER, "#F59E0B", "#84CC16", SUCCESS][strength];

    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const mismatchVisible = confirmPassword.length > 0 && password !== confirmPassword;

    const handleSubmit = () => {
        if (btnState !== "idle") return;
        // NOTE: we do NOT hide the error here — the banner only disappears
        // when the user starts typing (onChangeText) or dismisses it manually.

        /* ── Validation exceptions ── */
        if (!password.trim()) {
            showError("empty", passShake);
            passwordRef.current?.focus();
            return;
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            showError("tooShort", passShake);
            passwordRef.current?.focus();
            return;
        }
        if (password !== confirmPassword) {
            showError("mismatch", confirmShake);
            confirmRef.current?.focus();
            return;
        }

        Keyboard.dismiss();
        setBtnState("loading");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        Animated.timing(btnWidthAnim, { toValue: 0, duration: 320, easing: Easing.out(Easing.exp), useNativeDriver: false }).start();
        Animated.parallel([
            Animated.timing(textOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(loadingOpacity, { toValue: 1, duration: 280, delay: 100, useNativeDriver: true }),
        ]).start();

        // Update password in Supabase Auth & DB
        (async () => {
            try {
                let updated = false;

                // If phone is provided, reset password via authService
                if (phone) {
                    const { resetPassword } = await import("../services/authService");
                    const res = await resetPassword(phone, password);
                    if (res.success) {
                        updated = true;
                    }
                }

                // If not updated yet or active session exists, update user password directly
                if (!updated) {
                    const { error: updateErr } = await supabase.auth.updateUser({ password });
                    if (!updateErr) {
                        updated = true;
                    }
                }

                setBtnState("success");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Animated.parallel([
                    Animated.timing(loadingOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
                    Animated.timing(iconOpacity, { toValue: 1, duration: 280, delay: 100, useNativeDriver: true }),
                ]).start();

                successTimerRef.current = setTimeout(() => {
                    onSuccess?.();
                }, 700);
            } catch (err) {
                console.error("Password update exception:", err);
                resetButtonToIdle();
                showError("server", passShake);
            }
        })();
    };

    const btnWidth = btnWidthAnim.interpolate({ inputRange: [0, 1], outputRange: [ms(56), containerWidth] });
    const btnRadius = btnWidthAnim.interpolate({ inputRange: [0, 1], outputRange: [ms(28), 20] });

    const formValid = password.length >= MIN_PASSWORD_LENGTH && passwordsMatch;
    const err = errorKey ? ERRORS[errorKey] : null;

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            {/* ── Curved yellow backdrop sweep (top-right) ── */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -width * 0.42,
                    right: -width * 0.34,
                    width: width * 0.85,
                    height: width * 0.85,
                    borderRadius: width * 0.425,
                    backgroundColor: ACCENT_SOFT,
                    opacity: 0.55,
                }}
            />
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: -width * 0.3,
                    right: -width * 0.26,
                    width: width * 0.62,
                    height: width * 0.62,
                    borderRadius: width * 0.31,
                    borderWidth: 1.5,
                    borderColor: "#F5E6A3",
                    opacity: 0.7,
                }}
            />
            {/* ── Curved accent dot (bottom-left) ── */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    bottom: -width * 0.2,
                    left: -width * 0.18,
                    width: width * 0.4,
                    height: width * 0.4,
                    borderRadius: width * 0.2,
                    backgroundColor: ACCENT_SOFT,
                    opacity: 0.4,
                }}
            />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        // flexGrow + collapsing hero = when the keyboard opens the
                        // video shrinks away and the inputs slide up into view.
                        flexGrow: 1,
                        justifyContent: "center",
                        paddingTop: 8,
                        paddingBottom: Math.max(insets.bottom, 16),
                        paddingHorizontal: ms(24),
                    }}
                >
                    {/* ── Back button ── */}
                    <View style={{ position: "absolute", top: insets.top + 8, left: ms(20), zIndex: 10 }}>
                        <Pressable
                            onPress={() => {
                                Haptics.selectionAsync();
                                onBack?.();
                            }}
                            hitSlop={12}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                            style={({ pressed }) => ({
                                width: ms(40),
                                height: ms(40),
                                borderRadius: 14,
                                backgroundColor: pressed ? ACCENT_SOFT : BG_IDLE,
                                borderWidth: 1,
                                borderColor: pressed ? ACCENT : BORDER_IDLE,
                                alignItems: "center",
                                justifyContent: "center",
                                transform: [{ scale: pressed ? 0.94 : 1 }],
                            })}
                        >
                            <Ionicons name="arrow-back" size={ms(19)} color={INK} />
                        </Pressable>
                    </View>

                    {/* ── Hero video inside curved blob — collapses when the keyboard opens ── */}
                    <Animated.View
                        style={{
                            alignItems: "center",
                            marginTop: insets.top + ms(6),
                            height: heroHeight,
                            opacity: heroOpacity,
                            overflow: "hidden",
                        }}
                    >
                        <View style={{ width: BLOB_SIZE * 1.1, height: BLOB_SIZE * 1.1, alignItems: "center", justifyContent: "center" }}>
                            {/* Giant watermark word behind the blob */}
                            <Text
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    fontSize: BLOB_SIZE * 0.38,
                                    fontFamily: FONT.displayHeavy,
                                    color: "#F3F4F6",
                                    letterSpacing: ms(6),
                                    transform: [{ rotate: "-4deg" }],
                                }}
                            >
                                SECURE
                            </Text>

                            {/* Curved arc stroke hugging the blob */}
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

                            {/* Organic blob — video FILLS the curved shape (cover), no gaps */}
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

                            {/* Floating accent ring + dot */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    top: ms(4),
                                    right: ms(2),
                                    width: ms(18),
                                    height: ms(18),
                                    borderRadius: ms(9),
                                    borderWidth: 3,
                                    borderColor: ACCENT,
                                    backgroundColor: "#FFFFFF",
                                }}
                            />
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    bottom: ms(10),
                                    left: ms(2),
                                    width: ms(10),
                                    height: ms(10),
                                    borderRadius: ms(5),
                                    backgroundColor: ACCENT,
                                }}
                            />
                        </View>
                    </Animated.View>

                    {/* ── Title with curved brush-stroke highlight ── */}
                    <View style={{ alignItems: "center", marginTop: ms(10) }}>
                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                            {/* Brush-stroke sweep behind "Password" */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    bottom: ms(2),
                                    right: -ms(6),
                                    width: ms(120),
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
                            {/* Soft echo circle */}
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
                                    textAlign: "center",
                                }}
                            >
                                Create New Password
                            </Text>
                        </View>

                        {/* Tapered wave underline */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, marginBottom: 4 }}>
                            <View style={{ width: ms(10), height: 5, borderRadius: 3, backgroundColor: ACCENT_SOFT }} />
                            <View style={{ width: ms(46), height: 5, borderRadius: 3, backgroundColor: ACCENT }} />
                            <View style={{ width: ms(10), height: 5, borderRadius: 3, backgroundColor: ACCENT_SOFT }} />
                        </View>

                        {/* Subtitle also collapses when the keyboard opens */}
                        <Animated.View style={{ height: subHeight, opacity: heroOpacity, overflow: "hidden" }}>
                            <Text
                                style={{
                                    textAlign: "center",
                                    color: MUTED,
                                    fontFamily: FONT.light,
                                    fontSize: ms(13.5),
                                    lineHeight: ms(19),
                                    paddingHorizontal: ms(12),
                                }}
                            >
                                Your new password must be different from previously used passwords.
                            </Text>
                        </Animated.View>
                    </View>

                    {/* ── New Password ── */}
                    <View style={{ marginTop: ms(18), marginBottom: ms(12) }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 7, marginLeft: 2 }}>
                            <View
                                style={{
                                    width: ms(24),
                                    height: ms(24),
                                    borderRadius: 9,
                                    backgroundColor: ACCENT_SOFT,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="lock-closed" size={ms(12)} color={ACCENT_DEEP} />
                            </View>
                            <Text style={{ color: INK, fontSize: ms(13), fontFamily: FONT.semibold }}>New Password</Text>
                        </View>

                        <Animated.View style={{ transform: [{ translateX: passShake }] }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    height: ms(54),
                                    backgroundColor: focusedField === "password" ? "#FFFFFF" : BG_IDLE,
                                    borderRadius: 20,
                                    borderWidth: 1.5,
                                    borderColor:
                                        errorKey === "empty" || errorKey === "tooShort"
                                            ? DANGER
                                            : focusedField === "password"
                                                ? ACCENT
                                                : "transparent",
                                    paddingHorizontal: ms(16),
                                    shadowColor: "#0F172A",
                                    shadowOpacity: focusedField === "password" ? 0.06 : 0,
                                    shadowRadius: 12,
                                    shadowOffset: { width: 0, height: 4 },
                                    elevation: focusedField === "password" ? 2 : 0,
                                }}
                            >
                                <Ionicons
                                    name="key-outline"
                                    size={ms(19)}
                                    color={focusedField === "password" ? INK : FAINT}
                                    style={{ marginRight: ms(11) }}
                                />
                                <TextInput
                                    ref={passwordRef}
                                    style={{ flex: 1, fontSize: ms(15), fontFamily: FONT.regular, color: INK }}
                                    placeholder="Enter new password"
                                    placeholderTextColor={FAINT}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    returnKeyType="next"
                                    onSubmitEditing={() => confirmRef.current?.focus()}
                                    onChangeText={(t) => {
                                        setPassword(t);
                                        if (errorKey) hideError();
                                    }}
                                    onFocus={() => setFocusedField("password")}
                                    onBlur={() => setFocusedField(null)}
                                    accessibilityLabel="New password"
                                />
                                <Pressable
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setShowPassword(!showPassword);
                                    }}
                                    hitSlop={10}
                                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                                >
                                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={ms(19)} color={FAINT} />
                                </Pressable>
                            </View>
                        </Animated.View>

                        {/* Live strength meter */}
                        {password.length > 0 && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginLeft: 2 }}>
                                <View style={{ flexDirection: "row", gap: 4, flex: 1 }}>
                                    {[1, 2, 3, 4].map((i) => (
                                        <View
                                            key={i}
                                            style={{
                                                flex: 1,
                                                height: 4,
                                                borderRadius: 2,
                                                backgroundColor: i <= strength ? strengthColor : BORDER_IDLE,
                                            }}
                                        />
                                    ))}
                                </View>
                                <Text style={{ color: strengthColor, fontFamily: FONT.semibold, fontSize: ms(11.5) }}>
                                    {strengthLabel}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ── Confirm Password ── */}
                    <View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 7, marginLeft: 2 }}>
                            <View
                                style={{
                                    width: ms(24),
                                    height: ms(24),
                                    borderRadius: 9,
                                    backgroundColor: ACCENT_SOFT,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="shield-checkmark" size={ms(12)} color={ACCENT_DEEP} />
                            </View>
                            <Text style={{ color: INK, fontSize: ms(13), fontFamily: FONT.semibold }}>Confirm Password</Text>
                        </View>

                        <Animated.View style={{ transform: [{ translateX: confirmShake }] }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    height: ms(54),
                                    backgroundColor: focusedField === "confirm" ? "#FFFFFF" : BG_IDLE,
                                    borderRadius: 20,
                                    borderWidth: 1.5,
                                    borderColor:
                                        errorKey === "mismatch" || mismatchVisible
                                            ? DANGER
                                            : passwordsMatch
                                                ? SUCCESS
                                                : focusedField === "confirm"
                                                    ? ACCENT
                                                    : "transparent",
                                    paddingHorizontal: ms(16),
                                    shadowColor: "#0F172A",
                                    shadowOpacity: focusedField === "confirm" ? 0.06 : 0,
                                    shadowRadius: 12,
                                    shadowOffset: { width: 0, height: 4 },
                                    elevation: focusedField === "confirm" ? 2 : 0,
                                }}
                            >
                                <Ionicons
                                    name="checkmark-done-outline"
                                    size={ms(19)}
                                    color={focusedField === "confirm" ? INK : FAINT}
                                    style={{ marginRight: ms(11) }}
                                />
                                <TextInput
                                    ref={confirmRef}
                                    style={{ flex: 1, fontSize: ms(15), fontFamily: FONT.regular, color: INK }}
                                    placeholder="Re-enter new password"
                                    placeholderTextColor={FAINT}
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSubmit}
                                    onChangeText={(t) => {
                                        setConfirmPassword(t);
                                        if (errorKey) hideError();
                                    }}
                                    onFocus={() => setFocusedField("confirm")}
                                    onBlur={() => setFocusedField(null)}
                                    accessibilityLabel="Confirm new password"
                                />
                                {passwordsMatch && (
                                    <Ionicons name="checkmark-circle" size={ms(19)} color={SUCCESS} style={{ marginRight: ms(8) }} />
                                )}
                                <Pressable
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setShowConfirmPassword(!showConfirmPassword);
                                    }}
                                    hitSlop={10}
                                    accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={ms(19)} color={FAINT} />
                                </Pressable>
                            </View>
                        </Animated.View>

                        {/* Live match helper */}
                        {mismatchVisible && !errorKey && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 7, marginLeft: 2 }}>
                                <Ionicons name="alert-circle-outline" size={ms(13)} color={DANGER} />
                                <Text style={{ color: DANGER, fontFamily: FONT.regular, fontSize: ms(12) }}>
                                    Passwords do not match yet
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ── Compact error slot — FIXED height so the layout never shifts.
                         Short one-line message right above the button, always visible. ── */}
                    <View style={{ height: ms(26), justifyContent: "center", marginTop: ms(8) }}>
                        {err && (
                            <Animated.View
                                accessibilityRole="alert"
                                style={{
                                    opacity: errorAnim,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                }}
                            >
                                <Ionicons name={err.icon} size={ms(14)} color={DANGER} />
                                <Text
                                    numberOfLines={1}
                                    style={{ color: DANGER, fontFamily: FONT.semibold, fontSize: ms(12.5), flexShrink: 1 }}
                                >
                                    {err.title}
                                </Text>
                                <Pressable hitSlop={10} onPress={hideError} accessibilityLabel="Dismiss error">
                                    <Ionicons name="close-circle" size={ms(15)} color={DANGER} />
                                </Pressable>
                            </Animated.View>
                        )}
                    </View>

                    {/* ── Submit button (morphing pill) ── */}
                    <View
                        style={{ alignItems: "center", justifyContent: "center", marginTop: ms(4) }}
                        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                    >
                        <Animated.View style={{ transform: [{ scale: btnPressAnim }] }}>
                            <Pressable
                                onPress={handleSubmit}
                                disabled={btnState !== "idle"}
                                onPressIn={() =>
                                    btnState === "idle" &&
                                    Animated.spring(btnPressAnim, { toValue: 0.96, friction: 6, useNativeDriver: true }).start()
                                }
                                onPressOut={() =>
                                    btnState === "idle" &&
                                    Animated.spring(btnPressAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start()
                                }
                                accessibilityRole="button"
                                accessibilityLabel="Update password"
                            >
                                <Animated.View
                                    style={{
                                        width: btnWidth,
                                        height: ms(56),
                                        borderRadius: btnRadius,
                                        backgroundColor:
                                            btnState === "success" ? SUCCESS : formValid ? ACCENT : BG_IDLE,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        shadowColor: formValid ? ACCENT : "transparent",
                                        shadowOpacity: 0.45,
                                        shadowRadius: 14,
                                        shadowOffset: { width: 0, height: 6 },
                                        elevation: formValid ? 5 : 0,
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
                                            color={formValid ? INK : FAINT}
                                        />
                                        <Text
                                            style={{
                                                fontSize: ms(16),
                                                fontFamily: FONT.display,
                                                letterSpacing: 0.4,
                                                color: formValid ? INK : FAINT,
                                            }}
                                        >
                                            Update Password
                                        </Text>
                                    </Animated.View>

                                    <Animated.View style={{ opacity: loadingOpacity, position: "absolute" }}>
                                        <ActivityIndicator color={INK} />
                                    </Animated.View>

                                    <Animated.View style={{ opacity: iconOpacity, position: "absolute" }}>
                                        <Ionicons name="checkmark" size={ms(26)} color="#FFFFFF" />
                                    </Animated.View>
                                </Animated.View>
                            </Pressable>
                        </Animated.View>
                    </View>

                    {/* ── Security note ── */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            marginTop: ms(14),
                        }}
                    >
                        <Ionicons name="lock-closed-outline" size={ms(12)} color={FAINT} />
                        <Text style={{ color: FAINT, fontFamily: FONT.regular, fontSize: ms(11.5), letterSpacing: 0.4 }}>
                            Your password is encrypted and stored securely
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
