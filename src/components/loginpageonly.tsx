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
    Image,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

/* ─────────────────────────── Design Tokens ───────────────────────────
   Premium yellow + ink palette. Change ACCENT once to re-theme everything. */
const ACCENT = "#FFD60A";
const ACCENT_SOFT = "#FFF6CC";   // soft tint for curved blob + icon chips
const ACCENT_DEEP = "#E6BC00";   // pressed / ring color
const INK = "#101010";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER_IDLE = "#ECEDF0";
const BG_IDLE = "#F7F8FA";
const DANGER = "#EF4444";
const SUCCESS = "#16A34A";

/* ─────────────────────────── Fonts ───────────────────────────
   PREMIUM PAIRING — Sora (display headings) + Inter (body).
   Load once in your root App.tsx:

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
   });

   If Sora isn't loaded yet, point display/displayHeavy to "Inter-Bold". */
const FONT = {
    light: "Inter-Light",
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
    display: "Sora-Bold",        // headings
    displayHeavy: "Sora-ExtraBold", // hero title + watermark
};

/* ── DEMO ONLY — replace with your real login API.
   phone → password map. Registered number + wrong password shows the
   "invalid password" error; unknown number shows "account not found → sign up". */
const DEMO_ACCOUNTS: Record<string, string> = {
    "9876543210": "1234",
};

type SinuploginProps = {
    /** Called when user taps Sign Up — wire your navigation here,
        e.g. () => navigation.navigate("SignUp") */
    onSignUp?: () => void;
    /** Called after a successful login,
        e.g. () => navigation.replace("Home") */
    onLoginSuccess?: () => void;
    /** Called when user taps Forgot Password */
    onForgotPassword?: () => void;
};

