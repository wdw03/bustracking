import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
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
const ACCENT_DEEP = "#E6BC00";
const INK = "#101010";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER_IDLE = "#ECEDF0";
const BG_IDLE = "#F7F8FA";
const SUCCESS = "#16A34A";
const DANGER = "#DC2626";

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
const HERO_VIDEO = require("../../../assets/expo.icon/Assets/happy-family-animation-gif-download-5804610.mp4");

type Relation = "Father" | "Mother" | "Guardian" | "Other";

const RELATIONS: { key: Relation; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "Father", icon: "man-outline" },
    { key: "Mother", icon: "woman-outline" },
    { key: "Guardian", icon: "shield-outline" },
    { key: "Other", icon: "people-outline" },
];

type FieldKey = "fullName" | "password" | "confirmPassword";

type FieldConfig = {
    key: FieldKey;
    label: string;
    placeholder: string;
    icon: keyof typeof Ionicons.glyphMap;
    secure?: boolean;
    autoCapitalize?: "none" | "words" | "sentences" | "characters";
};

const STEP_META = [
    { title: "Parent Profile", subtitle: "Your name & relation with child", icon: "people-outline" as const },
    { title: "Security", subtitle: "Create a strong password", icon: "lock-closed-outline" as const },
];

const STEP_FIELDS: FieldConfig[][] = [
    [
        { key: "fullName", label: "Parent Full Name", placeholder: "Enter your full name", icon: "person-outline", autoCapitalize: "words" },
    ],
    [
        { key: "password", label: "Password", placeholder: "Create password (min 6)", icon: "lock-closed-outline", secure: true },
        { key: "confirmPassword", label: "Confirm Password", placeholder: "Re-enter password", icon: "checkmark-done-outline", secure: true },
    ],
];

/* ─────────────────────────── Validation ─────────────────────────── */
function validateField(key: FieldKey, value: string, all: Record<FieldKey, string>): string | null {
    switch (key) {
        case "fullName": return value.trim().length >= 3 ? null : "Enter your full name";
        case "password": return value.length >= 6 ? null : "Min 6 characters";
        case "confirmPassword": return value === all.password && value.length > 0 ? null : "Passwords do not match";
    }
}

export type ParentSignupData = { fullName: string; relation: Relation; password: string; confirmPassword: string };

type ParentSignupPageProps = {
    onBack?: () => void;
    onSubmit?: (data: ParentSignupData) => void;
};

