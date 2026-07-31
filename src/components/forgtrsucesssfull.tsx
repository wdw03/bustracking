import React, { useRef, useCallback, useEffect } from "react";
import {
    View,
    Text,
    Pressable,
    Animated,
    Easing,
    useWindowDimensions,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

/* ─────────────────────────── Design Tokens ───────────────────────────
   Same palette as login / forgot-password / OTP / create-password pages */
const ACCENT = "#FFD60A";
const ACCENT_SOFT = "#FFF6CC";
const ACCENT_DEEP = "#B08900";
const INK = "#101010";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const SUCCESS = "#16A34A";
const SUCCESS_SOFT = "#DCFCE7";

/* ─────────────────────────── Fonts ───────────────────────────
   PREMIUM PAIRING — Sora (display headings) + Inter (body).
   Same setup as the other auth pages:

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

type PasswordSuccessProps = {
    /** Called when the user taps "Get Started" —
        redirect to the login page here,
        e.g. () => navigation.replace("Login") */
    onGetStarted?: () => void;
};

export default function PasswordSuccessPage({ onGetStarted }: PasswordSuccessProps) {
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

    // Hero video: the celebration is the star of this page, so slightly bigger
    const IMAGE_SIZE = Math.min(width * (isSmallScreen ? 0.46 : 0.56), 220);
    const BLOB_SIZE = IMAGE_SIZE * 1.12;

    const heroVideo = require("../../assets/expo.icon/Assets/two-girls-dealing-animation-gif-download-9147725.mp4");

    const player = useVideoPlayer(heroVideo, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    /* ── Entrance animations — staged premium reveal ── */
    const heroAnim = useRef(new Animated.Value(0)).current;     // video blob pop
    const badgeAnim = useRef(new Animated.Value(0)).current;    // check badge pop
    const textAnim = useRef(new Animated.Value(0)).current;     // title + subtitle rise
    const buttonAnim = useRef(new Animated.Value(0)).current;   // button rise
    const pulseAnim = useRef(new Animated.Value(0)).current;    // badge glow pulse loop
    const btnPressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.stagger(140, [
            Animated.spring(heroAnim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
            Animated.spring(badgeAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
            Animated.timing(textAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(buttonAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();

        // Gentle infinite pulse behind the check badge
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, [heroAnim, badgeAnim, textAnim, buttonAnim, pulseAnim]);

    const rise = (anim: Animated.Value) => ({
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
    });

    const handleGetStarted = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onGetStarted?.(); // e.g. navigation.replace("Login")
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            {/* ── Curved yellow backdrop sweep (top-right) — same as other pages ── */}
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
            {/* ── Curved sweep (bottom-left) for balance ── */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    bottom: -width * 0.3,
                    left: -width * 0.3,
                    width: width * 0.66,
                    height: width * 0.66,
                    borderRadius: width * 0.33,
                    backgroundColor: ACCENT_SOFT,
                    opacity: 0.4,
                }}
            />
            {/* ── Tiny floating celebration dots ── */}
            <View pointerEvents="none" style={{ position: "absolute", top: height * 0.16, left: width * 0.12, width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT }} />
            <View pointerEvents="none" style={{ position: "absolute", top: height * 0.24, right: width * 0.14, width: 7, height: 7, borderRadius: 4, backgroundColor: SUCCESS, opacity: 0.6 }} />
            <View pointerEvents="none" style={{ position: "absolute", top: height * 0.48, left: width * 0.08, width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT_DEEP, opacity: 0.35 }} />
            <View pointerEvents="none" style={{ position: "absolute", bottom: height * 0.3, right: width * 0.1, width: 9, height: 9, borderRadius: 5, backgroundColor: ACCENT, opacity: 0.7 }} />

            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingTop: insets.top + ms(8),
                    paddingBottom: Math.max(insets.bottom, 16),
                    paddingHorizontal: ms(28),
                }}
            >
                {/* ── Hero video inside curved blob ── */}
                <Animated.View
                    style={{
                        alignItems: "center",
                        justifyContent: "center",
                        width: BLOB_SIZE * 1.14,
                        height: BLOB_SIZE * 1.14,
                        opacity: heroAnim,
                        transform: [{ scale: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                    }}
                >
                    {/* Giant watermark word behind the blob */}
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
                        DONE
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

                    {/* Organic blob — video FILLS the curve (cover), no yellow gaps */}
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
                            borderWidth: 2.5,
                            borderColor: ACCENT,
                        }}
                    />
                    <View
                        pointerEvents="none"
                        style={{
                            position: "absolute",
                            bottom: ms(8),
                            left: ms(2),
                            width: ms(10),
                            height: ms(10),
                            borderRadius: ms(5),
                            backgroundColor: ACCENT,
                        }}
                    />
                </Animated.View>

                {/* ── Success check badge — scalloped-style with pulse glow ── */}
                <Animated.View
                    style={{
                        marginTop: -ms(26),
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: badgeAnim,
                        transform: [{ scale: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
                    }}
                >
                    {/* Pulsing glow ring */}
                    <Animated.View
                        pointerEvents="none"
                        style={{
                            position: "absolute",
                            width: ms(74),
                            height: ms(74),
                            borderRadius: ms(37),
                            backgroundColor: SUCCESS_SOFT,
                            opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] }),
                            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
                        }}
                    />
                    {/* Scallop echo — rotated rounded square behind the circle */}
                    <View
                        pointerEvents="none"
                        style={{
                            position: "absolute",
                            width: ms(56),
                            height: ms(56),
                            borderRadius: ms(18),
                            backgroundColor: SUCCESS,
                            opacity: 0.25,
                            transform: [{ rotate: "22deg" }],
                        }}
                    />
                    <View
                        style={{
                            width: ms(54),
                            height: ms(54),
                            borderRadius: ms(27),
                            backgroundColor: SUCCESS,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 3.5,
                            borderColor: "#FFFFFF",
                            shadowColor: SUCCESS,
                            shadowOpacity: 0.35,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 5 },
                            elevation: 6,
                        }}
                    >
                        <Ionicons name="checkmark" size={ms(28)} color="#FFFFFF" />
                    </View>
                </Animated.View>

                {/* ── Title with curved brush-stroke highlight ── */}
                <Animated.View style={[{ alignItems: "center", marginTop: ms(18) }, rise(textAnim)]}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        {/* Curved brush-stroke behind "Changed!" */}
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
                        {/* Soft echo circle */}
                        <View
                            pointerEvents="none"
                            style={{
                                position: "absolute",
                                top: -ms(6),
                                left: -ms(16),
                                width: ms(38),
                                height: ms(38),
                                borderRadius: ms(19),
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
                            Password Changed!
                        </Text>
                    </View>

                    {/* Tapered wave underline */}
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
                            fontSize: ms(14),
                            lineHeight: ms(20),
                            marginTop: ms(10),
                            paddingHorizontal: ms(10),
                        }}
                    >
                        {"Your password has been changed successfully.\nYou can now log in with your new password."}
                    </Text>
                </Animated.View>

                {/* ── Get Started button — premium pill, redirects to Login ── */}
                <Animated.View style={[{ width: "100%", marginTop: ms(30) }, rise(buttonAnim)]}>
                    <Animated.View style={{ transform: [{ scale: btnPressAnim }] }}>
                        <Pressable
                            onPress={handleGetStarted}
                            onPressIn={() =>
                                Animated.spring(btnPressAnim, { toValue: 0.96, friction: 6, useNativeDriver: true }).start()
                            }
                            onPressOut={() =>
                                Animated.spring(btnPressAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start()
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Get started — go to login"
                            style={{
                                height: ms(56),
                                borderRadius: ms(28),
                                backgroundColor: ACCENT,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                shadowColor: ACCENT_DEEP,
                                shadowOpacity: 0.35,
                                shadowRadius: 14,
                                shadowOffset: { width: 0, height: 6 },
                                elevation: 6,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: ms(16),
                                    fontFamily: FONT.display,
                                    letterSpacing: 0.3,
                                    color: INK,
                                }}
                            >
                                Get Started
                            </Text>
                            <View
                                style={{
                                    width: ms(26),
                                    height: ms(26),
                                    borderRadius: ms(13),
                                    backgroundColor: INK,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="arrow-forward" size={ms(14)} color={ACCENT} />
                            </View>
                        </Pressable>
                    </Animated.View>

                    {/* Secure footnote */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: ms(14) }}>
                        <Ionicons name="shield-checkmark-outline" size={ms(13)} color={FAINT} />
                        <Text style={{ color: FAINT, fontFamily: FONT.regular, fontSize: ms(11.5), letterSpacing: 0.4 }}>
                            Your account is now secured
                        </Text>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}
