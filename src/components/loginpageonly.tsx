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
    Image,
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
import TermsAndConditionsModal from "./termsandconditions";

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

/* ── DEMO ONLY — replace with your real login API. */
const DEMO_ACCOUNTS: Record<string, string> = {
    "9876543210": "1234",
    "8789968980": "1234",
    "9102765934": "1234",
    "9810839381": "1234",
    "9826751348": "1234",
};

// Frontend-only credential store used by the demo flows. A real deployment
// should replace this with the authentication API/database.
export const setDemoAccountPassword = (phone: string, password: string) => {
    DEMO_ACCOUNTS[phone] = password;
};

type SinuploginProps = {
    onSignUp?: () => void;
    onLoginSuccess?: (phone: string) => void;
    onForgotPassword?: () => void;
};

export default function Sinuplogin({ onSignUp, onLoginSuccess, onForgotPassword }: SinuploginProps) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    /* ── Responsive scale ── */
    const ms = useCallback(
        (size: number, factor = 0.55) => {
            const scaled = (width / 375) * size;
            return Math.round(size + (scaled - size) * factor);
        },
        [width],
    );
    const isSmallScreen = height < 700;

    const IMAGE_SIZE = Math.min(width * (isSmallScreen ? 0.34 : 0.42), 160);
    const BLOB_SIZE = IMAGE_SIZE * 1.12;

    const loginImage = require("../../assets/expo.icon/Assets/flat-hand-drawn-dual-team-coworking-space_23-2148832031-Photoroom.png");

    /* ── Pre-compute ms() values for use inside worklets ──
       Worklets run on the UI thread and cannot call JS functions like ms().
       We compute these once per render and pass them as plain numbers. */
    const MS_14 = ms(14);
    const MS_20 = ms(20);

    /* ── Form state ── */
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState<{ phone?: boolean; password?: boolean }>({});

    const focusedRef = useRef<"phone" | "password" | null>(null);
    const phoneRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);

    const [btnState, setBtnState] = useState<"idle" | "loading" | "success">("idle");
    const [loginError, setLoginError] = useState<"notFound" | "wrongPassword" | null>(null);
    const [termsVisible, setTermsVisible] = useState(false);
    const [termsTab, setTermsTab] = useState<"terms" | "privacy">("terms");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ═══════════════════════ Shared Values ═══════════════════════
       All animation state lives on the UI thread → 60fps, zero JS bridge lag. */
    const phoneFocusAnim = useSharedValue(0);
    const passwordFocusAnim = useSharedValue(0);
    const phoneShake = useSharedValue(0);
    const passwordShake = useSharedValue(0);
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

    /* ── Shared values that mirror React state for worklet access ──
       Worklets cannot access React state/objects. We sync these via useEffect. */
    const isPhoneDanger = useSharedValue(0);   // 1 = show DANGER border
    const isPasswordDanger = useSharedValue(0);

    /* ── Computed values ── */
    const phoneValid = /^[6-9]\d{9}$/.test(phoneNumber);
    const passwordValid = password.length >= 4;
    const formValid = phoneValid && passwordValid;

    /* ── Sync React state → shared values for worklet access ── */
    useEffect(() => {
        isPhoneDanger.value = (touched.phone && !phoneValid) ? 1 : 0;
    }, [touched.phone, phoneValid]);

    useEffect(() => {
        isPasswordDanger.value = ((touched.password && !passwordValid) || loginError === "wrongPassword") ? 1 : 0;
    }, [touched.password, passwordValid, loginError]);

    /* ═══════════════════════ Animated Styles ═══════════════════════
       Only shared values & Reanimated functions inside worklets. No JS functions
       (ms, callbacks) or React state objects (touched, loginError). */

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

    const passwordFocusStyle = useAnimatedStyle(() => {
        'worklet';
        const focusBorder = interpolateColor(passwordFocusAnim.value, [0, 1], [BORDER_IDLE, ACCENT]);
        return {
            borderColor: isPasswordDanger.value ? DANGER : focusBorder,
            backgroundColor: interpolateColor(passwordFocusAnim.value, [0, 1], [BG_IDLE, "#FFFFFF"]),
        };
    });

    const phoneChipStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(phoneFocusAnim.value, [0, 1], ["#EFF1F4", ACCENT_SOFT]),
    }));

    const passwordChipStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(passwordFocusAnim.value, [0, 1], ["#EFF1F4", ACCENT_SOFT]),
    }));

    const phoneShakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: phoneShake.value * 6 }],
    }));

    const passwordShakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: passwordShake.value * 6 }],
    }));

    const errorBannerStyle = useAnimatedStyle(() => ({
        opacity: errorBannerAnim.value,
        transform: [{ translateY: interpolate(errorBannerAnim.value, [0, 1], [-8, 0]) }],
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
        fadeAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
        slideAnim.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
    }, []);

    /* ── Smooth, jitter-free header collapse ──
       WHY THE OLD VERSION JUMPED UP & DOWN:
       1. withSpring on a HEIGHT overshoots → visible bounce/wobble.
       2. Android's keyboardDidShow fires AFTER the keyboard is already up,
          so the window resize and the hero collapse happened at different
          times → double movement.
       3. The 500ms hide delay raced with the next show event when switching
          fields → expand started, then collapse kicked in → up-down jump.

       THE FIX:
       - Collapse is driven by input FOCUS (fires instantly, before the
         keyboard opens) → one single, early, predictable motion.
       - withTiming with a cubic ease — timing never overshoots a height.
       - Expand only happens on keyboard hide AND only when no input is
         focused, with a tiny 80ms debounce to absorb field-switch events. */
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
            // Keyboard is GONE → the hero image must ALWAYS come back.
            // (On Android, closing the keyboard with the back button does NOT
            // blur the input, so focusedRef stays set — the old
            // `if (focusedRef.current === null)` check kept the image hidden
            // forever. Switching between inputs never fires a keyboard-hide
            // event, so expanding unconditionally here is safe — no jitter.)
            focusedRef.current = null;
            headerAnim.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
        }, 80);
    }, []);

    useEffect(() => {
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        // Show listener is only a BACKUP (e.g. external keyboard toggle) —
        // the primary collapse trigger is input onFocus, which fires earlier.
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

    /* ═══════════════════════ Animation Helpers ═══════════════════════ */

    const shake = (sv: SharedValue<number>) => {
        sv.value = withSequence(
            withTiming(1, { duration: 50 }),
            withTiming(-1, { duration: 50 }),
            withTiming(1, { duration: 50 }),
            withTiming(-1, { duration: 50 }),
            withTiming(0, { duration: 50 }),
        );
    };

    const showLoginError = (type: "notFound" | "wrongPassword") => {
        setLoginError(type);
        errorBannerAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
    };

    const hideLoginError = () => {
        errorBannerAnim.value = withTiming(0, { duration: 180 }, (finished) => {
            if (finished) runOnJS(setLoginError)(null);
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

    const handleAction = () => {
        if (btnState !== "idle") return;
        if (loginError) hideLoginError();

        if (!phoneValid) {
            setTouched((t) => ({ ...t, phone: true }));
            shake(phoneShake);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            phoneRef.current?.focus();
            return;
        }
        if (!passwordValid) {
            setTouched((t) => ({ ...t, password: true }));
            shake(passwordShake);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            passwordRef.current?.focus();
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setBtnState("loading");
        Keyboard.dismiss();

        btnWidthAnim.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.exp) });
        textOpacity.value = withTiming(0, { duration: 180 });
        loadingOpacity.value = withDelay(100, withTiming(1, { duration: 280 }));

        successTimerRef.current = setTimeout(() => {
            const registeredPassword = DEMO_ACCOUNTS[phoneNumber];

            if (registeredPassword === undefined) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                resetButtonToIdle();
                showLoginError("notFound");
                return;
            }
            if (password !== registeredPassword) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                resetButtonToIdle();
                shake(passwordShake);
                showLoginError("wrongPassword");
                return;
            }

            setBtnState("success");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadingOpacity.value = withTiming(0, { duration: 180 });
            iconOpacity.value = withDelay(100, withTiming(1, { duration: 280 }));
            onLoginSuccess?.(phoneNumber);
        }, 1800);
    };

    /* ── Static styles ��─ */
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

    /* ═══════════════════════ JSX ═══════════════════════ */
    return (
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            {/* ── Decorative curved backdrop ── */}
            <Animated.View
                pointerEvents="none"
                className="absolute"
                style={[
                    {
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
                className="absolute"
                style={[
                    {
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
                    paddingTop: 8,
                    paddingBottom: Math.max(insets.bottom, 16),
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                bounces={false}
            >
                <Animated.View style={entranceStyle}>
                    {/* ── Header: image inside an organic curved blob ── */}
                    <Animated.View className="items-center" style={headerMarginStyle}>
                        <Animated.View
                            className="w-full items-center justify-center overflow-hidden"
                            style={heroContainerStyle}
                        >
                            <Text
                                pointerEvents="none"
                                className="absolute"
                                style={{
                                    fontSize: BLOB_SIZE * 0.42,
                                    fontFamily: FONT.displayHeavy,
                                    color: "#F3F4F6",
                                    letterSpacing: ms(6),
                                    transform: [{ rotate: "-4deg" }],
                                }}
                            >
                                LOGIN
                            </Text>

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
                                }}
                            >
                                <Image
                                    source={loginImage}
                                    style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                                    resizeMode="contain"
                                />
                            </View>

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
                            <View className="items-center justify-center" style={{ marginTop: ms(10) }}>
                                <View
                                    pointerEvents="none"
                                    className="absolute"
                                    style={{
                                        bottom: ms(2),
                                        right: -ms(6),
                                        width: ms(98),
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
                                        fontSize: ms(28),
                                        color: INK,
                                        fontFamily: FONT.displayHeavy,
                                        letterSpacing: -0.8,
                                    }}
                                >
                                    Welcome Back
                                </Text>
                            </View>

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
                                Sign in securely with your mobile number
                            </Text>
                        </Animated.View>
                    </Animated.View>

                    {/* ── Mobile Number ── */}
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
                                        if (loginError) hideLoginError();
                                    }}
                                    onFocus={() => {
                                        focusedRef.current = "phone";
                                        phoneFocusAnim.value = withTiming(1, { duration: 200 });
                                        collapseHeader(); // collapse BEFORE the keyboard opens — no late jump
                                    }}
                                    onBlur={() => {
                                        focusedRef.current = null;
                                        phoneFocusAnim.value = withTiming(0, { duration: 200 });
                                        setTouched((t) => ({ ...t, phone: true }));
                                    }}
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onSubmitEditing={() => passwordRef.current?.focus()}
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
                        {touched.phone && !phoneValid && (
                            <View className="flex-row items-center mt-1.5 ml-1 gap-1">
                                <Ionicons name="alert-circle-outline" size={ms(13)} color={DANGER} />
                                <Text style={{ color: DANGER, fontSize: ms(12), fontFamily: FONT.regular }}>
                                    Enter a valid 10-digit mobile number
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ── Password ── */}
                    <View className="mb-2">
                        <Text
                            className="mb-2 ml-1"
                            style={{ fontSize: ms(13), color: "#374151", fontFamily: FONT.semibold }}
                        >
                            Password
                        </Text>
                        <Animated.View style={passwordShakeStyle}>
                            <Animated.View
                                className="flex-row items-center"
                                style={[inputBase, passwordFocusStyle]}
                            >
                                <Animated.View className="items-center justify-center" style={[iconChip, passwordChipStyle]}>
                                    <Ionicons name="lock-closed-outline" size={ms(18)} color={INK} />
                                </Animated.View>
                                <TextInput
                                    ref={passwordRef}
                                    placeholder="Enter your password"
                                    keyboardType="default"
                                    value={password}
                                    onChangeText={(t) => {
                                        setPassword(t);
                                        if (loginError === "wrongPassword") hideLoginError();
                                    }}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => {
                                        focusedRef.current = "password";
                                        passwordFocusAnim.value = withTiming(1, { duration: 200 });
                                        collapseHeader(); // collapse BEFORE the keyboard opens — no late jump
                                    }}
                                    onBlur={() => {
                                        focusedRef.current = null;
                                        passwordFocusAnim.value = withTiming(0, { duration: 200 });
                                        setTouched((t) => ({ ...t, password: true }));
                                    }}
                                    returnKeyType="done"
                                    onSubmitEditing={handleAction}
                                    autoComplete="password"
                                    textContentType="password"
                                    accessibilityLabel="Password"
                                    className="flex-1 py-1.5"
                                    style={{ fontSize: ms(16), fontFamily: FONT.regular, color: "#1F2937", letterSpacing: 0.5 }}
                                    placeholderTextColor={FAINT}
                                />
                                <Pressable
                                    hitSlop={10}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setShowPassword((s) => !s);
                                    }}
                                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                                >
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={ms(19)} color={FAINT} />
                                </Pressable>
                            </Animated.View>
                        </Animated.View>
                        {touched.password && !passwordValid ? (
                            <View className="flex-row items-center mt-1.5 ml-1 gap-1">
                                <Ionicons name="alert-circle-outline" size={ms(13)} color={DANGER} />
                                <Text style={{ color: DANGER, fontSize: ms(12), fontFamily: FONT.regular }}>
                                    Password must be at least 4 characters
                                </Text>
                            </View>
                        ) : (
                            <Pressable
                                hitSlop={8}
                                className="self-end mt-2 mr-0.5"
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    onForgotPassword?.();
                                }}
                            >
                                <Text style={{ color: ACCENT_DEEP, fontFamily: FONT.semibold, fontSize: ms(13) }}>
                                    Forgot Password?
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {/* ── Login error banner ── */}
                    {loginError && (
                        <Animated.View
                            accessibilityRole="alert"
                            className="bg-red-50 border border-red-200 rounded-[18px]"
                            style={[{ marginTop: ms(18), padding: ms(14) }, errorBannerStyle]}
                        >
                            <View className="flex-row items-start gap-2.5">
                                <View
                                    className="bg-red-100 rounded-xl items-center justify-center"
                                    style={{ width: ms(34), height: ms(34) }}
                                >
                                    <Ionicons
                                        name={loginError === "notFound" ? "person-remove-outline" : "key-outline"}
                                        size={ms(17)}
                                        color={DANGER}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-red-900" style={{ fontFamily: FONT.semibold, fontSize: ms(13.5) }}>
                                        {loginError === "notFound" ? "Account not found" : "Invalid password"}
                                    </Text>
                                    <Text
                                        className="text-red-700 mt-0.5"
                                        style={{ fontFamily: FONT.regular, fontSize: ms(12.5), lineHeight: ms(18) }}
                                    >
                                        {loginError === "notFound"
                                            ? "No account exists with this mobile number. You need to sign up first to continue."
                                            : "The password you entered is incorrect. Please try again or reset your password."}
                                    </Text>
                                    <Pressable
                                        hitSlop={8}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            if (loginError === "notFound") {
                                                onSignUp?.();
                                            } else {
                                                setPassword("");
                                                hideLoginError();
                                                passwordRef.current?.focus();
                                            }
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel={loginError === "notFound" ? "Sign up now" : "Try again"}
                                        className="self-start flex-row items-center gap-[5px] bg-red-500 rounded-full mt-2.5"
                                        style={{ paddingHorizontal: ms(14), paddingVertical: 7 }}
                                    >
                                        <Text className="text-white" style={{ fontFamily: FONT.semibold, fontSize: ms(12.5) }}>
                                            {loginError === "notFound" ? "Sign Up Now" : "Try Again"}
                                        </Text>
                                        <Ionicons
                                            name={loginError === "notFound" ? "arrow-forward" : "refresh"}
                                            size={ms(13)}
                                            color="#FFFFFF"
                                        />
                                    </Pressable>
                                </View>
                                <Pressable hitSlop={10} onPress={hideLoginError} accessibilityLabel="Dismiss error">
                                    <Ionicons name="close" size={ms(16)} color="#B91C1C" />
                                </Pressable>
                            </View>
                        </Animated.View>
                    )}

                    {/* ── Submit Button (morphing pill) ── */}
                    <View
                        className="items-center justify-center"
                        style={{ marginTop: ms(16) }}
                        onLayout={(e) => {
                            containerWidthSV.value = e.nativeEvent.layout.width;
                        }}
                    >
                        <Pressable
                            onPress={handleAction}
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
                            accessibilityLabel="Login"
                            className="w-full items-center"
                        >
                            <Animated.View className="items-center" style={btnScaleStyle}>
                                <Animated.View
                                    className="flex-row items-center justify-center"
                                    style={[
                                        {
                                            backgroundColor: btnState === "success" ? SUCCESS : formValid ? ACCENT : "#F3F4F6",
                                            height: ms(58),
                                            shadowColor: ACCENT,
                                            shadowOpacity: formValid ? 0.45 : 0,
                                            shadowRadius: 14,
                                            shadowOffset: { width: 0, height: 6 },
                                            elevation: formValid ? 8 : 0,
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
                                                color: formValid ? INK : FAINT,
                                            }}
                                        >
                                            Login to Continue
                                        </Text>
                                        <Ionicons name="arrow-forward" size={ms(18)} color={formValid ? INK : FAINT} />
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

                    {/* ── Divider ── */}
                    <View className="flex-row items-center gap-2.5" style={{ marginTop: ms(14) }}>
                        <View className="flex-1 h-px" style={{ backgroundColor: BORDER_IDLE }} />
                        <Text style={{ color: FAINT, fontFamily: FONT.regular, fontSize: ms(11), letterSpacing: 1.2 }}>
                            OR
                        </Text>
                        <View className="flex-1 h-px" style={{ backgroundColor: BORDER_IDLE }} />
                    </View>

                    {/* ── Sign Up ── */}
                    <View className="flex-row justify-center items-center" style={{ marginTop: ms(12) }}>
                        <Text style={{ color: MUTED, fontFamily: FONT.regular, fontSize: ms(14) }}>
                            New here?{" "}
                        </Text>
                        <Pressable
                            hitSlop={10}
                            onPress={() => {
                                Haptics.selectionAsync();
                                onSignUp?.();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Create a new account"
                            className="items-center"
                        >
                            <View className="flex-row items-center gap-[3px]">
                                <Text style={{ color: INK, fontFamily: FONT.display, fontSize: ms(14.5) }}>
                                    Create an Account
                                </Text>
                                <Ionicons name="arrow-forward" size={ms(14)} color={INK} />
                            </View>
                            <View className="w-[88%] h-[3px] rounded-sm mt-0.5" style={{ backgroundColor: ACCENT }} />
                        </Pressable>
                    </View>

                    <View className="flex-row justify-center items-center" style={{ marginTop: ms(12) }}>
                        <Text style={{ color: FAINT, fontFamily: FONT.light, fontSize: ms(11.5) }}>
                            By continuing, you agree to our
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