/* ═══════════════════════════ Big Input Field with Shaking ═══════════════════════════ */
function BigField({
    cfg, value, error, shakeTrigger, onChange, onFocusField, secureShown, onToggleSecure,
    inputRef, onSubmitEditing, isLast, ms,
}: {
    cfg: FieldConfig;
    value: string;
    error: string | null;
    shakeTrigger?: number;
    onChange: (t: string) => void;
    onFocusField: () => void;
    secureShown?: boolean;
    onToggleSecure?: () => void;
    inputRef?: (r: TextInput | null) => void;
    onSubmitEditing?: () => void;
    isLast?: boolean;
    ms: (n: number, f?: number) => number;
}) {
    const focus = useSharedValue(0);
    const fieldShake = useSharedValue(0);
    const valid = value.length > 0 && !error;

    useEffect(() => {
        if (shakeTrigger && shakeTrigger > 0) {
            fieldShake.value = withSequence(
                withTiming(-10, { duration: 45 }),
                withTiming(10, { duration: 45 }),
                withTiming(-7, { duration: 45 }),
                withTiming(7, { duration: 45 }),
                withTiming(-4, { duration: 45 }),
                withTiming(4, { duration: 45 }),
                withTiming(0, { duration: 45 }),
            );
        }
    }, [shakeTrigger]);

    const boxStyle = useAnimatedStyle(() => ({
        borderColor: error
            ? DANGER
            : interpolateColor(focus.value, [0, 1], [BORDER_IDLE, ACCENT]),
        backgroundColor: interpolateColor(focus.value, [0, 1], [BG_IDLE, "#FFFFFF"]),
        shadowOpacity: interpolate(focus.value, [0, 1], [0, 0.1]),
        transform: [{ translateX: fieldShake.value }],
    }));

    const chipStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(focus.value, [0, 1], ["#FFFFFF", ACCENT_SOFT]),
    }));

    return (
        <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: ms(7), marginLeft: 2 }}>
                <Text style={{ fontSize: ms(12.5), color: INK, fontFamily: FONT.semibold, letterSpacing: 0.2 }}>
                    {cfg.label}
                </Text>
                {error ? (
                    <Text numberOfLines={1} style={{ fontSize: ms(11), color: DANGER, fontFamily: FONT.regular, flexShrink: 1 }}>
                        {"· " + error}
                    </Text>
                ) : null}
            </View>

            <Animated.View
                style={[
                    boxStyle,
                    {
                        flexDirection: "row", alignItems: "center", gap: ms(10),
                        borderWidth: 1.5, borderRadius: 19,
                        borderTopLeftRadius: ms(24),
                        paddingHorizontal: ms(11), height: ms(56),
                        shadowColor: ACCENT_DEEP, shadowRadius: 12, shadowOffset: { width: 0, height: 5 },
                        elevation: 1,
                    },
                ]}
            >
                <Animated.View
                    style={[
                        chipStyle,
                        {
                            width: ms(36), height: ms(36),
                            borderRadius: 13, borderTopLeftRadius: ms(17),
                            alignItems: "center", justifyContent: "center",
                            borderWidth: 1, borderColor: "#F5E6A3",
                        },
                    ]}
                >
                    <Ionicons name={cfg.icon} size={ms(17)} color={ACCENT_DEEP} />
                </Animated.View>

                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChange}
                    placeholder={cfg.placeholder}
                    placeholderTextColor={FAINT}
                    secureTextEntry={cfg.secure ? !secureShown : false}
                    autoCapitalize={cfg.autoCapitalize ?? "sentences"}
                    autoCorrect={false}
                    returnKeyType={isLast ? "done" : "next"}
                    onSubmitEditing={onSubmitEditing}
                    blurOnSubmit={isLast}
                    onFocus={() => {
                        focus.value = withTiming(1, { duration: 180 });
                        onFocusField();
                    }}
                    onBlur={() => {
                        focus.value = withTiming(0, { duration: 180 });
                    }}
                    accessibilityLabel={cfg.label}
                    style={{
                        flex: 1, fontSize: ms(15.5), color: INK,
                        fontFamily: FONT.regular, paddingVertical: 0,
                    }}
                />
                {cfg.secure ? (
                    <Pressable
                        hitSlop={10}
                        onPress={() => {
                            Haptics.selectionAsync();
                            onToggleSecure?.();
                        }}
                        accessibilityLabel={secureShown ? "Hide password" : "Show password"}
                    >
                        <Ionicons name={secureShown ? "eye-off-outline" : "eye-outline"} size={ms(19)} color={MUTED} />
                    </Pressable>
                ) : valid ? (
                    <Ionicons name="checkmark-circle" size={ms(19)} color={SUCCESS} />
                ) : null}
            </Animated.View>
        </View>
    );
}

/* ═══════════════════════════ Relation Chip ═══════════════════════════ */
function RelationChip({
    item, selected, onPress, ms,
}: {
    item: { key: Relation; icon: keyof typeof Ionicons.glyphMap };
    selected: boolean;
    onPress: () => void;
    ms: (n: number, f?: number) => number;
}) {
    const press = useSharedValue(1);
    const sel = useSharedValue(selected ? 1 : 0);

    useEffect(() => {
        sel.value = withTiming(selected ? 1 : 0, { duration: 200 });
    }, [selected]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: press.value }],
        borderColor: interpolateColor(sel.value, [0, 1], [BORDER_IDLE, ACCENT]),
        backgroundColor: interpolateColor(sel.value, [0, 1], [BG_IDLE, "#FFFDF2"]),
    }));

    return (
        <Animated.View style={[style, { flexBasis: "47%", flexGrow: 1, borderWidth: 1.5, borderRadius: 18, borderTopLeftRadius: ms(22) }]}>
            <Pressable
                onPressIn={() => { press.value = withSpring(0.96, { damping: 20, stiffness: 300 }); }}
                onPressOut={() => { press.value = withSpring(1, { damping: 16, stiffness: 240 }); }}
                onPress={onPress}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={item.key}
                style={{ flexDirection: "row", alignItems: "center", gap: ms(9), paddingHorizontal: ms(12), paddingVertical: ms(13) }}
            >
                <View
                    style={{
                        width: ms(32), height: ms(32),
                        borderRadius: 12, borderTopLeftRadius: ms(15),
                        backgroundColor: selected ? ACCENT : "#FFFFFF",
                        borderWidth: 1, borderColor: selected ? ACCENT : "#F5E6A3",
                        alignItems: "center", justifyContent: "center",
                    }}
                >
                    <Ionicons name={item.icon} size={ms(16)} color={selected ? INK : ACCENT_DEEP} />
                </View>
                <Text style={{ flex: 1, fontSize: ms(13.5), color: INK, fontFamily: selected ? FONT.display : FONT.regular }}>
                    {item.key}
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={ms(17)} color={ACCENT_DEEP} />}
            </Pressable>
        </Animated.View>
    );
}