export default function Sinuplogin({ onSignUp, onLoginSuccess, onForgotPassword }: SinuploginProps) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    /* ── Responsive scale ──
       ms() = moderate-scale. Base design width 375 (iPhone SE/13 mini).
       Sizes grow gently on big phones and shrink gently on small ones. */
    const ms = useCallback(
        (size: number, factor = 0.55) => {
            const scaled = (width / 375) * size;
            return Math.round(size + (scaled - size) * factor);
        },
        [width],
    );
    const isSmallScreen = height < 700;

    // Hero image: compact so the whole screen fits WITHOUT scrolling
    const IMAGE_SIZE = Math.min(width * (isSmallScreen ? 0.34 : 0.42), 160);
    const BLOB_SIZE = IMAGE_SIZE * 1.12;

    const loginImage = require("../../assets/expo.icon/Assets/flat-hand-drawn-dual-team-coworking-space_23-2148832031-Photoroom.png");

    /* ── Form state ── */
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState<{ phone?: boolean; password?: boolean }>({});

    // Track focus with a REF (not state!) to avoid re-renders that cause
    // Android's infinite focus loop. Animated values handle visual feedback
    // without triggering React re-renders.
    const focusedRef = useRef<"phone" | "password" | null>(null);

    const phoneRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const scrollRef = useRef<ScrollView>(null);

    // Animated focus values — these update without React re-renders
    const phoneFocusAnim = useRef(new Animated.Value(0)).current;
    const passwordFocusAnim = useRef(new Animated.Value(0)).current;

    const phoneBorderColor = phoneFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [BORDER_IDLE, ACCENT],
    });
    const passwordBorderColor = passwordFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [BORDER_IDLE, ACCENT],
    });
    const phoneBg = phoneFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [BG_IDLE, "#FFFFFF"],
    });
    const passwordBg = passwordFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [BG_IDLE, "#FFFFFF"],
    });
    // Icon chips tint toward the accent when their field is focused
    const phoneChipBg = phoneFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#EFF1F4", ACCENT_SOFT],
    });
    const passwordChipBg = passwordFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#EFF1F4", ACCENT_SOFT],
    });

    // Indian mobile numbers: 10 digits, starting 6–9
    const phoneValid = /^[6-9]\d{9}$/.test(phoneNumber);
    const passwordValid = password.length >= 4;
    const formValid = phoneValid && passwordValid;

    /* ── Shake animation ── */
    const phoneShake = useRef(new Animated.Value(0)).current;
    const passwordShake = useRef(new Animated.Value(0)).current;

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

    /* ── Entrance fade + slide ── */
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    /* ── Keyboard-aware header shrink (debounced) ── */
    const headerAnim = useRef(new Animated.Value(0)).current; // 0=full, 1=collapsed
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
    const subHeight = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [ms(20), 0] });
    const titleSize = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] });

    /* ── Submit button (morphs into a pill spinner, then a check) ── */
    const [btnState, setBtnState] = useState<"idle" | "loading" | "success">("idle");
    const btnWidthAnim = useRef(new Animated.Value(1)).current;
    const loadingOpacity = useRef(new Animated.Value(0)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(1)).current;
    const btnPress = useRef(new Animated.Value(1)).current;
    const [containerWidth, setContainerWidth] = useState(0);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear pending timers on unmount (prevents setState-after-unmount warnings)
    useEffect(() => () => {
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
    }, []);

    /* ── Login error banner state + animation ──
       "notFound"      → number is not registered → suggest Sign Up
       "wrongPassword" → number exists but password is invalid → suggest Forgot Password */
    const [loginError, setLoginError] = useState<"notFound" | "wrongPassword" | "serverError" | "noInternet" | null>(null);
    const errorBannerAnim = useRef(new Animated.Value(0)).current;

    const showLoginError = (type: "notFound" | "wrongPassword" | "serverError" | "noInternet") => {
        setLoginError(type);
        Animated.spring(errorBannerAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
    };
    const hideLoginError = () => {
        Animated.timing(errorBannerAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
            setLoginError(null);
        });
    };

    // Morph the pill spinner back into the full-width idle button
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

        Animated.timing(btnWidthAnim, { toValue: 0, duration: 320, easing: Easing.out(Easing.exp), useNativeDriver: false }).start();

        Animated.parallel([
            Animated.timing(textOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(loadingOpacity, { toValue: 1, duration: 280, delay: 100, useNativeDriver: true }),
        ]).start();

        // TODO: replace this timeout with your real login API call.
        // On a real backend: 404/user-not-found → "notFound",
        // 401/invalid-credentials → "wrongPassword".
        successTimerRef.current = setTimeout(() => {
            const registeredPassword = DEMO_ACCOUNTS[phoneNumber];

            if (registeredPassword === undefined) {
                // Account doesn't exist → morph the button back + show the sign-up banner
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                resetButtonToIdle();
                showLoginError("notFound");
                return;
            }

            if (password !== registeredPassword) {
                // Account exists but password is wrong → invalid password banner
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                resetButtonToIdle();
                shake(passwordShake);
                showLoginError("wrongPassword");
                return;
            }

            setBtnState("success");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Animated.parallel([
                Animated.timing(loadingOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
                Animated.timing(iconOpacity, { toValue: 1, duration: 280, delay: 100, useNativeDriver: true }),
            ]).start();
            onLoginSuccess?.(); // e.g. navigation.replace("Home")
        }, 1800);
    };

    const btnWidth = btnWidthAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [64, containerWidth || 1],
    });
    const btnRadius = btnWidthAnim.interpolate({ inputRange: [0, 1], outputRange: [32, 20] });

    /* ── Static input container style (no dynamic props = no re-render = no focus loop) ── */
    const inputBase = {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === "ios" ? 12 : 10,
        borderWidth: 1.5,
        // Soft resting shadow makes fields feel like premium cards
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
        alignItems: "center" as const,
        justifyContent: "center" as const,
        marginRight: 10,
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}>
            {/* ── Decorative curved backdrop (top-right organic sweep) ── */}
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
            <Animated.View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: width * 0.12,
                    left: -width * 0.2,
                    width: width * 0.42,
                    height: width * 0.42,
                    borderRadius: width * 0.21,
                    borderWidth: ms(22),
                    borderColor: ACCENT_SOFT,
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
                    {/* ── Header: image inside an organic curved blob ── */}
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
                                    fontSize: BLOB_SIZE * 0.42,
                                    fontFamily: FONT.displayHeavy,
                                    color: "#F3F4F6",
                                    letterSpacing: ms(6),
                                    transform: [{ rotate: "-4deg" }],
                                }}
                            >
                                LOGIN
                            </Text>

                            {/* Curved arc stroke hugging the blob's left edge */}
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

                            {/* Organic blob — asymmetric radii give a hand-drawn premium curve */}
                            <View
                                style={{
                                    width: BLOB_SIZE,
                                    height: BLOB_SIZE,
                                    backgroundColor: ACCENT_SOFT,
                                    borderTopLeftRadius: BLOB_SIZE * 0.62,
                                    borderTopRightRadius: BLOB_SIZE * 0.44,
                                    borderBottomRightRadius: BLOB_SIZE * 0.58,
                                    borderBottomLeftRadius: BLOB_SIZE * 0.4,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Image
                                    source={loginImage}
                                    style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Floating accent ring + dot for depth */}
                            <View
                                style={{
                                    position: "absolute",
                                    top: BLOB_SIZE * 0.06,
                                    right: width / 2 - BLOB_SIZE / 2 - ms(14),
                                    width: ms(26),
                                    height: ms(26),
                                    borderRadius: 13,
                                    borderWidth: 4,
                                    borderColor: ACCENT,
                                }}
                            />
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
                        </Animated.View>

                        <Animated.View style={{ alignItems: "center", transform: [{ scale: titleSize }] }}>
                            {/* Title with a curved accent sweep BEHIND the text */}
                            <View style={{ marginTop: ms(10), alignItems: "center", justifyContent: "center" }}>
                                {/* Curved brush-stroke highlight behind "Back" */}
                                <View
                                    pointerEvents="none"
                                    style={{
                                        position: "absolute",
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
                                {/* Soft curved echo behind the whole title for depth */}
                                <View
                                    pointerEvents="none"
                                    style={{
                                        position: "absolute",
                                        top: -ms(6),
                                        left: -ms(18),
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
                                    Welcome Back
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
                                Sign in securely with your mobile number
                            </Text>
                        </Animated.View>
                    </Animated.View>

                    {/* ── Mobile Number ── */}
                    <View style={{ marginBottom: ms(12) }}>
                        <Text style={{ fontSize: ms(13), marginBottom: 8, marginLeft: 4, color: "#374151", fontFamily: FONT.semibold }}>
                            Mobile Number
                        </Text>
                        <Animated.View style={{ transform: [{ translateX: Animated.multiply(phoneShake, 6) }] }}>
                            <Animated.View
                                style={{
                                    ...inputBase,
                                    borderColor: touched.phone && !phoneValid ? DANGER : phoneBorderColor,
                                    backgroundColor: phoneBg,
                                }}
                            >
                                <Animated.View style={{ ...iconChip, backgroundColor: phoneChipBg }}>
                                    <Ionicons name="call-outline" size={ms(18)} color={INK} />
                                </Animated.View>
                                <Text
                                    style={{
                                        fontSize: ms(16),
                                        fontFamily: FONT.semibold,
                                        color: "#1F2937",
                                        marginRight: 10,
                                        borderRightWidth: 1,
                                        borderRightColor: "#D1D5DB",
                                        paddingRight: 10,
                                    }}
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
                                        Animated.timing(phoneFocusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
                                    }}
                                    onBlur={() => {
                                        focusedRef.current = null;
                                        Animated.timing(phoneFocusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
                                        setTouched((t) => ({ ...t, phone: true }));
                                    }}
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                    autoComplete="tel"
                                    textContentType="telephoneNumber"
                                    accessibilityLabel="Mobile number"
                                    style={{ flex: 1, fontSize: ms(16), fontFamily: FONT.regular, color: "#1F2937", letterSpacing: 0.5, paddingVertical: 6 }}
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
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, marginLeft: 4, gap: 4 }}>
                                <Ionicons name="alert-circle-outline" size={ms(13)} color={DANGER} />
                                <Text style={{ color: DANGER, fontSize: ms(12), fontFamily: FONT.regular }}>
                                    Enter a valid 10-digit mobile number
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ── Password ── */}
                    <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: ms(13), marginBottom: 8, marginLeft: 4, color: "#374151", fontFamily: FONT.semibold }}>
                            Password
                        </Text>
                        <Animated.View style={{ transform: [{ translateX: Animated.multiply(passwordShake, 6) }] }}>
                            <Animated.View
                                style={{
                                    ...inputBase,
                                    borderColor:
                                        (touched.password && !passwordValid) || loginError === "wrongPassword"
                                            ? DANGER
                                            : passwordBorderColor,
                                    backgroundColor: passwordBg,
                                }}
                            >
                                <Animated.View style={{ ...iconChip, backgroundColor: passwordChipBg }}>
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
                                        Animated.timing(passwordFocusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
                                    }}
                                    onBlur={() => {
                                        focusedRef.current = null;
                                        Animated.timing(passwordFocusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
                                        setTouched((t) => ({ ...t, password: true }));
                                    }}
                                    returnKeyType="done"
                                    onSubmitEditing={handleAction}
                                    autoComplete="password"
                                    textContentType="password"
                                    accessibilityLabel="Password"
                                    style={{ flex: 1, fontSize: ms(16), fontFamily: FONT.regular, color: "#1F2937", letterSpacing: 0.5, paddingVertical: 6 }}
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
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, marginLeft: 4, gap: 4 }}>
                                <Ionicons name="alert-circle-outline" size={ms(13)} color={DANGER} />
                                <Text style={{ color: DANGER, fontSize: ms(12), fontFamily: FONT.regular }}>
                                    Password must be at least 4 characters
                                </Text>
                            </View>
                        ) : (
                            <Pressable hitSlop={8} onPress={onForgotPassword} style={{ alignSelf: "flex-end", marginTop: 8, marginRight: 2 }}>
                                <Text style={{ color: ACCENT_DEEP, fontFamily: FONT.semibold, fontSize: ms(13) }}>
                                    Forgot Password?
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {/* ── Login error banner — "account not found" OR "invalid password" ── */}
                    {loginError && (
                        <Animated.View
                            accessibilityRole="alert"
                            style={{
                                opacity: errorBannerAnim,
                                transform: [
                                    {
                                        translateY: errorBannerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-8, 0],
                                        }),
                                    },
                                ],
                                marginTop: ms(18),
                                backgroundColor: "#FEF2F2",
                                borderWidth: 1,
                                borderColor: "#FECACA",
                                borderRadius: 18,
                                padding: ms(14),
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
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
                                            loginError === "notFound" ? "person-remove-outline" : 
                                            loginError === "noInternet" ? "wifi-outline" : 
                                            loginError === "serverError" ? "server-outline" : "key-outline"
                                        }
                                        size={ms(17)}
                                        color={DANGER}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: "#991B1B", fontFamily: FONT.semibold, fontSize: ms(13.5) }}>
                                        {loginError === "notFound" ? "Account not found" :
                                         loginError === "noInternet" ? "No internet connection" :
                                         loginError === "serverError" ? "Server error" : "Invalid password"}
                                    </Text>
                                    <Text style={{ color: "#B91C1C", fontFamily: FONT.regular, fontSize: ms(12.5), lineHeight: ms(18), marginTop: 2 }}>
                                        {loginError === "notFound"
                                            ? "No account exists with this mobile number. You need to sign up first to continue."
                                            : loginError === "noInternet"
                                            ? "Please check your network connection and try again."
                                            : loginError === "serverError"
                                            ? "Something went wrong on our end. Please try again later."
                                            : "The password you entered is incorrect. Please try again or reset your password."}
                                    </Text>
                                    <Pressable
                                        hitSlop={8}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            if (loginError === "notFound") {
                                                onSignUp?.(); // e.g. navigation.navigate("SignUp")
                                            } else {
                                                // Clear the wrong password and let the user retype
                                                setPassword("");
                                                hideLoginError();
                                                passwordRef.current?.focus();
                                                // TODO: or navigate to your reset flow, e.g. navigation.navigate("ForgotPassword")
                                            }
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel={loginError === "notFound" ? "Sign up now" : "Try again"}
                                        style={{
                                            alignSelf: "flex-start",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 5,
                                            backgroundColor: DANGER,
                                            borderRadius: 999,
                                            paddingHorizontal: ms(14),
                                            paddingVertical: 7,
                                            marginTop: 10,
                                        }}
                                    >
                                        <Text style={{ color: "#FFFFFF", fontFamily: FONT.semibold, fontSize: ms(12.5) }}>
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
                        style={{ alignItems: "center", justifyContent: "center", marginTop: ms(16) }}
                        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                    >
                        <Pressable
                            onPress={handleAction}
                            onPressIn={() =>
                                btnState === "idle" &&
                                Animated.spring(btnPress, { toValue: 0.96, friction: 6, useNativeDriver: true }).start()
                            }
                            onPressOut={() =>
                                btnState === "idle" &&
                                Animated.spring(btnPress, { toValue: 1, friction: 6, useNativeDriver: true }).start()
                            }
                            disabled={btnState !== "idle"}
                            accessibilityRole="button"
                            accessibilityLabel="Login"
                            style={{ width: "100%", alignItems: "center" }}
                        >
                            <Animated.View style={{ transform: [{ scale: btnPress }], alignItems: "center" }}>
                                <Animated.View
                                    style={{
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: formValid ? ACCENT : "#F3F4F6",
                                        width: btnWidth,
                                        height: ms(58),
                                        borderRadius: btnRadius,
                                        shadowColor: ACCENT,
                                        shadowOpacity: formValid ? 0.45 : 0,
                                        shadowRadius: 14,
                                        shadowOffset: { width: 0, height: 6 },
                                        elevation: formValid ? 8 : 0,
                                        flexDirection: "row",
                                    }}
                                >
                                    <Animated.View style={{ opacity: textOpacity, position: "absolute", flexDirection: "row", alignItems: "center", gap: 8 }}>
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

                                    <Animated.View style={{ opacity: loadingOpacity, position: "absolute" }}>
                                        <ActivityIndicator color={INK} size="small" />
                                    </Animated.View>

                                    <Animated.View style={{ opacity: iconOpacity, position: "absolute" }}>
                                        <Ionicons name="checkmark" size={28} color={INK} />
                                    </Animated.View>
                                </Animated.View>
                            </Animated.View>
                        </Pressable>
                    </View>

                    {/* ── Divider ── */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: ms(14), gap: 10 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: BORDER_IDLE }} />
                        <Text style={{ color: FAINT, fontFamily: FONT.regular, fontSize: ms(11), letterSpacing: 1.2 }}>
                            OR
                        </Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: BORDER_IDLE }} />
                    </View>

                    {/* ── Sign Up — clean inline text with accent underline ── */}
                    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: ms(12) }}>
                        <Text style={{ color: MUTED, fontFamily: FONT.regular, fontSize: ms(14) }}>
                            New here?{" "}
                        </Text>
                        <Pressable
                            hitSlop={10}
                            onPress={() => {
                                Haptics.selectionAsync();
                                onSignUp?.(); // e.g. navigation.navigate("SignUp")
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Create a new account"
                            style={{ alignItems: "center" }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                <Text style={{ color: INK, fontFamily: FONT.display, fontSize: ms(14.5) }}>
                                    Create an Account
                                </Text>
                                <Ionicons name="arrow-forward" size={ms(14)} color={INK} />
                            </View>
                            {/* Curved accent underline under the link */}
                            <View style={{ width: "88%", height: 3, borderRadius: 2, backgroundColor: ACCENT, marginTop: 2 }} />
                        </Pressable>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: ms(12) }}>
                        <Text style={{ color: FAINT, fontFamily: FONT.light, fontSize: ms(11.5) }}>
                            By continuing, you agree to our
                        </Text>
                        <Pressable hitSlop={8}>
                            <Text style={{ color: "#1F2937", fontFamily: FONT.semibold, marginLeft: 4, fontSize: ms(11.5), textDecorationLine: "underline" }}>
                                Terms
                            </Text>
                        </Pressable>
                        <Text style={{ color: FAINT, fontFamily: FONT.light, fontSize: ms(11.5) }}>
                            {" & "}
                        </Text>
                        <Pressable hitSlop={8}>
                            <Text style={{ color: "#1F2937", fontFamily: FONT.semibold, fontSize: ms(11.5), textDecorationLine: "underline" }}>
                                Privacy Policy
                            </Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}