/* ═══════════════════════════ Main Page ═══════════════════════════ */
export default function ParentSignupPage({ onBack, onSubmit }: ParentSignupPageProps) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const BASE = 390;
    const scale = Math.min(Math.max(width / BASE, 0.82), 1.15);
    const ms = useCallback((n: number, f = 0.35) => n + (n * scale - n) * (1 - f), [scale]);
    const isShort = height < 700;

    const BLOB_SIZE = Math.min(width * (isShort ? 0.32 : 0.4), 158);

    const player = useVideoPlayer(HERO_VIDEO, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    /* ── Form State ── */
    const [data, setData] = useState<Record<FieldKey, string>>({ fullName: "", password: "", confirmPassword: "" });
    const [relation, setRelation] = useState<Relation | null>(null);
    const [relationError, setRelationError] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<FieldKey, string | null>>>({});
    const [shakeTriggers, setShakeTriggers] = useState<Partial<Record<FieldKey, number>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsError, setTermsError] = useState(false);

    const [step, setStep] = useState(0);
    const isLastStep = step === STEP_META.length - 1;

    const inputRefs = useRef<Partial<Record<FieldKey, TextInput | null>>>({});
    const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => () => { if (submitTimerRef.current) clearTimeout(submitTimerRef.current); }, []);

    /* ── Keyboard-aware hero collapse ── */
    const headerAnim = useSharedValue(0);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const collapseHeader = useCallback(() => {
        if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
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

    const heroHeight = BLOB_SIZE + ms(8);
    const heroStyle = useAnimatedStyle(() => ({
        height: interpolate(headerAnim.value, [0, 1], [heroHeight, 0]),
        opacity: interpolate(headerAnim.value, [0, 0.5], [1, 0]),
        overflow: "hidden" as const,
    }));

    /* ── Step transition ── */
    const stepAnim = useSharedValue(1);
    const stepDir = useSharedValue(1);

    const goToStep = (next: number) => {
        stepDir.value = next > step ? 1 : -1;
        stepAnim.value = 0;
        setStep(next);
        stepAnim.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    };

    const stepStyle = useAnimatedStyle(() => ({
        opacity: stepAnim.value,
        transform: [{ translateX: interpolate(stepAnim.value, [0, 1], [stepDir.value * 46, 0]) }],
    }));

    /* ── Button press ── */
    const btnPress = useSharedValue(1);
    const btnStyle = useAnimatedStyle(() => ({
        transform: [{ scale: btnPress.value }],
    }));

    /* ── Handlers ── */
    const setField = (key: FieldKey, v: string) => {
        setData((d) => ({ ...d, [key]: v }));
        setErrors((e) => (e[key] ? { ...e, [key]: null } : e));
    };

    const validateStep = (idx: number): boolean => {
        const stepFields = STEP_FIELDS[idx];
        const nextErrors: Partial<Record<FieldKey, string | null>> = {};
        const nextTriggers: Partial<Record<FieldKey, number>> = {};
        let firstBad: FieldKey | null = null;

        for (const f of stepFields) {
            const err = validateField(f.key, data[f.key], data);
            nextErrors[f.key] = err;
            if (err) {
                nextTriggers[f.key] = (shakeTriggers[f.key] || 0) + 1;
                if (!firstBad) firstBad = f.key;
            }
        }
        setErrors((e) => ({ ...e, ...nextErrors }));
        setShakeTriggers((s) => ({ ...s, ...nextTriggers }));

        const relMissing = idx === 0 && relation === null;
        if (relMissing) setRelationError(true);

        if (firstBad || relMissing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (firstBad) {
                collapseHeader();
                inputRefs.current[firstBad]?.focus();
            }
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep(step)) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Keyboard.dismiss();
        goToStep(step + 1);
    };

    const handleBackStep = () => {
        Haptics.selectionAsync();
        Keyboard.dismiss();
        if (step === 0) onBack?.();
        else goToStep(step - 1);
    };

    const handleSubmit = () => {
        if (submitting || submitted) return;
        if (!validateStep(step)) return;
        if (!termsAccepted) {
            setTermsError(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        Keyboard.dismiss();
        setSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        submitTimerRef.current = setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSubmit?.({ ...data, relation: relation as Relation });
        }, 1400);
    };

    const stepFields = STEP_FIELDS[step];
    const focusNextOf = (idx: number) => {
        const nextField = stepFields[idx + 1];
        if (nextField) inputRefs.current[nextField.key]?.focus();
        else if (isLastStep) handleSubmit();
        else handleNext();
    };

    const progress = (step + 1) / STEP_META.length;

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <View
                pointerEvents="none"
                style={{
                    position: "absolute", top: -width * 0.34, left: -width * 0.3,
                    width: width * 0.82, height: width * 0.82,
                    borderRadius: width * 0.41, backgroundColor: ACCENT_SOFT,
                }}
            />
            <View
                pointerEvents="none"
                style={{
                    position: "absolute", top: -width * 0.22, left: -width * 0.16,
                    width: width * 0.54, height: width * 0.54,
                    borderRadius: width * 0.27, borderWidth: 1.5, borderColor: "#F5E6A3",
                }}
            />
            <View
                pointerEvents="none"
                style={{
                    position: "absolute", bottom: -width * 0.22, right: -width * 0.24,
                    width: width * 0.48, height: width * 0.48,
                    borderRadius: width * 0.24, backgroundColor: "#FFFBEB",
                }}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingTop: insets.top + ms(6),
                        paddingBottom: Math.max(insets.bottom, 14),
                        paddingHorizontal: ms(22),
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                        <Pressable
                            onPress={handleBackStep}
                            accessibilityRole="button"
                            accessibilityLabel={step === 0 ? "Go back" : "Previous step"}
                            hitSlop={8}
                            style={({ pressed }) => ({
                                width: ms(42), height: ms(42),
                                borderRadius: 16,
                                borderTopLeftRadius: ms(20), borderBottomRightRadius: ms(20),
                                backgroundColor: pressed ? ACCENT_SOFT : BG_IDLE,
                                borderWidth: 1, borderColor: BORDER_IDLE,
                                alignItems: "center", justifyContent: "center",
                            })}
                        >
                            <Ionicons name="arrow-back" size={ms(20)} color={INK} />
                        </Pressable>

                        <View style={{ flex: 1, height: ms(7), borderRadius: 5, backgroundColor: BG_IDLE, overflow: "hidden" }}>
                            <Animated.View
                                style={{
                                    width: `${progress * 100}%`, height: "100%",
                                    borderRadius: 5, backgroundColor: ACCENT,
                                }}
                            />
                        </View>

                        <View
                            style={{
                                backgroundColor: ACCENT_SOFT, borderRadius: 999,
                                paddingHorizontal: ms(10), paddingVertical: 4,
                                borderWidth: 1, borderColor: "#F5E6A3",
                            }}
                        >
                            <Text style={{ fontSize: ms(11), color: "#8A7100", fontFamily: FONT.semibold }}>
                                {step + 1}/{STEP_META.length}
                            </Text>
                        </View>
                    </View>

                    <Animated.View style={[heroStyle, { alignItems: "center", marginTop: ms(8) }]}>
                        <View style={{ width: BLOB_SIZE, height: BLOB_SIZE, alignItems: "center", justifyContent: "center" }}>
                            <Text
                                pointerEvents="none"
                                style={{
                                    position: "absolute", fontSize: BLOB_SIZE * 0.3,
                                    fontFamily: FONT.displayHeavy, color: "#F3F4F6",
                                    letterSpacing: ms(4), transform: [{ rotate: "-4deg" }],
                                }}
                            >
                                FAMILY
                            </Text>
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    width: BLOB_SIZE * 1.06, height: BLOB_SIZE * 1.06,
                                    borderRadius: BLOB_SIZE * 0.53,
                                    borderWidth: 2, borderColor: "transparent",
                                    borderRightColor: ACCENT, borderTopColor: "#F5E6A3",
                                    transform: [{ rotate: "-18deg" }],
                                }}
                            />
                            <View
                                style={{
                                    width: BLOB_SIZE * 0.92, height: BLOB_SIZE * 0.92,
                                    backgroundColor: "#FFFFFF",
                                    borderTopLeftRadius: BLOB_SIZE * 0.4,
                                    borderTopRightRadius: BLOB_SIZE * 0.56,
                                    borderBottomRightRadius: BLOB_SIZE * 0.36,
                                    borderBottomLeftRadius: BLOB_SIZE * 0.52,
                                    borderWidth: 2, borderColor: ACCENT_SOFT,
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
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute", top: BLOB_SIZE * 0.04, left: BLOB_SIZE * 0.05,
                                    width: ms(12), height: ms(12), borderRadius: 6, backgroundColor: ACCENT,
                                }}
                            />
                        </View>
                    </Animated.View>

                    <View style={{ alignItems: "center", marginTop: ms(6) }}>
                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute", bottom: ms(1), right: -ms(4),
                                    width: ms(126), height: ms(11),
                                    backgroundColor: ACCENT, opacity: 0.8,
                                    borderTopLeftRadius: ms(10), borderTopRightRadius: ms(3),
                                    borderBottomRightRadius: ms(10), borderBottomLeftRadius: ms(3),
                                    transform: [{ rotate: "-1.5deg" }],
                                }}
                            />
                            <Text style={{ fontSize: ms(22), color: INK, fontFamily: FONT.displayHeavy, letterSpacing: -0.5 }}>
                                Parent Registration
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: ms(6) }}>
                            <Ionicons name={STEP_META[step].icon} size={ms(13)} color={ACCENT_DEEP} />
                            <Text style={{ fontSize: ms(13), color: INK, fontFamily: FONT.display }}>
                                {STEP_META[step].title}
                            </Text>
                            <Text style={{ fontSize: ms(12), color: FAINT, fontFamily: FONT.regular }}>
                                {"— " + STEP_META[step].subtitle}
                            </Text>
                        </View>
                    </View>

                    <Animated.View style={[stepStyle, { marginTop: ms(16), gap: ms(15), flexGrow: 1 }]}>
                        {stepFields.map((cfg, flatIdx) => {
                            const isConfirm = cfg.key === "confirmPassword";
                            const isPass = cfg.key === "password";
                            return (
                                <BigField
                                    key={cfg.key}
                                    cfg={cfg}
                                    value={data[cfg.key]}
                                    error={errors[cfg.key] ?? null}
                                    shakeTrigger={shakeTriggers[cfg.key]}
                                    onChange={(t) => setField(cfg.key, t)}
                                    onFocusField={collapseHeader}
                                    secureShown={isPass ? showPassword : isConfirm ? showConfirm : undefined}
                                    onToggleSecure={
                                        isPass ? () => setShowPassword((s) => !s)
                                            : isConfirm ? () => setShowConfirm((s) => !s)
                                                : undefined
                                    }
                                    inputRef={(r) => { inputRefs.current[cfg.key] = r; }}
                                    onSubmitEditing={() => focusNextOf(flatIdx)}
                                    isLast={flatIdx === stepFields.length - 1 && isLastStep}
                                    ms={ms}
                                />
                            );
                        })}

                        {step === 0 && (
                            <View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: ms(7), marginLeft: 2 }}>
                                    <Text style={{ fontSize: ms(12.5), color: INK, fontFamily: FONT.semibold, letterSpacing: 0.2 }}>
                                        Relation with Child
                                    </Text>
                                    {relationError && (
                                        <Text style={{ fontSize: ms(11), color: DANGER, fontFamily: FONT.regular }}>
                                            · Please select one
                                        </Text>
                                    )}
                                </View>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ms(10) }}>
                                    {RELATIONS.map((item) => (
                                        <RelationChip
                                            key={item.key}
                                            item={item}
                                            selected={relation === item.key}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setRelation(item.key);
                                                setRelationError(false);
                                            }}
                                            ms={ms}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {isLastStep && (
                            <Pressable
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setTermsAccepted((t) => !t);
                                    setTermsError(false);
                                }}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: termsAccepted }}
                                style={{
                                    flexDirection: "row", alignItems: "center", gap: ms(10),
                                    padding: ms(13), borderRadius: 18, borderTopLeftRadius: ms(22), borderWidth: 1.5,
                                    borderColor: termsError ? DANGER : termsAccepted ? ACCENT : BORDER_IDLE,
                                    backgroundColor: termsAccepted ? "#FFFDF2" : BG_IDLE,
                                    marginTop: ms(2),
                                }}
                            >
                                <View
                                    style={{
                                        width: ms(24), height: ms(24), borderRadius: 9,
                                        backgroundColor: termsAccepted ? ACCENT : "#FFFFFF",
                                        borderWidth: 1.5,
                                        borderColor: termsAccepted ? ACCENT : termsError ? DANGER : "#D1D5DB",
                                        alignItems: "center", justifyContent: "center",
                                    }}
                                >
                                    {termsAccepted && <Ionicons name="checkmark" size={ms(15)} color={INK} />}
                                </View>
                                <Text style={{ flex: 1, fontSize: ms(12.5), color: MUTED, fontFamily: FONT.regular, lineHeight: ms(18) }}>
                                    {"I accept the "}
                                    <Text style={{ color: INK, fontFamily: FONT.semibold, textDecorationLine: "underline" }}>
                                        Terms & Conditions
                                    </Text>
                                    {" and "}
                                    <Text style={{ color: INK, fontFamily: FONT.semibold, textDecorationLine: "underline" }}>
                                        Privacy Policy
                                    </Text>
                                </Text>
                            </Pressable>
                        )}
                    </Animated.View>

                    <Animated.View style={[btnStyle, { marginTop: ms(16) }]}>
                        <Pressable
                            onPressIn={() => { btnPress.value = withSpring(0.97, { damping: 20, stiffness: 300 }); }}
                            onPressOut={() => { btnPress.value = withSpring(1, { damping: 16, stiffness: 240 }); }}
                            onPress={isLastStep ? handleSubmit : handleNext}
                            disabled={submitting || submitted}
                            accessibilityRole="button"
                            accessibilityLabel={isLastStep ? "Submit registration" : "Next step"}
                            style={{
                                height: ms(56),
                                borderRadius: 19,
                                borderTopLeftRadius: ms(26), borderBottomRightRadius: ms(26),
                                backgroundColor: submitted ? SUCCESS : ACCENT,
                                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                                shadowColor: submitted ? SUCCESS : ACCENT_DEEP,
                                shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
                                elevation: 5,
                            }}
                        >
                            {submitted ? (
                                <>
                                    <Ionicons name="checkmark-circle" size={ms(20)} color="#FFFFFF" />
                                    <Text style={{ fontSize: ms(15.5), fontFamily: FONT.display, color: "#FFFFFF" }}>
                                        Registered
                                    </Text>
                                </>
                            ) : submitting ? (
                                <Text style={{ fontSize: ms(15.5), fontFamily: FONT.display, color: INK }}>
                                    Submitting…
                                </Text>
                            ) : (
                                <>
                                    <Text style={{ fontSize: ms(15.5), fontFamily: FONT.display, color: INK, letterSpacing: 0.3 }}>
                                        {isLastStep ? "Submit" : "Continue"}
                                    </Text>
                                    <View
                                        style={{
                                            width: ms(26), height: ms(26), borderRadius: 13,
                                            backgroundColor: INK, alignItems: "center", justifyContent: "center",
                                        }}
                                    >
                                        <Ionicons
                                            name={isLastStep ? "checkmark" : "arrow-forward"}
                                            size={ms(14)}
                                            color={ACCENT}
                                        />
                                    </View>
                                </>
                            )}
                        </Pressable>
                    </Animated.View>

                    <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: ms(10) }}>
                        {STEP_META.map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    width: i === step ? ms(18) : ms(6),
                                    height: ms(6), borderRadius: 3,
                                    backgroundColor: i === step ? ACCENT : i < step ? ACCENT_DEEP : BORDER_IDLE,
                                }}
                            />
                        ))}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
